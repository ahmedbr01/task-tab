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
  
  budget_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Budget total alloué à l\'axe',
  },
  budget_used: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Budget déjà utilisé par les projets',
  },
  budget_currency: {
    type: DataTypes.ENUM('TND', 'EUR', 'USD'),
    defaultValue: 'TND',
  },
  budget_warning_threshold: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 10,
    comment: 'Seuil d\'alerte en % (ex: 10 = 10%)',
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
  Axe.hasMany(models.Project, {
    as: 'projects',
    foreignKey: 'axe_id',
    onDelete: 'SET NULL',
  });

  Axe.belongsTo(models.User, {
    as: 'creator',
    foreignKey: 'created_by',
  });
};

// ============================================
// MÉTHODES D'INSTANCE - BUDGET
// ============================================
Axe.prototype.getBudgetRemaining = function() {
  return parseFloat(this.budget_total || 0) - parseFloat(this.budget_used || 0);
};

Axe.prototype.getBudgetUsedPercentage = function() {
  if (parseFloat(this.budget_total || 0) === 0) return 0;
  return (parseFloat(this.budget_used || 0) / parseFloat(this.budget_total || 0)) * 100;
};

Axe.prototype.getBudgetRemainingPercentage = function() {
  if (parseFloat(this.budget_total || 0) === 0) return 0;
  return (this.getBudgetRemaining() / parseFloat(this.budget_total || 0)) * 100;
};

Axe.prototype.isBudgetWarning = function() {
  return this.getBudgetRemainingPercentage() <= parseFloat(this.budget_warning_threshold || 10) &&
         this.getBudgetRemaining() > 0;
};

Axe.prototype.isBudgetExhausted = function() {
  return this.getBudgetRemaining() <= 0;
};

Axe.prototype.hasBudget = function() {
  return parseFloat(this.budget_total || 0) > 0;
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

Axe.getAxesWithBudgetAlerts = async function() {
  const axes = await this.findAll({
    where: { is_active: true },
    include: [
      { model: sequelize.models.Project, as: 'projects' },
    ],
  });
  
  return axes.filter(axe => axe.isBudgetWarning() || axe.isBudgetExhausted());
};

module.exports = Axe;