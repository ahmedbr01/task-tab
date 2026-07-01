const User = require('../models/User');
const Project = require('../models/Project');
const Action = require('../models/Action');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Document = require('../models/Document');
const { Op } = require('sequelize');

// Statistiques globales
const getStats = async (req, res) => {
  try {
    // Statistiques utilisateurs
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const managerUsers = await User.count({ where: { role: 'manager' } });
    const memberUsers = await User.count({ where: { role: 'member' } });

    // Statistiques projets
    const totalProjects = await Project.count();
    const activeProjects = await Project.count({ where: { status: 'active' } });
    const completedProjects = await Project.count({ where: { status: 'completed' } });
    const pendingProjects = await Project.count({ where: { status: 'pending' } });

    // Statistiques tâches
    const totalTasks = await Task.count();
    const todoTasks = await Task.count({ where: { status: 'todo' } });
    const inProgressTasks = await Task.count({ where: { status: 'in_progress' } });
    const reviewTasks = await Task.count({ where: { status: 'review' } });
    const doneTasks = await Task.count({ where: { status: 'done' } });
    const cancelledTasks = await Task.count({ where: { status: 'cancelled' } });

    // Tâches urgentes
    const urgentTasks = await Task.count({ 
      where: { 
        priority: 'urgent',
        status: { [Op.ne]: 'done' }
      }
    });

    // Tâches en retard
    const overdueTasks = await Task.count({
      where: {
        due_date: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'done' }
      }
    });

    // Messages non lus
    const unreadMessages = await Message.count({
      where: { is_read: false }
    });

    // Documents
    const totalDocuments = await Document.count();

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admin: adminUsers,
          manager: managerUsers,
          member: memberUsers,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          pending: pendingProjects,
        },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          done: doneTasks,
          cancelled: cancelledTasks,
          urgent: urgentTasks,
          overdue: overdueTasks,
        },
        messages: {
          unread: unreadMessages,
        },
        documents: {
          total: totalDocuments,
        },
      },
    });
  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Activité récente
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Derniers utilisateurs créés
    const recentUsers = await User.findAll({
      attributes: ['id', 'username', 'full_name', 'role', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: limit,
    });

    // Derniers projets créés
    const recentProjects = await Project.findAll({
      attributes: ['id', 'name_ar', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: limit,
    });

    // Dernières tâches créées
    const recentTasks = await Task.findAll({
      attributes: ['id', 'title_ar', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: limit,
    });

    res.json({
      success: true,
      activity: {
        users: recentUsers,
        projects: recentProjects,
        tasks: recentTasks,
      },
    });
  } catch (error) {
    console.error('❌ Erreur getRecentActivity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getRecentActivity,
};