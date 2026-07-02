const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 客户信息模型
 */
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '单位名称'
  },
  contact_person: {
    type: DataTypes.STRING(50),
    comment: '联系人'
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  account_manager: {
    type: DataTypes.STRING(50),
    comment: '客户经理'
  },
  manager_phone: {
    type: DataTypes.STRING(20),
    comment: '客户经理电话'
  },
  latest_check_date: {
    type: DataTypes.DATEONLY,
    comment: '最近核查日期'
  }
}, {
  tableName: 'customers',
  underscored: true,
  timestamps: true
});

module.exports = Customer;
