const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.CHAR(36),
    allowNull: false,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  notifiable_type: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  notifiable_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  underscored: true,
  timestamps: true,  // expects created_at, updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false
});

Notification.belongsTo(User, {
  foreignKey: 'notifiable_id',
  constraints: false,
  scope: { notifiable_type: 'User' }
});

module.exports = Notification;
