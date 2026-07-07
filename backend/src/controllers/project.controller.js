const Project = require('../models/Project');
const Action = require('../models/Action');
const Axe = require('../models/Axe');
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

    const total = await Project.count({ where });

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
// FONCTION : METTRE À JOUR LE BUDGET DE L'AXE
// ============================================
const updateAxeBudget = async (axeId) => {
  try {
    console.log(`💰 Mise à jour du budget pour l'axe ID: ${axeId}`);
    
    const axe = await Axe.findByPk(axeId);
    if (!axe) {
      console.log(`❌ Axe ${axeId} non trouvé`);
      return;
    }

    // Récupérer tous les projets de l'axe
    const projects = await Project.findAll({
      where: { axe_id: axeId },
    });

    // Calculer le total utilisé
    let totalUsed = 0;
    for (const project of projects) {
      totalUsed += parseFloat(project.budget_cost || 0);
    }

    // Mettre à jour l'axe
    axe.budget_used = totalUsed;
    await axe.save();

    console.log(`💰 Axe ${axe.name_ar}: Budget total=${axe.budget_total}, Utilisé=${axe.budget_used}, Restant=${axe.getBudgetRemaining()}`);

    // Vérifier les alertes
    await checkBudgetAlert(axe);

    return axe;
  } catch (error) {
    console.error('❌ Erreur updateAxeBudget:', error);
  }
};

// ============================================
// FONCTION : VÉRIFIER LES ALERTES BUDGET
// ============================================
const checkBudgetAlert = async (axe) => {
  try {
    if (!axe.hasBudget()) {
      return;
    }

    const remainingPercentage = axe.getBudgetRemainingPercentage();
    const remaining = axe.getBudgetRemaining();

    console.log(`📊 Axe ${axe.name_ar}: ${remainingPercentage.toFixed(1)}% restant (seuil: ${axe.budget_warning_threshold}%)`);

    if (remainingPercentage > axe.budget_warning_threshold) {
      return;
    }

    const notificationController = require('./notification.controller');
    const User = require('../models/User');

    const users = await User.findAll({
      where: {
        role: { [Op.in]: ['admin', 'manager'] },
        is_active: true,
      },
    });

    if (users.length === 0) return;

    let title = '';
    let message = '';

    if (axe.isBudgetExhausted()) {
      title = `🚨 BUDGET ÉPUISÉ - ${axe.name_ar}`;
      message = `Le budget de l'axe "${axe.name_ar}" est complètement épuisé.\n\n📊 Solde restant: 0 ${axe.budget_currency}\n💰 Total utilisé: ${axe.budget_used} ${axe.budget_currency}\n📈 Total alloué: ${axe.budget_total} ${axe.budget_currency}`;
    } else {
      title = `⚠️ BUDGET CRITIQUE - ${axe.name_ar}`;
      message = `Le budget de l'axe "${axe.name_ar}" est à ${remainingPercentage.toFixed(1)}%.\n\n📊 Solde restant: ${remaining} ${axe.budget_currency}\n💰 Total utilisé: ${axe.budget_used} ${axe.budget_currency}\n📈 Total alloué: ${axe.budget_total} ${axe.budget_currency}`;
    }

    for (const user of users) {
      await notificationController.createNotification(
        user.id,
        'system',
        title,
        message,
        '/axes',
        {
          axeId: axe.id,
          axeName: axe.name_ar,
          remaining: remaining,
          used: axe.budget_used,
          total: axe.budget_total,
          percentage: remainingPercentage,
        }
      );
    }

    console.log(`📧 Alerte budget envoyée à ${users.length} utilisateurs`);

  } catch (error) {
    console.error('❌ Erreur checkBudgetAlert:', error);
  }
};

// ============================================
// FONCTION : VÉRIFIER LE BUDGET DISPONIBLE
// ============================================
const checkBudgetAvailability = async (axeId, requestedAmount, excludeProjectId = null) => {
  console.log(`🔍 Vérification du budget pour l'axe ${axeId}, montant demandé: ${requestedAmount}`);
  
  const axe = await Axe.findByPk(axeId);
  
  if (!axe) {
    return {
      success: false,
      message: 'Axe non trouvé',
    };
  }

  if (!axe.hasBudget()) {
    return {
      success: false,
      message: `Cet axe n'a pas de budget défini. Veuillez contacter l'administrateur.`,
    };
  }

  // Calculer le budget utilisé (en excluant le projet en cours de modification si nécessaire)
  let usedAmount = parseFloat(axe.budget_used || 0);
  
  if (excludeProjectId) {
    const project = await Project.findByPk(excludeProjectId);
    if (project) {
      // Soustraire l'ancien budget du projet pour ne pas le compter deux fois
      usedAmount -= parseFloat(project.budget_cost || 0);
    }
  }

  const remaining = parseFloat(axe.budget_total || 0) - usedAmount;
  
  console.log(`💰 Budget disponible: ${remaining} ${axe.budget_currency}`);
  console.log(`💰 Montant demandé: ${requestedAmount} ${axe.budget_currency}`);

  if (remaining < parseFloat(requestedAmount)) {
    return {
      success: false,
      message: `Budget insuffisant. Le budget restant de cet axe (${remaining} ${axe.budget_currency}) ne permet pas de créer ou de modifier ce projet.`,
      available: remaining,
      requested: requestedAmount,
      currency: axe.budget_currency,
    };
  }

  return {
    success: true,
    remaining: remaining,
    currency: axe.budget_currency,
  };
};

// ============================================
// CRÉER UN PROJET (AVEC LOGS + BUDGET)
// ============================================
const create = async (req, res) => {
  try {
    console.log('📝 Création d\'un projet par:', req.user.id);
    console.log('📝 Données reçues:', req.body);

    const { name_ar, description, axe_id, start_date, end_date, budget_cost } = req.body;

    if (!name_ar || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Nom, date de début et date de fin sont requis',
      });
    }

    // ============================================
    // 🔥 VÉRIFICATION DU BUDGET AVANT CRÉATION
    // ============================================
    if (axe_id && budget_cost && parseFloat(budget_cost) > 0) {
      const check = await checkBudgetAvailability(axe_id, budget_cost);
      
      if (!check.success) {
        return res.status(400).json({
          success: false,
          message: check.message,
          available: check.available,
          requested: check.requested,
          currency: check.currency,
        });
      }
    }

    // ============================================
    // CRÉER LE PROJET
    // ============================================
    const project = await Project.create({
      name_ar,
      description: description || '',
      axe_id: axe_id || null,
      start_date,
      end_date,
      status: 'pending',
      progress: 0,
      budget_cost: parseFloat(budget_cost) || 0,
      created_by: req.user.id,
    });

    console.log(`✅ Projet créé: ID=${project.id}, Budget=${project.budget_cost}`);

    await logAction(
      'CREATE',
      'projects',
      project.id,
      null,
      project.toJSON(),
      req
    );

    // ============================================
    // METTRE À JOUR LE BUDGET DE L'AXE
    // ============================================
    if (axe_id) {
      await updateAxeBudget(axe_id);
    }

    // ============================================
    // CRÉER UNE ACTION PAR DÉFAUT
    // ============================================
    await Action.create({
      project_id: project.id,
      name_ar: 'Action par défaut',
      description: 'Action créée automatiquement pour le projet',
      start_date: start_date,
      end_date: end_date,
      created_by: req.user.id,
    });

    await logAction(
      'CREATE',
      'actions',
      project.id,
      null,
      { project_id: project.id, name_ar: 'Action par défaut' },
      req
    );

    // ============================================
    // ENVOYER LES NOTIFICATIONS
    // ============================================
    try {
      const notificationController = require('./notification.controller');
      const User = require('../models/User');
      const creator = await User.findByPk(req.user.id);
      
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

    await project.reload();

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
// METTRE À JOUR UN PROJET (AVEC LOGS + BUDGET)
// ============================================
const update = async (req, res) => {
  try {
    console.log(`📝 Mise à jour du projet ${req.params.id}`);
    
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé' });
    }

    const { axe_id, budget_cost, name_ar, description, start_date, end_date, status, progress } = req.body;

    // ============================================
    // 🔥 VÉRIFICATION DU BUDGET AVANT MODIFICATION
    // ============================================
    if (axe_id && budget_cost !== undefined && parseFloat(budget_cost) > 0) {
      // Vérifier le budget en excluant le projet actuel
      const check = await checkBudgetAvailability(axe_id, budget_cost, project.id);
      
      if (!check.success) {
        return res.status(400).json({
          success: false,
          message: check.message,
          available: check.available,
          requested: check.requested,
          currency: check.currency,
        });
      }
    }

    const oldData = project.toJSON();
    const oldAxeId = project.axe_id;

    // Mettre à jour le projet
    await project.update(req.body);
    await project.reload();

    console.log(`✅ Projet ${project.id} mis à jour`);

    // ============================================
    // METTRE À JOUR LE BUDGET DES AXES
    // ============================================
    if (oldAxeId && oldAxeId !== project.axe_id) {
      await updateAxeBudget(oldAxeId);
    }
    if (project.axe_id) {
      await updateAxeBudget(project.axe_id);
    }

    await logAction(
      'UPDATE',
      'projects',
      project.id,
      oldData,
      project.toJSON(),
      req
    );

    res.json({ 
      success: true, 
      project,
      message: 'Projet mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur update project:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SUPPRIMER UN PROJET
// ============================================
const deleteProject = async (req, res) => {
  try {
    console.log(`🗑️ DELETE /api/projects/${req.params.id}`);

    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas les droits pour supprimer ce projet',
      });
    }

    const oldData = project.toJSON();
    const axeId = project.axe_id;

    await Action.destroy({
      where: { project_id: project.id },
    });

    await logAction(
      'DELETE',
      'actions',
      project.id,
      { project_id: project.id },
      null,
      req
    );

    await project.destroy();

    await logAction(
      'DELETE',
      'projects',
      project.id,
      oldData,
      null,
      req
    );

    if (axeId) {
      await updateAxeBudget(axeId);
    }

    try {
      const notificationController = require('./notification.controller');
      const User = require('../models/User');
      
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
// RÉCUPÉRER LE BUDGET DISPONIBLE D'UN AXE (API)
// ============================================
const getAvailableBudget = async (req, res) => {
  try {
    const { axeId } = req.params;
    const { excludeProjectId } = req.query;

    const check = await checkBudgetAvailability(axeId, 0, excludeProjectId || null);
    
    if (!check.success) {
      return res.status(400).json({
        success: false,
        message: check.message,
      });
    }

    res.json({
      success: true,
      available: check.remaining,
      currency: check.currency,
    });
  } catch (error) {
    console.error('❌ Erreur getAvailableBudget:', error);
    res.status(500).json({ success: false, message: error.message });
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

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteProject,
  getStats,
  getAvailableBudget, // 🔥 NOUVELLE ROUTE
};