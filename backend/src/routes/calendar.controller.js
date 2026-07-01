const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { Op } = require('sequelize');

// Récupérer les tâches pour le calendrier
const getTasks = async (req, res) => {
  try {
    const { start, end, view } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    // Construire la condition de dates
    const dateCondition = {};
    if (start && end) {
      dateCondition[Op.or] = [
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
      ];
    }

    // Filtrer par utilisateur (sauf admin/manager qui voient tout)
    const userCondition = isAdmin ? {} : { assigned_to: userId };

    const tasks = await Task.findAll({
      where: {
        ...userCondition,
        ...dateCondition,
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: Action,
          as: 'Action',
          include: [
            {
              model: Project,
              as: 'Project',
              attributes: ['id', 'name_ar', 'color'],
            },
          ],
        },
      ],
      order: [['start_date', 'ASC']],
    });

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

      const priorityLabels = {
        low: '🟢 Basse',
        medium: '🔵 Moyenne',
        high: '🟠 Haute',
        urgent: '🔴 Urgente',
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
          priorityLabel: priorityLabels[task.priority] || task.priority,
          description: task.description,
          assignee: task.assignee ? task.assignee.full_name : null,
          projectName: task.Action?.Project?.name_ar || null,
          projectColor: task.Action?.Project?.color || null,
          progress: task.progress,
        },
      };
    });

    // Ajouter les projets comme événements (optionnel)
    const projects = await Project.findAll({
      where: {
        ...(isAdmin ? {} : { manager_id: userId }),
        ...(start && end ? {
          [Op.or]: [
            {
              start_date: {
                [Op.between]: [start, end],
              },
            },
            {
              end_date: {
                [Op.between]: [start, end],
              },
            },
          ],
        } : {}),
      },
      attributes: ['id', 'name_ar', 'start_date', 'end_date', 'color', 'progress'],
    });

    const projectEvents = projects.map(project => ({
      id: `project-${project.id}`,
      title: `📁 ${project.name_ar}`,
      start: project.start_date,
      end: project.end_date,
      backgroundColor: project.color || '#1a5b3e',
      borderColor: project.color || '#1a5b3e',
      textColor: '#ffffff',
      extendedProps: {
        type: 'project',
        progress: project.progress,
      },
    }));

    const allEvents = [...events, ...projectEvents];

    res.json({
      success: true,
      events: allEvents,
      count: allEvents.length,
    });
  } catch (error) {
    console.error('❌ Erreur getTasks:', error);
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
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date requise',
      });
    }

    const tasks = await Task.findAll({
      where: {
        ...(isAdmin ? {} : { assigned_to: userId }),
        [Op.or]: [
          { start_date: date },
          { due_date: date },
        ],
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'full_name'],
        },
        {
          model: Action,
          as: 'Action',
          include: [
            {
              model: Project,
              as: 'Project',
              attributes: ['id', 'name_ar'],
            },
          ],
        },
      ],
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