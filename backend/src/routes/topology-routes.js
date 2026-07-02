const express = require('express');
const router = express.Router();
const topologyController = require('../controllers/topology-controller');

/**
 * 拓扑管理路由
 */

// 获取客户的拓扑列表 (?customer_id=xxx)
router.get('/', topologyController.getTopologiesByCustomer);

// 获取拓扑详情
router.get('/:id', topologyController.getTopologyDetail);

// 创建拓扑
router.post('/', topologyController.createTopology);

// 更新拓扑
router.put('/:id', topologyController.updateTopology);

// 删除拓扑
router.delete('/:id', topologyController.deleteTopology);

// 更新布局坐标
router.put('/:id/layout', topologyController.updateLayout);

// 计算自动布局
router.get('/:id/auto-layout', topologyController.calculateAutoLayout);

module.exports = router;
