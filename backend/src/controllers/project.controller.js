const Project = require('../models/Project');
const Action = require('../models/Action');
const { Op } = require('sequelize');
const { logAction } = require('../middleware/logger.middleware');

// ============================================
// RÉCUPÉRER TOUS LES PROJETS AVEC PAGINATION
// ============================================
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Construire la condition de recherche
    const where = {};
    if (search) {
      where[Op.or] = [
        { name_ar: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) {
      where.status = status;
    }

    // Compter le nombre total
    const total = await Project.count({ where });

    // Récupérer les projets
    const projects = await Project.findAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    res.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('❌ Erreur getAll projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// RÉCUPÉRER UN PROJET PAR ID
// ============================================
const getById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }
    res.json({ success: true, project });
  } catch (error) {
    console.error('❌ Erreur getById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CRÉER UN PROJET (AVEC LOGS)
// ============================================
const create = async (req, res) => {
  try {
    console.log('📝 Création d\'un projet par:', req.user.id);
    console.log('📝 Données reçues:', req.body);

    const { name_ar, description, axe_id, start_date, end_date } = req.body;

    if (!name_ar || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Nom, date de début et date de fin sont requis',
      });
    }

    // Créer le projet
    const project = await Project.create({
      name_ar,
      description: description || '',
      axe_id: axe_id || null,
      start_date,
      end_date,
      status: 'pending',
      progress: 0,
      created_by: req.user.id,
    });

    console.log('✅ Projet créé:', project.id);

    // LOG - Création
    await logAction(
      'CREATE',
      'projects',
      project.id,
      null,
      project.toJSON(),
      req
    );

    // Créer automatiquement une action par défaut
    await Action.create({
      project_id: project.id,
      name_ar: 'Action par défaut',
      description: 'Action créée automatiquement pour le projet',
      start_date: start_date,
      end_date: end_date,
      created_by: req.user.id,
    });

    console.log('✅ Action par défaut créée pour le projet:', project.id);

    // LOG - Action créée automatiquement
    await logAction(
      'CREATE',
      'actions',
      project.id,
      null,
      { project_id: project.id, name_ar: 'Action par défaut' },
      req
    );

    // Notification
    try {
      const notificationController = require('./notification.controller');
      const User = require('../models/User');
      const creator = await User.findByPk(req.user.id);
      
      // Notifier les managers et admins
      const users = await User.findAll({
        where: {
          role: { [Op.in]: ['admin', 'manager'] },
          id: { [Op.ne]: req.user.id }
        }
      });

      for (const user of users) {
        await notificationController.createNotification(
          user.id,
          'system',
          `📁 Nouveau projet créé`,
          `${creator?.full_name || creator?.username || 'Un utilisateur'} a créé le projet: "${name_ar}"`,
          `/projects`,
          { projectId: project.id, projectName: name_ar }
        );
      }
    } catch (notifError) {
      console.warn('⚠️ Erreur notification:', notifError.message);
    }

    res.status(201).json({
      success: true,
      project,
      message: 'Projet et action par défaut créés avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur create project:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error.message,
    });
  }
};

// ============================================
// METTRE À JOUR UN PROJET (AVEC LOGS)
// ============================================
const update = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }

    // Sauvegarder les anciennes données pour le log
    const oldData = project.toJSON();

    await project.update(req.body);
    await project.reload();

    // LOG - Mise à jour
    await logAction(
      'UPDATE',
      'projects',
      project.id,
      oldData,
      project.toJSON(),
      req
    );

    res.json({ success: true, project });
  } catch (error) {
    console.error('❌ Erreur update project:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SUPPRIMER UN PROJET (AVEC LOGS)
// ============================================
const deleteProject = async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/projects/' + req.params.id);

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    // Vérifier si l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour supprimer ce projet',
      });
    }

    // Sauvegarder les données pour le log
    const oldData = project.toJSON();

    // Supprimer d'abord les actions liées
    await Action.destroy({
      where: { project_id: project.id },
    });

    // LOG - Suppression des actions
    await logAction(
      'DELETE',
      'actions',
      project.id,
      { project_id: project.id },
      null,
      req
    );

    // Puis supprimer le projet
    await project.destroy();

    // LOG - Suppression du projet
    await logAction(
      'DELETE',
      'projects',
      project.id,
      oldData,
      null,
      req
    );

    // Notification
    try {
      const notificationController = require('./notification.controller');
      const User = require('../models/User');
      
      // Notifier les managers et admins
      const users = await User.findAll({
        where: {
          role: { [Op.in]: ['admin', 'manager'] },
          id: { [Op.ne]: req.user.id }
        }
      });

      for (const user of users) {
        await notificationController.createNotification(
          user.id,
          'system',
          `🗑️ Projet supprimé`,
          `Le projet "${oldData.name_ar}" a été supprimé par ${req.user.full_name || req.user.username}`,
          `/projects`,
          { projectId: oldData.id, projectName: oldData.name_ar }
        );
      }
    } catch (notifError) {
      console.warn('⚠️ Erreur notification:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Projet et ses actions supprimés avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur delete project:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// RÉCUPÉRER LES STATISTIQUES DES PROJETS
// ============================================
const getStats = async (req, res) => {
  try {
    const total = await Project.count();
    const active = await Project.count({ where: { status: 'active' } });
    const completed = await Project.count({ where: { status: 'completed' } });
    const pending = await Project.count({ where: { status: 'pending' } });
    const cancelled = await Project.count({ where: { status: 'cancelled' } });

    // Progression moyenne
    const projects = await Project.findAll({
      attributes: ['progress'],
    });
    const totalProgress = projects.reduce((sum, p) => sum + parseFloat(p.progress || 0), 0);
    const avgProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

    res.json({
      success: true,
      stats: {
        total,
        active,
        completed,
        pending,
        cancelled,
        avgProgress,
      },
    });
  } catch (error) {
    console.error('❌ Erreur getStats projects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EXPORTER
// ============================================
module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteProject,
  getStats,
};