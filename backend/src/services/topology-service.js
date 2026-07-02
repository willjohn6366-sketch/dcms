const { Topology, Device, Connection, Port, Circuit, Customer } = require('../models');
const { Op } = require('sequelize');

/**
 * 拓扑业务逻辑层
 */
class TopologyService {
  /**
   * 获取所有拓扑
   */
  async getAllTopologies() {
    return await Topology.findAll({
      include: [
        {
          model: Customer,
          attributes: ['id', 'name']
        },
        {
          model: Device,
          attributes: ['id']
        },
        {
          model: Connection,
          attributes: ['id']
        }
      ]
    });
  }

  /**
   * 获取客户的所有拓扑
   * @param {number} customerId - 客户ID
   */
  async getTopologiesByCustomerId(customerId) {
    return await Topology.findAll({
      where: { customer_id: customerId },
      include: [
        {
          model: Customer,
          attributes: ['id', 'name']
        },
        {
          model: Device,
          attributes: ['id']
        },
        {
          model: Connection,
          attributes: ['id']
        }
      ]
    });
  }

  /**
   * 分页查询拓扑列表
   * @param {Object} filters - 查询条件 { customer_id, page, pageSize, q }
   */
  async getTopologiesPage(filters) {
    const page = Math.max(Number(filters.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(filters.pageSize) || 20, 1), 100);
    const q = String(filters.q || '').trim();
    const where = {};

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    const result = await Topology.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          attributes: ['id', 'name'],
          where: q ? { name: { [Op.like]: `%${q}%` } } : undefined,
          required: Boolean(q)
        },
        {
          model: Device,
          attributes: ['id']
        },
        {
          model: Connection,
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
   * 获取拓扑详情（包含设备、端口、连接）
   * @param {number} id - 拓扑ID
   */
  async getTopologyDetail(id) {
    return await Topology.findByPk(id, {
      include: [
        {
          model: Customer,
          attributes: ['id', 'name']
        },
        {
          model: Device,
          include: [Port]
        },
        {
          model: Connection,
          include: [Circuit]
        }
      ]
    });
  }

  /**
   * 创建拓扑
   */
  async createTopology(data) {
    return await Topology.create(data);
  }

  /**
   * 更新拓扑信息
   */
  async updateTopology(id, data) {
    const topology = await Topology.findByPk(id);
    if (!topology) throw new Error('拓扑不存在');
    return await topology.update(data);
  }

  /**
   * 删除拓扑
   */
  async deleteTopology(id) {
    const topology = await Topology.findByPk(id);
    if (!topology) throw new Error('拓扑不存在');
    return await topology.destroy();
  }

  /**
   * 更新设备布局坐标
   * @param {number} id - 拓扑ID
   * @param {Array} devicePositions - 设备位置数组 [{id, x, y}]
   */
  async updateLayout(id, devicePositions) {
    const topology = await Topology.findByPk(id);
    if (!topology) throw new Error('拓扑不存在');

    // 批量更新设备坐标
    const promises = devicePositions.map(pos => 
      Device.update(
        { position_x: pos.x, position_y: pos.y },
        { where: { id: pos.id, topology_id: id } }
      )
    );
    
    await Promise.all(promises);
    return { success: true };
  }
}

module.exports = new TopologyService();
