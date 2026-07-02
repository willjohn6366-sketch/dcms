const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 网络设备模型
 */
const Device = sequelize.define('Device', {
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
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '设备名称'
  },
  device_type: {
    type: DataTypes.ENUM('router', 'switch', 'odf', 'optical_device', 'other'),
    defaultValue: 'other',
    comment: '设备类型'
  },
  device_model: {
    type: DataTypes.STRING(100),
    comment: '设备型号'
  },
  location: {
    type: DataTypes.STRING(200),
    comment: '位置'
  },
  position_x: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'X 坐标'
  },
  position_y: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Y 坐标'
  }
}, {
  tableName: 'network_devices',
  underscored: true,
  timestamps: true
});

module.exports = Device;
