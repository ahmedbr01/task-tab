const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Correspondence = sequelize.define('Correspondence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('internal_pdg', 'internal_director', 'external_minister', 'external_partner'),
    allowNull: false,
  },
  language: {
    type: DataTypes.ENUM('ar', 'fr'),
    defaultValue: 'ar',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  recipient: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  recipient_position: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'sent'),
    defaultValue: 'draft',
  },
  generated_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'correspondence',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Correspondence;