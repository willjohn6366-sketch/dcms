const connectionService = require('../services/connection-service');
const { success } = require('../utils/response');

/**
 * 连接控制器层
 */
class ConnectionController {
  /**
   * 创建连接
   */
  async createConnection(req, res, next) {
    try {
      const connection = await connectionService.createConnection(req.body);
      res.status(201).json(success(connection, '连接创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新连接
   */
  async updateConnection(req, res, next) {
    try {
      const connection = await connectionService.updateConnection(req.params.id, req.body);
      res.json(success(connection, '连接更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除连接
   */
  async deleteConnection(req, res, next) {
    try {
      await connectionService.deleteConnection(req.params.id);
      res.json(success(null, '连接删除成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConnectionController();
