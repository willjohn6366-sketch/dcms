const topologyService = require('../services/topology-service');
const layoutService = require('../services/layout-service');
const { success } = require('../utils/response');

/**
 * 拓扑控制器层
 */
class TopologyController {
  /**
   * 获取客户的所有拓扑
   */
  async getTopologiesByCustomer(req, res, next) {
    try {
      const { customer_id } = req.query;
      const hasPageQuery = ['page', 'pageSize', 'q'].some((key) => req.query[key] !== undefined);
      if (hasPageQuery) {
        const topologies = await topologyService.getTopologiesPage(req.query);
        return res.json(success(topologies));
      }

      if (!customer_id) {
        const topologies = await topologyService.getAllTopologies();
        return res.json(success(topologies));
      }
      const topologies = await topologyService.getTopologiesByCustomerId(customer_id);
      res.json(success(topologies));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取拓扑详情
   */
  async getTopologyDetail(req, res, next) {
    try {
      const topology = await topologyService.getTopologyDetail(req.params.id);
      if (!topology) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '拓扑不存在' }
        });
      }
      res.json(success(topology));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建拓扑
   */
  async createTopology(req, res, next) {
    try {
      const topology = await topologyService.createTopology(req.body);
      res.status(201).json(success(topology, '拓扑创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新拓扑
   */
  async updateTopology(req, res, next) {
    try {
      const topology = await topologyService.updateTopology(req.params.id, req.body);
      res.json(success(topology, '拓扑更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除拓扑
   */
  async deleteTopology(req, res, next) {
    try {
      await topologyService.deleteTopology(req.params.id);
      res.json(success(null, '拓扑删除成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新布局
   */
  async updateLayout(req, res, next) {
    try {
      const { devices } = req.body;
      if (!Array.isArray(devices)) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'devices array is required' }
        });
      }
      await topologyService.updateLayout(req.params.id, devices);
      res.json(success(null, '布局更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 计算自动布局
   */
  async calculateAutoLayout(req, res, next) {
    try {
      const topology = await topologyService.getTopologyDetail(req.params.id);
      if (!topology) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '拓扑不存在' }
        });
      }

      const devices = topology.Devices || [];
      const connections = topology.Connections || [];

      // 计算自动布局
      const positions = layoutService.autoLayout(devices, connections);

      res.json(success(positions));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TopologyController();
