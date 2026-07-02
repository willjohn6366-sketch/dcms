const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 设备端口模型
 */
const Port = sequelize.define('Port', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '设备 ID'
  },
  port_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '端口名称'
  },
  port_type: {
    type: DataTypes.ENUM('optical', 'electrical', 'other'),
    defaultValue: 'other',
    comment: '端口类型'
  },
  port_speed: {
    type: DataTypes.STRING(20),
    comment: '端口速率'
  }
}, {
  tableName: 'device_ports',
  underscored: true,
  timestamps: true
});

module.exports = Port;
