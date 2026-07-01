const Axe = require('../models/Axe');
const Project = require('../models/Project');
const Action = require('../models/Action');
const Task = require('../models/Task');

// Récupérer tous les axes
const getAll = async (req, res) => {
  try {
    const axes = await Axe.findAll({
      where: { is_active: true },
      order: [['order', 'ASC']],
    });
    res.json({ success: true, axes });
  } catch (error) {
    console.error('❌ Erreur getAll axes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer un axe avec ses projets
const getById = async (req, res) => {
  try {
    const axe = await Axe.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'projects',
          include: [
            {
              model: Action,
              as: 'Actions',
              include: [
                {
                  model: Task,
                  as: 'Tasks',
                },
              ],
            },
          ],
        },
      ],
    });
    if (!axe) {
      return res.status(404).json({ success: false, message: 'Axe non trouvé' });
    }
    res.json({ success: true, axe });
  } catch (error) {
    console.error('❌ Erreur getById axe:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Créer un axe
const create = async (req, res) => {
  try {
    const { name_ar, description, code, color, order } = req.body;

    if (!name_ar) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'axe est requis',
      });
    }

    const axe = await Axe.create({
      name_ar,
      description: description || '',
      code: code || '',
      color: color || '#6366f1',
      order: order || 0,
      created_by: req.user.id,
      is_active: true,
    });

    res.status(201).json({ success: true, axe });
  } catch (error) {
    console.error('❌ Erreur create axe:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mettre à jour un axe
const update = async (req, res) => {
  try {
    const axe = await Axe.findByPk(req.params.id);
    if (!axe) {
      return res.status(404).json({ success: false, message: 'Axe non trouvé' });
    }

    await axe.update(req.body);
    await axe.reload();

    res.json({ success: true, axe });
  } catch (error) {
    console.error('❌ Erreur update axe:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprimer un axe
const deleteAxe = async (req, res) => {
  try {
    const axe = await Axe.findByPk(req.params.id);
    if (!axe) {
      return res.status(404).json({ success: false, message: 'Axe non trouvé' });
    }

    // Vérifier si des projets sont liés à cet axe
    const projects = await Project.findAll({
      where: { axe_id: axe.id },
    });

    if (projects.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cet axe car il contient ${projects.length} projet(s)`,
      });
    }

    await axe.destroy();
    res.json({ success: true, message: 'Axe supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur delete axe:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer les statistiques d'un axe
const getStats = async (req, res) => {
  try {
    const axes = await Axe.findAll({
      where: { is_active: true },
      include: [
        {
          model: Project,
          as: 'projects',
        },
      ],
    });

    const stats = await Promise.all(axes.map(async (axe) => {
      const projects = axe.projects || [];
      let totalTasks = 0;
      let completedTasks = 0;

      for (const project of projects) {
        const actions = await Action.findAll({
          where: { project_id: project.id },
        });
        for (const action of actions) {
          const tasks = await Task.findAll({
            where: { action_id: action.id },
          });
          tasks.forEach(t => {
            totalTasks++;
            if (t.status === 'done') completedTasks++;
          });
        }
      }

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: axe.id,
        name: axe.name_ar,
        code: axe.code,
        color: axe.color,
        projectsCount: projects.length,
        totalTasks,
        completedTasks,
        progress,
      };
    }));

    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Erreur getStats axe:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteAxe,
  getStats,
};