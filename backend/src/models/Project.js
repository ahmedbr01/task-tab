const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  axe_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'axes',
      key: 'id',
    },
  },
  name_ar: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#22c55e',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  budget_cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Coût budgétaire du projet',
  },
}, {
  tableName: 'projects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations
Project.associate = function(models) {
  Project.belongsTo(models.Axe, {
    as: 'axe',
    foreignKey: 'axe_id',
  });
  Project.hasMany(models.Action, {
    as: 'Actions',
    foreignKey: 'project_id',
  });
};

module.exports = Project;