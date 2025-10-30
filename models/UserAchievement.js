const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const UserAchievement = sequelize.define('UserAchievement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  achievementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'achievement_id'
  },
  levelId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'level_id'
  },
  planetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'planet_id'
  },
  awardedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'awarded_at'
  }
}, {
  tableName: 'user_achievements',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['user_id', 'achievement_id', 'level_id', 'planet_id'] },
    { fields: ['user_id'] }
  ]
});

module.exports = UserAchievement;


