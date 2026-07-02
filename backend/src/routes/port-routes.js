const express = require('express');
const router = express.Router();
const portController = require('../controllers/port-controller');

/**
 * 端口管理路由
 */

// 添加端口
router.post('/', portController.addPort);

// 更新端口
router.put('/:id', portController.updatePort);

// 删除端口
router.delete('/:id', portController.deletePort);

module.exports = router;
