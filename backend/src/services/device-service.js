const { Device, Port } = require('../models');

/**
 * 设备业务逻辑层
 */
class DeviceService {
  /**
   * 添加设备
   */
  async addDevice(data) {
    return await Device.create(data);
  }

  /**
   * 更新设备信息
   */
  async updateDevice(id, data) {
    const device = await Device.findByPk(id);
    if (!device) throw new Error('设备不存在');
    return await device.update(data);
  }

  /**
   * 删除设备
   */
  async deleteDevice(id) {
    const device = await Device.findByPk(id);
    if (!device) throw new Error('设备不存在');
    return await device.destroy();
  }

  /**
   * 获取设备的所有端口
   */
  async getDevicePorts(deviceId) {
    return await Port.findAll({
      where: { device_id: deviceId }
    });
  }
}

module.exports = new DeviceService();
