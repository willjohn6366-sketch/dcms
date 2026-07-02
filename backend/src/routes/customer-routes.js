const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer-controller');

/**
 * 客户管理路由
 */

// 获取所有客户列表
router.get('/', customerController.getAllCustomers);

// 获取客户详情
router.get('/:id', customerController.getCustomerById);

// 创建新客户
router.post('/', customerController.createCustomer);

// 核查客户
router.post('/:id/check', customerController.checkCustomer);

// 更新客户信息
router.put('/:id', customerController.updateCustomer);

// 删除客户
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
