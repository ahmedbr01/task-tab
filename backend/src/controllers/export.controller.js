const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Message = require('../models/Message');
const Document = require('../models/Document');
const ExcelExportService = require('../services/excelExport.service');

// Exporter les projets (SANS ASSOCIATIONS)
const exportProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['created_at', 'DESC']],
    });

    // Récupérer les créateurs manuellement
    const userIds = [...new Set(projects.map(p => p.created_by).filter(id => id))];
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'full_name'],
    });
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });

    // Ajouter les créateurs aux projets
    const projectsWithCreator = projects.map(p => ({
      ...p.toJSON(),
      creator: userMap[p.created_by] || null,
    }));

    const workbook = await ExcelExportService.exportProjects(projectsWithCreator);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=projets-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Erreur exportProjects:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Exporter les tâches (SANS ASSOCIATIONS)
const exportTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['created_at', 'DESC']],
    });

    // Récupérer les assignés manuellement
    const userIds = [...new Set(tasks.map(t => t.assigned_to).filter(id => id))];
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'username', 'full_name'],
    });
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });

    // Ajouter les assignés aux tâches
    const tasksWithAssignee = tasks.map(t => ({
      ...t.toJSON(),
      assignee: userMap[t.assigned_to] || null,
    }));

    const workbook = await ExcelExportService.exportTasks(tasksWithAssignee);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=taches-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Erreur exportTasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Exporter les utilisateurs
const exportUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });

    const workbook = await ExcelExportService.exportUsers(users);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=utilisateurs-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Erreur exportUsers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Exporter les statistiques globales
const exportStats = async (req, res) => {
  try {
    const totalProjects = await Project.count();
    const activeProjects = await Project.count({ where: { status: 'active' } });
    const completedProjects = await Project.count({ where: { status: 'completed' } });
    
    const totalTasks = await Task.count();
    const doneTasks = await Task.count({ where: { status: 'done' } });
    const inProgressTasks = await Task.count({ where: { status: 'in_progress' } });
    
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    
    const totalMessages = await Message.count();
    const unreadMessages = await Message.count({ where: { is_read: false } });
    
    const totalDocuments = await Document.count();

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      doneTasks,
      inProgressTasks,
      totalUsers,
      activeUsers,
      totalMessages,
      unreadMessages,
      totalDocuments,
    };

    const workbook = await ExcelExportService.exportStats(stats);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=statistiques-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Erreur exportStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  exportProjects,
  exportTasks,
  exportUsers,
  exportStats,
};