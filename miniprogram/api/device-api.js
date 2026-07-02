import request from '../utils/request';

/**
 * 设备管理 API
 */

/**
 * 添加设备
 * @param {Object} data - 设备信息
 * @returns {Promise}
 */
export const addDevice = (data) => {
  return request({
    url: '/devices',
    method: 'POST',
    data
  });
};

/**
 * 更新设备
 * @param {number|string} id - 设备 ID
 * @param {Object} data - 设备信息
 * @returns {Promise}
 */
export const updateDevice = (id, data) => {
  return request({
    url: `/devices/${id}`,
    method: 'PUT',
    data
  });
};

/**
 * 删除设备
 * @param {number|string} id - 设备 ID
 * @returns {Promise}
 */
export const deleteDevice = (id) => {
  return request({
    url: `/devices/${id}`,
    method: 'DELETE'
  });
};

/**
 * 获取设备端口列表
 * @param {number|string} id - 设备 ID
 * @returns {Promise}
 */
export const getDevicePorts = (id) => {
  return request({
    url: `/devices/${id}/ports`,
    method: 'GET'
  });
};
