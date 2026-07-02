import request from '../utils/request';

/**
 * 客户管理 API
 */

/**
 * 获取客户列表
 * @returns {Promise}
 */
export const getCustomers = () => {
  return request({
    url: '/customers',
    method: 'GET'
  });
};

/**
 * 获取客户详情
 * @param {number|string} id - 客户 ID
 * @returns {Promise}
 */
export const getCustomerById = (id) => {
  return request({
    url: `/customers/${id}`,
    method: 'GET'
  });
};

/**
 * 创建客户
 * @param {Object} data - 客户信息
 * @returns {Promise}
 */
export const createCustomer = (data) => {
  return request({
    url: '/customers',
    method: 'POST',
    data
  });
};

/**
 * 更新客户
 * @param {number|string} id - 客户 ID
 * @param {Object} data - 客户信息
 * @returns {Promise}
 */
export const updateCustomer = (id, data) => {
  return request({
    url: `/customers/${id}`,
    method: 'PUT',
    data
  });
};

/**
 * 删除客户
 * @param {number|string} id - 客户 ID
 * @returns {Promise}
 */
export const deleteCustomer = (id) => {
  return request({
    url: `/customers/${id}`,
    method: 'DELETE'
  });
};
