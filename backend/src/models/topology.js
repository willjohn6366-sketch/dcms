const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 组网拓扑模型
 */
const Topology = sequelize.define('Topology', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '客户 ID'
  },
  topology_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '拓扑名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '描述'
  },
  layout_data: {
    type: DataTypes.JSON,
    comment: '设备位置信息'
  }
}, {
  tableName: 'network_topologies',
  underscored: true,
  timestamps: true
});

module.exports = Topology;
