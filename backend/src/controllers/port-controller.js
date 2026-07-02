const connectionService = require('../services/connection-service');
const { success } = require('../utils/response');

/**
 * 端口控制器层
 */
class PortController {
  /**
   * 添加端口
   */
  async addPort(req, res, next) {
    try {
      const port = await connectionService.addPort(req.body);
      res.status(201).json(success(port, '端口添加成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新端口
   */
  async updatePort(req, res, next) {
    try {
      const port = await connectionService.updatePort(req.params.id, req.body);
      res.json(success(port, '端口更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除端口
   */
  async deletePort(req, res, next) {
    try {
      await connectionService.deletePort(req.params.id);
      res.json(success(null, '端口删除成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PortController();
