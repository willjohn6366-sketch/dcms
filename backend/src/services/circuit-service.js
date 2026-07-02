const { Circuit, Customer, Topology, Device, Port, Connection } = require('../models');
const { Op } = require('sequelize');

/**
 * 电路业务逻辑层
 */
class CircuitService {
  /**
   * 创建电路
   */
  async createCircuit(data) {
    return await Circuit.create(data);
  }

  /**
   * 获取电路详情
   */
  async getCircuitDetail(id) {
    return await Circuit.findByPk(id, {
      include: [
        {
          model: Customer
        },
        {
          model: Topology,
          include: [
            {
              model: Device,
              include: [Port]
            },
            {
              model: Connection
            }
          ]
        },
        {
          model: Connection,
          include: [
            { model: Port, as: 'SourcePort' },
            { model: Port, as: 'TargetPort' }
          ]
        }
      ]
    });
  }

  /**
   * 更新电路信息
   */
  async updateCircuit(id, data) {
    const circuit = await Circuit.findByPk(id);
    if (!circuit) throw new Error('电路不存在');

    // 处理空值转 null 的情况（用于清除绑定）
    const processedData = {};
    for (const [key, value] of Object.entries(data)) {
      // 空字符串、undefined、null 都转为 null
      if (value === '' || value === undefined || value === null) {
        processedData[key] = null;
      } else {
        processedData[key] = value;
      }
    }

    return await circuit.update(processedData);
  }

  /**
   * 删除电路
   */
  async deleteCircuit(id) {
    const circuit = await Circuit.findByPk(id);
    if (!circuit) throw new Error('电路不存在');
    return await circuit.destroy();
  }

  /**
   * 搜索电路
   * @param {Object} filters - 搜索条件 { q, circuit_code, circuit_number, customer_id }
   */
  async searchCircuits(filters) {
    const where = {};
    const keyword = String(filters.q || filters.circuit_number || filters.circuit_code || '').trim();
    const hasPagination = filters.page !== undefined || filters.pageSize !== undefined;

    if (keyword) {
      where[Op.or] = [
        { circuit_number: { [Op.like]: `%${keyword}%` } },
        { circuit_name: { [Op.like]: `%${keyword}%` } },
        { local_ip: { [Op.like]: `%${keyword}%` } },
        { remote_ip: { [Op.like]: `%${keyword}%` } },
        { '$Customer.name$': { [Op.like]: `%${keyword}%` } }
      ];
    }

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    const query = {
      where,
      include: [
        { model: Customer },
        { model: Topology }
      ],
      order: [['created_at', 'DESC']],
      subQuery: false
    };

    if (!hasPagination) {
      return await Circuit.findAll(query);
    }

    const page = Math.max(Number(filters.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
    const result = await Circuit.findAndCountAll({
      ...query,
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
}

module.exports = new CircuitService();
