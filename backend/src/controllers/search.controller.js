const Project = require('../models/Project');
const Action = require('../models/Action');
const Task = require('../models/Task');
const User = require('../models/User');
const { Op } = require('sequelize');

// Recherche globale
const search = async (req, res) => {
  try {
    const { q, type, status, priority, assigned_to, date_from, date_to } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    const results = {
      projects: [],
      actions: [],
      tasks: [],
      users: [],
    };

    // ============================================
    // RECHERCHE DANS LES PROJETS (SANS ASSOCIATIONS)
    // ============================================
    if (!type || type === 'projects' || type === 'all') {
      const projectWhere = {};
      
      if (q) {
        projectWhere[Op.or] = [
          { name_ar: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ];
      }
      
      if (status && ['pending', 'active', 'completed', 'cancelled'].includes(status)) {
        projectWhere.status = status;
      }

      const projects = await Project.findAll({
        where: projectWhere,
        order: [['created_at', 'DESC']],
        limit: 50,
      });

      results.projects = projects;
    }

    // ============================================
    // RECHERCHE DANS LES ACTIONS
    // ============================================
    if (!type || type === 'actions' || type === 'all') {
      const actionWhere = {};
      
      if (q) {
        actionWhere[Op.or] = [
          { name_ar: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ];
      }

      const actions = await Action.findAll({
        where: actionWhere,
        order: [['created_at', 'DESC']],
        limit: 50,
      });

      results.actions = actions;
    }

    // ============================================
    // RECHERCHE DANS LES TÂCHES
    // ============================================
    if (!type || type === 'tasks' || type === 'all') {
      const taskWhere = {};
      
      if (q) {
        taskWhere[Op.or] = [
          { title_ar: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ];
      }
      
      if (status && ['todo', 'in_progress', 'review', 'done', 'cancelled'].includes(status)) {
        taskWhere.status = status;
      }
      
      if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
        taskWhere.priority = priority;
      }
      
      if (assigned_to) {
        taskWhere.assigned_to = parseInt(assigned_to);
      }
      
      if (date_from && date_to) {
        taskWhere[Op.or] = [
          { start_date: { [Op.between]: [date_from, date_to] } },
          { due_date: { [Op.between]: [date_from, date_to] } },
        ];
      }

      const tasks = await Task.findAll({
        where: taskWhere,
        order: [['due_date', 'ASC']],
        limit: 50,
      });

      results.tasks = tasks;
    }

    // ============================================
    // RECHERCHE DANS LES UTILISATEURS
    // ============================================
    if ((!type || type === 'users' || type === 'all') && q) {
      const userWhere = {
        is_active: true,
        [Op.or]: [
          { username: { [Op.like]: `%${q}%` } },
          { full_name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
        ],
      };

      const users = await User.findAll({
        where: userWhere,
        attributes: { exclude: ['password_hash'] },
        limit: 20,
      });

      results.users = users;
    }

    // ============================================
    // COMPTER LES RÉSULTATS
    // ============================================
    const counts = {
      projects: results.projects.length,
      actions: results.actions.length,
      tasks: results.tasks.length,
      users: results.users.length,
      total: results.projects.length + results.actions.length + results.tasks.length + results.users.length,
    };

    res.json({
      success: true,
      results,
      counts,
      query: { q, type, status, priority, assigned_to, date_from, date_to },
    });

  } catch (error) {
    console.error('❌ Erreur search:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message,
    });
  }
};

// Recherche avancée avec filtres
const advancedSearch = async (req, res) => {
  try {
    const { 
      q, 
      type, 
      status, 
      priority, 
      assigned_to,
      date_from,
      date_to,
      project_id,
      action_id,
      sort_by,
      sort_order,
      limit,
      offset 
    } = req.query;

    const results = {};
    const query = {};

    // Construction de la requête
    if (q) {
      query[Op.or] = [
        { name_ar: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { title_ar: { [Op.like]: `%${q}%` } },
      ];
    }

    // Filtres
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigned_to) query.assigned_to = parseInt(assigned_to);
    if (project_id) query.project_id = parseInt(project_id);
    if (action_id) query.action_id = parseInt(action_id);
    
    if (date_from && date_to) {
      query[Op.or] = [
        { start_date: { [Op.between]: [date_from, date_to] } },
        { due_date: { [Op.between]: [date_from, date_to] } },
      ];
    }

    // Limites
    const limitVal = parseInt(limit) || 50;
    const offsetVal = parseInt(offset) || 0;

    // Trier
    const order = [];
    if (sort_by) {
      order.push([sort_by, sort_order === 'desc' ? 'DESC' : 'ASC']);
    } else {
      order.push(['created_at', 'DESC']);
    }

    // Type de recherche
    if (type === 'projects' || !type) {
      results.projects = await Project.findAll({
        where: query,
        order,
        limit: limitVal,
        offset: offsetVal,
      });
    }

    if (type === 'tasks' || !type) {
      results.tasks = await Task.findAll({
        where: query,
        order,
        limit: limitVal,
        offset: offsetVal,
      });
    }

    res.json({
      success: true,
      results,
      pagination: {
        limit: limitVal,
        offset: offsetVal,
      },
    });

  } catch (error) {
    console.error('❌ Erreur advancedSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche avancée',
      error: error.message,
    });
  }
};

module.exports = {
  search,
  advancedSearch,
};