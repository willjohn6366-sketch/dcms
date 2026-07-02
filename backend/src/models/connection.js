const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 设备连接模型
 */
const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  topology_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '拓扑 ID'
  },
  source_port_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '源端口 ID'
  },
  target_port_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '目标端口 ID'
  },
  connection_type: {
    type: DataTypes.ENUM('fiber', 'cable', 'other'),
    defaultValue: 'fiber',
    comment: '连接类型'
  },
  fiber_info: {
    type: DataTypes.TEXT,
    comment: '线缆信息'
  }
}, {
  tableName: 'device_connections',
  underscored: true,
  timestamps: true
});

module.exports = Connection;
