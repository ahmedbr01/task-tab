const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Pas de updated_at pour les messages
});

// ============================================
// DÉFINIR LES ASSOCIATIONS
// ============================================
Message.associate = (models) => {
  // Association avec l'expéditeur
  Message.belongsTo(models.User, {
    foreignKey: 'sender_id',
    as: 'sender',
    onDelete: 'CASCADE',
  });

  // Association avec le destinataire
  Message.belongsTo(models.User, {
    foreignKey: 'receiver_id',
    as: 'receiver',
    onDelete: 'CASCADE',
  });
};

module.exports = Message;