const { Connection, Port, Device } = require('../models');

/**
 * 连接与端口业务逻辑层
 */
class ConnectionService {
  /**
   * 添加端口
   */
  async addPort(data) {
    return await Port.create(data);
  }

  /**
   * 更新端口
   */
  async updatePort(id, data) {
    const port = await Port.findByPk(id);
    if (!port) throw new Error('端口不存在');
    return await port.update(data);
  }

  /**
   * 删除端口
   */
  async deletePort(id) {
    const port = await Port.findByPk(id);
    if (!port) throw new Error('端口不存在');
    return await port.destroy();
  }

  /**
   * 创建物理连接
   */
  async createConnection(data) {
    return await Connection.create(data);
  }

  /**
   * 更新连接信息
   */
  async updateConnection(id, data) {
    const connection = await Connection.findByPk(id);
    if (!connection) throw new Error('连接不存在');
    return await connection.update(data);
  }

  /**
   * 删除连接
   */
  async deleteConnection(id) {
    const connection = await Connection.findByPk(id);
    if (!connection) throw new Error('连接不存在');
    return await connection.destroy();
  }
}

module.exports = new ConnectionService();
