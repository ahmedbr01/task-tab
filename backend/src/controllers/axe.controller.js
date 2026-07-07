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

// Créer un axe (AVEC BUDGET)
const create = async (req, res) => {
  try {
    console.log('📝 Création d\'un axe par:', req.user.id);
    console.log('📝 Données reçues:', req.body);

    const { 
      name_ar, 
      description, 
      code, 
      color, 
      order,
      budget_total,
      budget_currency,
      budget_warning_threshold 
    } = req.body;

    if (!name_ar) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de l\'axe est requis',
      });
    }

    // Validation du budget
    if (budget_total && budget_total < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le budget total doit être supérieur ou égal à 0',
      });
    }

    const axe = await Axe.create({
      name_ar,
      description: description || '',
      code: code || '',
      color: color || '#6366f1',
      order: order || 0,
      budget_total: budget_total || 0,
      budget_used: 0,
      budget_currency: budget_currency || 'TND',
      budget_warning_threshold: budget_warning_threshold || 10,
      created_by: req.user.id,
      is_active: true,
    });

    console.log('✅ Axe créé:', axe.id);
    if (axe.hasBudget()) {
      console.log(`💰 Budget total: ${axe.budget_total} ${axe.budget_currency}`);
    }

    res.status(201).json({ 
      success: true, 
      axe,
      message: axe.hasBudget() 
        ? `Axe créé avec un budget de ${axe.budget_total} ${axe.budget_currency}`
        : 'Axe créé sans budget'
    });
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

    // Si le budget total est modifié, vérifier qu'il n'est pas inférieur à l'utilisé
    if (req.body.budget_total !== undefined) {
      const newTotal = parseFloat(req.body.budget_total);
      const used = parseFloat(axe.budget_used || 0);
      if (newTotal < used) {
        return res.status(400).json({
          success: false,
          message: `Le budget total (${newTotal}) ne peut pas être inférieur au budget déjà utilisé (${used})`,
        });
      }
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

// Récupérer les statistiques d'un axe (INCLUANT BUDGET)
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
        // 🔥 STATISTIQUES BUDGET
        budget: {
          total: axe.budget_total,
          used: axe.budget_used,
          remaining: axe.getBudgetRemaining(),
          usedPercentage: axe.getBudgetUsedPercentage(),
          remainingPercentage: axe.getBudgetRemainingPercentage(),
          currency: axe.budget_currency,
          hasBudget: axe.hasBudget(),
          isWarning: axe.isBudgetWarning(),
          isExhausted: axe.isBudgetExhausted(),
        },
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