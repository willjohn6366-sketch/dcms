const circuitService = require('../services/circuit-service');
const { success } = require('../utils/response');

/**
 * 电路控制器层
 */
class CircuitController {
  /**
   * 创建电路
   */
  async createCircuit(req, res, next) {
    try {
      const circuit = await circuitService.createCircuit(req.body);
      res.status(201).json(success(circuit, '电路创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取电路详情
   */
  async getCircuitDetail(req, res, next) {
    try {
      const circuit = await circuitService.getCircuitDetail(req.params.id);
      if (!circuit) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '电路不存在' }
        });
      }
      res.json(success(circuit));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新电路
   */
  async updateCircuit(req, res, next) {
    try {
      const circuit = await circuitService.updateCircuit(req.params.id, req.body);
      res.json(success(circuit, '电路更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除电路
   */
  async deleteCircuit(req, res, next) {
    try {
      await circuitService.deleteCircuit(req.params.id);
      res.json(success(null, '电路删除成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 搜索电路
   */
  async searchCircuits(req, res, next) {
    try {
      const { q, circuit_code, circuit_number, customer_id, page, pageSize } = req.query;
      const circuits = await circuitService.searchCircuits({
        q,
        circuit_code,
        circuit_number,
        customer_id,
        page,
        pageSize
      });
      res.json(success(circuits));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CircuitController();
