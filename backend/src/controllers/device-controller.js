const deviceService = require('../services/device-service');
const { success } = require('../utils/response');

/**
 * 设备控制器层
 */
class DeviceController {
  /**
   * 添加设备
   */
  async addDevice(req, res, next) {
    try {
      const device = await deviceService.addDevice(req.body);
      res.status(201).json(success(device, '设备添加成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新设备
   */
  async updateDevice(req, res, next) {
    try {
      const device = await deviceService.updateDevice(req.params.id, req.body);
      res.json(success(device, '设备更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除设备
   */
  async deleteDevice(req, res, next) {
    try {
      await deviceService.deleteDevice(req.params.id);
      res.json(success(null, '设备删除成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取设备的所有端口
   */
  async getDevicePorts(req, res, next) {
    try {
      const ports = await deviceService.getDevicePorts(req.params.id);
      res.json(success(ports));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeviceController();
