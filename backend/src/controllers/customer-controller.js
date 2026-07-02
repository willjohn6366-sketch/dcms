const customerService = require('../services/customer-service');
const { success } = require('../utils/response');

/**
 * 客户控制器层
 */
class CustomerController {
  /**
   * 获取所有客户
   */
  async getAllCustomers(req, res, next) {
    try {
      const hasPageQuery = ['page', 'pageSize', 'q'].some((key) => req.query[key] !== undefined);
      if (hasPageQuery) {
        const customers = await customerService.getCustomersPage(req.query);
        return res.json(success(customers));
      }

      const customers = await customerService.getAllCustomers();
      res.json(success(customers));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取客户详情
   */
  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '客户不存在' }
        });
      }
      res.json(success(customer));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建客户
   */
  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json(success(customer, '客户创建成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新客户
   */
  async updateCustomer(req, res, next) {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      res.json(success(customer, '客户信息更新成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除客户
   */
  async deleteCustomer(req, res, next) {
    try {
      await customerService.deleteCustomer(req.params.id);
      res.json(success(null, '客户删除成功'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * 核查客户
   */
  async checkCustomer(req, res, next) {
    try {
      const customer = await customerService.checkCustomer(req.params.id);
      res.json(success(customer, '客户核查成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
