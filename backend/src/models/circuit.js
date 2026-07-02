const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 电路信息模型
 */
const Circuit = sequelize.define('Circuit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  customer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '客户 ID'
  },
  topology_id: {
    type: DataTypes.INTEGER,
    comment: '拓扑 ID'
  },
  connection_id: {
    type: DataTypes.INTEGER,
    comment: '绑定的连接 ID'
  },
  circuit_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '电路名称'
  },
  circuit_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: '电路编号（唯一）'
  },
  circuit_type: {
    type: DataTypes.ENUM('IPRAN', 'STN', '互联网专线', '裸纤', 'SDH', 'MSTP', 'OTN', '语音中继', 'FTTH', '其他'),
    allowNull: true,
    comment: '电路类型'
  },
  bandwidth: {
    type: DataTypes.STRING(20),
    comment: '带宽'
  },
  open_date: {
    type: DataTypes.DATEONLY,
    comment: '开通日期'
  },
  local_ip: {
    type: DataTypes.STRING(50),
    comment: '本端 IP'
  },
  remote_ip: {
    type: DataTypes.STRING(50),
    comment: '对端 IP'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'circuits',
  underscored: true,
  timestamps: true
});

module.exports = Circuit;
