import request from '../utils/request';

/**
 * 拓扑管理 API
 */

/**
 * 获取指定客户的拓扑列表
 * @param {number|string} customerId - 客户 ID
 * @returns {Promise}
 */
export const getTopologiesByCustomer = (customerId) => {
  return request({
    url: '/topologies',
    method: 'GET',
    data: { customer_id: customerId }
  });
};

/**
 * 获取拓扑详情
 * @param {number|string} id - 拓扑 ID
 * @returns {Promise}
 */
export const getTopologyDetail = (id) => {
  return request({
    url: `/topologies/${id}`,
    method: 'GET'
  });
};

/**
 * 创建拓扑
 * @param {Object} data - 拓扑信息
 * @returns {Promise}
 */
export const createTopology = (data) => {
  return request({
    url: '/topologies',
    method: 'POST',
    data
  });
};

/**
 * 更新拓扑
 * @param {number|string} id - 拓扑 ID
 * @param {Object} data - 拓扑信息
 * @returns {Promise}
 */
export const updateTopology = (id, data) => {
  return request({
    url: `/topologies/${id}`,
    method: 'PUT',
    data
  });
};

/**
 * 删除拓扑
 * @param {number|string} id - 拓扑 ID
 * @returns {Promise}
 */
export const deleteTopology = (id) => {
  return request({
    url: `/topologies/${id}`,
    method: 'DELETE'
  });
};

/**
 * 更新设备布局坐标
 * @param {number|string} id - 拓扑 ID
 * @param {Object} data - 布局数据
 * @returns {Promise}
 */
export const updateLayout = (id, data) => {
  return request({
    url: `/topologies/${id}/layout`,
    method: 'PUT',
    data
  });
};

/**
 * 计算自动布局
 * @param {number|string} id - 拓扑 ID
 * @returns {Promise}
 */
export const getAutoLayout = (id) => {
  return request({
    url: `/topologies/${id}/auto-layout`,
    method: 'GET'
  });
};
