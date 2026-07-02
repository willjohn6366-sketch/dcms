import { getCircuitDetail } from '../../../api/circuit-api';

Page({
  data: {
    circuitId: 0,
    circuit: {},
    connectionDetail: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ circuitId: parseInt(options.id) });
      this.loadCircuitDetail();
    }
  },

  /**
   * 加载电路详情
   */
  async loadCircuitDetail() {
    try {
      wx.showLoading({ title: '加载中' });
      const res = await getCircuitDetail(this.data.circuitId);

      if (res.success) {
        const circuit = res.data;

        // 处理连接详情
        let connectionDetail = null;
        if (circuit.Connection) {
          const conn = circuit.Connection;
          connectionDetail = {
            sourceDevice: conn.SourcePort?.Device?.device_name || '-',
            sourcePort: conn.SourcePort?.port_name || '-',
            targetDevice: conn.TargetPort?.Device?.device_name || '-',
            targetPort: conn.TargetPort?.port_name || '-',
            connection_type: conn.connection_type,
            fiber_info: conn.fiber_info
          };
        }

        this.setData({
          circuit,
          connectionDetail
        });
      }
    } catch (error) {
      console.error('加载电路详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
