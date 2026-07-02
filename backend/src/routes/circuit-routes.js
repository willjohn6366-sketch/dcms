const express = require('express');
const router = express.Router();
const circuitController = require('../controllers/circuit-controller');

/**
 * 电路管理路由
 */

// 搜索电路
router.get('/search', circuitController.searchCircuits);

// 创建电路
router.post('/', circuitController.createCircuit);

// 获取电路详情
router.get('/:id', circuitController.getCircuitDetail);

// 更新电路
router.put('/:id', circuitController.updateCircuit);

// 删除电路
router.delete('/:id', circuitController.deleteCircuit);

module.exports = router;
