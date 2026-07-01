const Project = require('../models/Project');
const Action = require('../models/Action');
const Task = require('../models/Task');
const User = require('../models/User');
const { Op } = require('sequelize');

// Récupérer les données pour le diagramme de Gantt
const getGanttData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';

    // Récupérer les projets
    let projects;
    if (projectId) {
      projects = await Project.findAll({
        where: { id: projectId },
        order: [['start_date', 'ASC']],
      });
    } else {
      projects = await Project.findAll({
        order: [['start_date', 'ASC']],
      });
    }

    if (!projects || projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun projet trouvé',
      });
    }

    // Construire les données du Gantt
    const ganttData = [];

    for (const project of projects) {
      // Ajouter le projet comme une tâche de niveau 1
      ganttData.push({
        id: `project-${project.id}`,
        name: project.name_ar,
        start: project.start_date,
        end: project.end_date,
        type: 'project',
        progress: project.progress || 0,
        color: project.color || '#1a5b3e',
        status: project.status,
        children: [],
      });

      // Récupérer les actions du projet
      const actions = await Action.findAll({
        where: { project_id: project.id },
        order: [['start_date', 'ASC']],
      });

      for (const action of actions) {
        // Ajouter l'action comme une tâche de niveau 2
        const actionItem = {
          id: `action-${action.id}`,
          name: action.name_ar,
          start: action.start_date,
          end: action.end_date,
          type: 'action',
          progress: action.progress || 0,
          color: '#3b82f6',
          status: action.status,
          children: [],
        };

        // Récupérer les tâches de l'action
        const tasks = await Task.findAll({
          where: { action_id: action.id },
          order: [['start_date', 'ASC']],
        });

        for (const task of tasks) {
          // Ajouter la tâche comme une tâche de niveau 3
          const statusColors = {
            todo: '#f59e0b',
            in_progress: '#3b82f6',
            review: '#8b5cf6',
            done: '#22c55e',
            cancelled: '#ef4444',
          };

          actionItem.children.push({
            id: `task-${task.id}`,
            name: task.title_ar,
            start: task.start_date,
            end: task.due_date,
            type: 'task',
            progress: task.progress || 0,
            color: statusColors[task.status] || '#6b7280',
            status: task.status,
            assignee: task.assigned_to,
            priority: task.priority,
          });
        }

        // Ajouter l'action au projet
        const projectItem = ganttData.find(p => p.id === `project-${project.id}`);
        if (projectItem) {
          projectItem.children.push(actionItem);
        }
      }
    }

    // Ajouter les informations des utilisateurs pour les tâches assignées
    const userIds = [];
    ganttData.forEach(p => {
      p.children.forEach(a => {
        a.children.forEach(t => {
          if (t.assignee) userIds.push(t.assignee);
        });
      });
    });

    if (userIds.length > 0) {
      const uniqueUserIds = [...new Set(userIds)];
      const users = await User.findAll({
        where: { id: { [Op.in]: uniqueUserIds } },
        attributes: ['id', 'username', 'full_name'],
      });

      const userMap = {};
      users.forEach(u => {
        userMap[u.id] = u.full_name || u.username;
      });

      // Ajouter les noms des assignés
      ganttData.forEach(p => {
        p.children.forEach(a => {
          a.children.forEach(t => {
            if (t.assignee && userMap[t.assignee]) {
              t.assigneeName = userMap[t.assignee];
            }
          });
        });
      });
    }

    res.json({
      success: true,
      projects: ganttData,
    });
  } catch (error) {
    console.error('❌ Erreur getGanttData:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des données Gantt',
      error: error.message,
    });
  }
};

// Récupérer les données pour un projet spécifique
const getProjectGantt = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé',
      });
    }

    const actions = await Action.findAll({
      where: { project_id: projectId },
      order: [['start_date', 'ASC']],
    });

    const ganttData = {
      id: `project-${project.id}`,
      name: project.name_ar,
      start: project.start_date,
      end: project.end_date,
      type: 'project',
      progress: project.progress || 0,
      color: project.color || '#1a5b3e',
      status: project.status,
      children: [],
    };

    for (const action of actions) {
      const tasks = await Task.findAll({
        where: { action_id: action.id },
        order: [['start_date', 'ASC']],
      });

      const actionItem = {
        id: `action-${action.id}`,
        name: action.name_ar,
        start: action.start_date,
        end: action.end_date,
        type: 'action',
        progress: action.progress || 0,
        color: '#3b82f6',
        status: action.status,
        children: tasks.map(task => ({
          id: `task-${task.id}`,
          name: task.title_ar,
          start: task.start_date,
          end: task.due_date,
          type: 'task',
          progress: task.progress || 0,
          color: {
            todo: '#f59e0b',
            in_progress: '#3b82f6',
            review: '#8b5cf6',
            done: '#22c55e',
            cancelled: '#ef4444',
          }[task.status] || '#6b7280',
          status: task.status,
          priority: task.priority,
        })),
      };

      ganttData.children.push(actionItem);
    }

    res.json({
      success: true,
      project: ganttData,
    });
  } catch (error) {
    console.error('❌ Erreur getProjectGantt:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du chargement des données Gantt',
      error: error.message,
    });
  }
};

module.exports = {
  getGanttData,
  getProjectGantt,
};