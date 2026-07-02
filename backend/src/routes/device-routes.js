const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device-controller');

/**
 * 设备管理路由
 */

// 添加设备
router.post('/', deviceController.addDevice);

// 更新设备
router.put('/:id', deviceController.updateDevice);

// 删除设备
router.delete('/:id', deviceController.deleteDevice);

// 获取设备端口列表
router.get('/:id/ports', deviceController.getDevicePorts);

module.exports = router;
