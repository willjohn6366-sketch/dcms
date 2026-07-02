const { Customer, Topology, Circuit } = require('../models');
const { Op } = require('sequelize');

/**
 * 客户业务逻辑层
 */
class CustomerService {
  /**
   * 获取所有客户列表
   * @returns {Promise<Array>} 客户列表
   */
  async getAllCustomers() {
    return await Customer.findAll({
      include: [
        {
          model: Circuit,
          attributes: ['id']
        }
      ]
    });
  }

  /**
   * 分页查询客户列表
   * @param {Object} filters - 查询条件 { page, pageSize, q }
   * @returns {Promise<Object>} 分页结果
   */
  async getCustomersPage(filters) {
    const page = Math.max(Number(filters.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
    const q = String(filters.q || '').trim();
    const where = {};

    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { contact_person: { [Op.like]: `%${q}%` } },
        { contact_phone: { [Op.like]: `%${q}%` } },
        { account_manager: { [Op.like]: `%${q}%` } },
        { manager_phone: { [Op.like]: `%${q}%` } }
      ];
    }

    const result = await Customer.findAndCountAll({
      where,
      include: [
        {
          model: Circuit,
          attributes: ['id']
        }
      ],
      order: [['updated_at', 'DESC']],
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    return {
      list: result.rows,
      total: result.count,
      page,
      pageSize
    };
  }

  /**
   * 根据ID获取客户详情
   * @param {number} id - 客户ID
   * @returns {Promise<Object>} 客户详情
   */
  async getCustomerById(id) {
    return await Customer.findByPk(id, {
      include: [
        {
          model: Topology
        },
        {
          model: Circuit
        }
      ]
    });
  }

  /**
   * 创建新客户
   * @param {Object} customerData - 客户数据
   * @returns {Promise<Object>} 创建的客户对象
   */
  async createCustomer(customerData) {
    return await Customer.create(customerData);
  }

  /**
   * 更新客户信息
   * @param {number} id - 客户ID
   * @param {Object} customerData - 更新的数据
   * @returns {Promise<Object>} 更新后的客户对象
   */
  async updateCustomer(id, customerData) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new Error('客户不存在');
    }
    return await customer.update(customerData);
  }

  /**
   * 删除客户
   * @param {number} id - 客户ID
   * @returns {Promise<number>} 删除的行数
   */
  async deleteCustomer(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new Error('客户不存在');
    }
    return await customer.destroy();
  }

  /**
   * 核查客户电路信息
   * @param {number} id - 客户ID
   * @returns {Promise<Object>} 更新后的客户对象
   */
  async checkCustomer(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw new Error('客户不存在');
    }
    return await customer.update({
      latest_check_date: new Date().toISOString().slice(0, 10)
    });
  }
}

module.exports = new CustomerService();
