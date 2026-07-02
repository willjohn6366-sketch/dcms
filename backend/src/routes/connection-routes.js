const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connection-controller');

/**
 * 连接管理路由
 */

// 创建连接
router.post('/', connectionController.createConnection);

// 更新连接
router.put('/:id', connectionController.updateConnection);

// 删除连接
router.delete('/:id', connectionController.deleteConnection);

module.exports = router;
