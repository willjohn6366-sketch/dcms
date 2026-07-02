import request from '../utils/request';

/**
 * 电路管理 API
 */

/**
 * 搜索电路
 * @param {string} keyword - 搜索关键字（电路编号、IP 等）
 * @returns {Promise}
 */
export const searchCircuits = (keyword) => {
  return request({
    url: '/circuits/search',
    method: 'GET',
    data: { q: keyword }
  });
};

/**
 * 创建电路
 * @param {Object} data - 电路信息
 * @returns {Promise}
 */
export const createCircuit = (data) => {
  return request({
    url: '/circuits',
    method: 'POST',
    data
  });
};

/**
 * 获取电路详情
 * @param {number|string} id - 电路 ID
 * @returns {Promise}
 */
export const getCircuitDetail = (id) => {
  return request({
    url: `/circuits/${id}`,
    method: 'GET'
  });
};

/**
 * 更新电路
 * @param {number|string} id - 电路 ID
 * @param {Object} data - 电路信息
 * @returns {Promise}
 */
export const updateCircuit = (id, data) => {
  return request({
    url: `/circuits/${id}`,
    method: 'PUT',
    data
  });
};

/**
 * 删除电路
 * @param {number|string} id - 电路 ID
 * @returns {Promise}
 */
export const deleteCircuit = (id) => {
  return request({
    url: `/circuits/${id}`,
    method: 'DELETE'
  });
};
