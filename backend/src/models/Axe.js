const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Axe = sequelize.define('Axe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_ar: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6366f1',
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'axes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ============================================
// ASSOCIATIONS
// ============================================
Axe.associate = function(models) {
  // Un axe peut avoir plusieurs projets
  Axe.hasMany(models.Project, {
    as: 'projects',
    foreignKey: 'axe_id',
    onDelete: 'SET NULL',
  });

  // Un axe est créé par un utilisateur
  Axe.belongsTo(models.User, {
    as: 'creator',
    foreignKey: 'created_by',
  });
};

// ============================================
// MÉTHODES D'INSTANCE
// ============================================
Axe.prototype.getProjectsCount = async function() {
  const Project = require('./Project');
  return await Project.count({
    where: { axe_id: this.id }
  });
};

Axe.prototype.getProgress = async function() {
  const Project = require('./Project');
  const Action = require('./Action');
  const Task = require('./Task');

  const projects = await Project.findAll({
    where: { axe_id: this.id },
  });

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

  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
};

// ============================================
// MÉTHODES STATIQUES
// ============================================
Axe.getActiveAxes = async function() {
  return await this.findAll({
    where: { is_active: true },
    order: [['order', 'ASC']],
  });
};

Axe.getAxesWithStats = async function() {
  const axes = await this.findAll({
    where: { is_active: true },
    include: [
      {
        model: Project,
        as: 'projects',
      },
    ],
    order: [['order', 'ASC']],
  });

  const stats = await Promise.all(axes.map(async (axe) => {
    const progress = await axe.getProgress();
    return {
      id: axe.id,
      name: axe.name_ar,
      code: axe.code,
      color: axe.color,
      order: axe.order,
      projectsCount: axe.projects?.length || 0,
      progress: progress,
    };
  }));

  return stats;
};

// ============================================
// HOOKS
// ============================================
Axe.addHook('beforeDestroy', async (axe, options) => {
  // Vérifier si des projets sont liés avant de supprimer
  const Project = require('./Project');
  const projectsCount = await Project.count({
    where: { axe_id: axe.id }
  });
  if (projectsCount > 0) {
    throw new Error(`Impossible de supprimer cet axe car il contient ${projectsCount} projet(s)`);
  }
});

// ============================================
// EXPORTER
// ============================================
module.exports = Axe;