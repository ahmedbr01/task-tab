const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Message = require('../models/Message');
const Document = require('../models/Document');

const getStats = async (req, res) => {
  try {
    console.log('📊 Génération des statistiques du dashboard...');

    const totalProjects = await Project.count();
    const totalTasks = await Task.count();
    const completedTasks = await Task.count({ where: { status: 'done' } });
    const inProgressTasks = await Task.count({ where: { status: 'in_progress' } });
    const overdueTasks = await Task.count({
      where: {
        due_date: { [require('sequelize').Op.lt]: new Date() },
        status: { [require('sequelize').Op.ne]: 'done' }
      }
    });

    const stats = {
      totalProjects: totalProjects || 0,
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      inProgressTasks: inProgressTasks || 0,
      overdueTasks: overdueTasks || 0,
    };

    console.log('📊 Stats retournées:', stats);

    // Ajouter des headers pour éviter le cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Erreur getStats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats };