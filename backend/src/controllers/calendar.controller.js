const Task = require('../models/Task');
const Project = require('../models/Project');
const Action = require('../models/Action');
const { Op } = require('sequelize');

// Récupérer les tâches pour le calendrier
const getTasks = async (req, res) => {
  try {
    console.log('📅 GET /api/calendar/tasks - Récupération des tâches');
    const { start, end } = req.query;
    
    // Construire la condition de dates
    let whereCondition = {};
    if (start && end) {
      whereCondition = {
        [Op.or]: [
          {
            start_date: {
              [Op.between]: [start, end],
            },
          },
          {
            due_date: {
              [Op.between]: [start, end],
            },
          },
        ],
      };
    }
    
    const tasks = await Task.findAll({
      where: whereCondition,
      order: [['start_date', 'ASC']],
    });
    
    console.log(`📅 ${tasks.length} tâches trouvées`);
    
    // Formater les événements pour FullCalendar
    const events = tasks.map(task => {
      const statusColors = {
        todo: '#f59e0b',
        in_progress: '#3b82f6',
        review: '#8b5cf6',
        done: '#22c55e',
        cancelled: '#ef4444',
      };
      
      const statusLabels = {
        todo: '📋 À faire',
        in_progress: '🔄 En cours',
        review: '🔍 En révision',
        done: '✅ Terminé',
        cancelled: '❌ Annulé',
      };
      
      return {
        id: task.id,
        title: task.title_ar,
        start: task.start_date,
        end: task.due_date,
        backgroundColor: statusColors[task.status] || '#6b7280',
        borderColor: statusColors[task.status] || '#6b7280',
        textColor: '#ffffff',
        extendedProps: {
          status: task.status,
          statusLabel: statusLabels[task.status] || task.status,
          priority: task.priority,
          description: task.description,
          progress: task.progress,
        },
      };
    });
    
    res.json({ 
      success: true, 
      events,
      count: events.length,
    });
  } catch (error) {
    console.error('❌ Erreur getTasks calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement du calendrier',
      error: error.message,
    });
  }
};

// Récupérer les événements pour un jour spécifique
const getEvents = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date requise',
      });
    }
    
    const tasks = await Task.findAll({
      where: {
        [Op.or]: [
          { start_date: date },
          { due_date: date },
        ],
      },
      order: [['start_date', 'ASC']],
    });
    
    res.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('❌ Erreur getEvents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des événements',
      error: error.message,
    });
  }
};

module.exports = {
  getTasks,
  getEvents,
};