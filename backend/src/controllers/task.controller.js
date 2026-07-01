const Task = require('../models/Task');
const Action = require('../models/Action');
const Project = require('../models/Project');
const { Op } = require('sequelize');

// ============================================
// FONCTION UTILITAIRE POUR METTRE À JOUR LA PROGRESSION
// ============================================
async function updateActionAndProjectProgress(actionId) {
  try {
    const action = await Action.findByPk(actionId);
    if (!action) return;

    const tasks = await Task.findAll({
      where: { action_id: actionId }
    });

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    let actionProgress = 0;
    if (totalTasks > 0) {
      actionProgress = Math.round((doneTasks / totalTasks) * 100);
    }

    await action.update({ progress: actionProgress });
    console.log(`📊 Action ${action.id} progression: ${actionProgress}%`);

    const project = await Project.findByPk(action.project_id);
    if (project) {
      const actions = await Action.findAll({
        where: { project_id: project.id }
      });

      const totalActions = actions.length;
      const totalProgress = actions.reduce((sum, a) => sum + parseFloat(a.progress || 0), 0);

      let projectProgress = 0;
      if (totalActions > 0) {
        projectProgress = Math.round(totalProgress / totalActions);
      }

      await project.update({ progress: projectProgress });
      console.log(`📊 Projet ${project.id} progression: ${projectProgress}%`);

      const allActionsDone = actions.every(a => a.status === 'completed' || a.progress >= 100);
      if (allActionsDone && totalActions > 0) {
        await project.update({ status: 'completed' });
        console.log(`✅ Projet ${project.id} marqué comme terminé`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur mise à jour progression:', error);
  }
}

// ============================================
// 1. RÉCUPÉRER TOUTES LES TÂCHES (AVEC PAGINATION FLEXIBLE)
// ============================================
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // 🔥 CHANGEMENT ICI : par défaut 1000, ou utiliser per_page
    const limit = parseInt(req.query.per_page) || parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const priority = req.query.priority || '';
    const assignedTo = req.query.assignedTo || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { title_ar: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (assignedTo) {
      where.assigned_to = parseInt(assignedTo);
    }

    const total = await Task.count({ where });

    const tasks = await Task.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    console.log(`📋 Page ${page}: ${tasks.length} tâches sur ${total} total`);

    res.json({
      success: true,
      tasks,
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
    console.error('❌ Erreur getAll tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 2. RÉCUPÉRER LES TÂCHES D'UN UTILISATEUR
// ============================================
const getMyTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const offset = (page - 1) * limit;

    const tasks = await Task.findAll({
      where: { assigned_to: req.user.id },
      order: [['due_date', 'ASC']],
      limit,
      offset,
    });

    const total = await Task.count({
      where: { assigned_to: req.user.id }
    });

    res.json({
      success: true,
      tasks,
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
    console.error('❌ Erreur getMyTasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 3. RÉCUPÉRER UNE TÂCHE PAR ID
// ============================================
const getById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }
    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ Erreur getById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 4. CRÉER UNE TÂCHE
// ============================================
const create = async (req, res) => {
  try {
    console.log('📝 Création d\'une tâche par:', req.user.id);
    console.log('📝 Données reçues:', req.body);
    console.log('📝 Rôle utilisateur:', req.user.role);

    const { action_id, title_ar, description, priority, start_date, due_date, assigned_to } = req.body;

    if (!action_id || !title_ar || !start_date || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'action_id, title_ar, start_date et due_date sont requis'
      });
    }

    let finalAssignedTo = assigned_to || req.user.id;
    if (req.user.role === 'member' && assigned_to && assigned_to !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas assigner des tâches à d\'autres utilisateurs'
      });
    }

    if (req.user.role === 'member') {
      finalAssignedTo = req.user.id;
    }

    const task = await Task.create({
      action_id: parseInt(action_id),
      title_ar,
      description: description || '',
      assigned_to: finalAssignedTo,
      created_by: req.user.id,
      priority: priority || 'medium',
      status: 'todo',
      progress: 0,
      start_date,
      due_date,
    });

    console.log('✅ Tâche créée:', task.id);

    await updateActionAndProjectProgress(task.action_id);

    try {
      if (finalAssignedTo !== req.user.id) {
        const User = require('../models/User');
        const assigner = await User.findByPk(req.user.id);
        const notificationController = require('./notification.controller');
        await notificationController.notifyTaskAssigned(
          finalAssignedTo,
          task,
          assigner?.full_name || assigner?.username || 'Un utilisateur'
        );
      }
    } catch (notifError) {
      console.warn('⚠️ Erreur notification:', notifError.message);
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('❌ Erreur création tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tâche',
      error: error.message
    });
  }
};

// ============================================
// 5. METTRE À JOUR LE STATUT D'UNE TÂCHE (KANBAN)
// ============================================
const updateStatus = async (req, res) => {
  try {
    console.log('🔄 Mise à jour statut tâche ID:', req.params.id);
    const { status } = req.body;

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    let progress = 0;
    if (status === 'todo') progress = 0;
    else if (status === 'in_progress') progress = 50;
    else if (status === 'review') progress = 75;
    else if (status === 'done') progress = 100;
    else if (status === 'cancelled') progress = 0;

    const updateData = { status, progress };
    if (status === 'done') {
      updateData.completed_at = new Date();
    }

    await task.update(updateData);
    await task.reload();

    console.log(`✅ Statut mis à jour: ${status}, Progression: ${progress}%`);

    await updateActionAndProjectProgress(task.action_id);

    try {
      const notificationController = require('./notification.controller');
      await notificationController.notifyTaskUpdated(
        task.assigned_to,
        task.title_ar,
        status
      );
    } catch (notifError) {
      console.warn('⚠️ Erreur notification:', notifError.message);
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ Erreur updateStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 6. METTRE À JOUR UNE TÂCHE
// ============================================
const update = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    await task.update(req.body);
    await task.reload();

    await updateActionAndProjectProgress(task.action_id);

    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ Erreur update:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 7. SUPPRIMER UNE TÂCHE
// ============================================
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }

    const actionId = task.action_id;

    await task.destroy();

    await updateActionAndProjectProgress(actionId);

    res.json({ success: true, message: 'Tâche supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur delete:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// 8. STATISTIQUES DES TÂCHES
// ============================================
const getStats = async (req, res) => {
  try {
    const total = await Task.count();
    const todo = await Task.count({ where: { status: 'todo' } });
    const inProgress = await Task.count({ where: { status: 'in_progress' } });
    const review = await Task.count({ where: { status: 'review' } });
    const done = await Task.count({ where: { status: 'done' } });
    const cancelled = await Task.count({ where: { status: 'cancelled' } });

    res.json({
      success: true,
      stats: { total, todo, inProgress, review, done, cancelled }
    });
  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EXPORTER
// ============================================
module.exports = {
  getAll,
  getMyTasks,
  getById,
  create,
  updateStatus,
  update,
  delete: deleteTask,
  getStats,
};