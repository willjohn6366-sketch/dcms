/**
 * 拓扑图 Canvas 组件
 * 负责绘制设备、连接线,并处理交互
 */
import { debounce } from '../../utils/debounce';

Component({
  properties: {
    // 拓扑 ID
    topologyId: {
      type: Number,
      value: 0
    },
    // 高亮的连接 ID（用于电路详情页）
    highlightConnectionId: {
      type: Number,
      value: null
    },
    // 是否可编辑（拖动设备）
    editable: {
      type: Boolean,
      value: false
    }
  },

  data: {
    devices: [],
    connections: [],
    canvasWidth: 0,
    canvasHeight: 0,
    showDevicePopup: false,
    showConnectionPopup: false,
    selectedDevice: {},
    selectedConnection: {},

    // 拖动相关
    draggingDevice: null,
    dragStartX: 0,
    dragStartY: 0
  },

  lifetimes: {
    attached() {
      this.initCanvas();
      // 创建防抖的保存函数
      this.debouncedSavePosition = debounce(this.saveDevicePosition.bind(this), 500);
    }
  },

  observers: {
    'topologyId': function(newVal) {
      if (newVal) {
        this.loadTopology();
      }
    }
  },

  methods: {
    /**
     * 初始化 Canvas
     */
    async initCanvas() {
      const query = this.createSelectorQuery();
      query.select('#topologyCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            const dpr = wx.getSystemInfoSync().pixelRatio;
            canvas.width = res[0].width * dpr;
            canvas.height = res[0].height * dpr;
            ctx.scale(dpr, dpr);

            this.canvas = canvas;
            this.ctx = ctx;
            this.setData({
              canvasWidth: res[0].width,
              canvasHeight: res[0].height
            });

            // 加载拓扑数据
            if (this.data.topologyId) {
              this.loadTopology();
            }
          }
        });
    },

    /**
     * 加载拓扑数据
     */
    async loadTopology() {
      try {
        const { getTopologyDetail } = require('../../api/topology-api');
        const res = await getTopologyDetail(this.data.topologyId);

        if (res.success) {
          const topology = res.data;
          this.setData({
            devices: topology.Devices || [],
            connections: topology.Connections || []
          });

          this.draw();
        }
      } catch (error) {
        console.error('加载拓扑失败:', error);
        wx.showToast({ title: '加载拓扑失败', icon: 'none' });
      }
    },

    /**
     * 绘制拓扑图
     */
    draw() {
      if (!this.ctx) return;

      const ctx = this.ctx;
      const { canvasWidth, canvasHeight, devices, connections, highlightConnectionId } = this.data;

      // 清空画布
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 绘制连接线
      connections.forEach(conn => {
        this.drawConnection(conn, conn.id === highlightConnectionId);
      });

      // 绘制设备
      devices.forEach(device => {
        this.drawDevice(device);
      });
    },

    /**
     * 绘制设备
     */
    drawDevice(device) {
      const ctx = this.ctx;
      const x = device.position_x || 100;
      const y = device.position_y || 100;
      const size = 40;

      // 绘制设备图标（矩形）
      ctx.fillStyle = this.getDeviceColor(device.device_type);
      ctx.fillRect(x - size/2, y - size/2, size, size);

      // 绘制边框
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - size/2, y - size/2, size, size);

      // 绘制设备名称
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(device.device_name, x, y + size/2 + 15);

      // 保存设备绘制区域（用于点击检测）
      device._renderBounds = {
        x: x - size/2,
        y: y - size/2,
        width: size,
        height: size
      };
    },

    /**
     * 绘制连接线
     */
    drawConnection(connection, isHighlight = false) {
      const ctx = this.ctx;
      const { devices } = this.data;

      // 查找源设备和目标设备
      const sourceDevice = devices.find(d =>
        d.Ports && d.Ports.some(p => p.id === connection.source_port_id)
      );
      const targetDevice = devices.find(d =>
        d.Ports && d.Ports.some(p => p.id === connection.target_port_id)
      );

      if (!sourceDevice || !targetDevice) return;

      const x1 = sourceDevice.position_x || 100;
      const y1 = sourceDevice.position_y || 100;
      const x2 = targetDevice.position_x || 200;
      const y2 = targetDevice.position_y || 200;

      // 设置线条样式
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (isHighlight) {
        ctx.strokeStyle = '#ff4d4f';
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = connection.connection_type === 'fiber' ? '#1890ff' : '#52c41a';
        ctx.lineWidth = 2;
      }

      ctx.stroke();

      // 保存连接绘制区域（用于点击检测）
      connection._renderBounds = { x1, y1, x2, y2 };
    },

    /**
     * 获取设备颜色
     */
    getDeviceColor(type) {
      const colors = {
        router: '#1890ff',
        switch: '#52c41a',
        odf: '#faad14',
        optical_device: '#722ed1',
        other: '#8c8c8c'
      };
      return colors[type] || colors.other;
    },

    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
      if (!this.data.editable) return;

      const touch = e.touches[0];
      const x = touch.x;
      const y = touch.y;

      // 检测是否点击了设备
      const device = this.getDeviceAtPoint(x, y);
      if (device) {
        this.setData({
          draggingDevice: device,
          dragStartX: x,
          dragStartY: y
        });
      }
    },

    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
      if (!this.data.editable || !this.data.draggingDevice) return;

      const touch = e.touches[0];
      const x = touch.x;
      const y = touch.y;

      // 更新设备位置
      const device = this.data.draggingDevice;
      device.position_x = x;
      device.position_y = y;

      // 重新绘制
      this.draw();
    },

    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
      if (!this.data.editable || !this.data.draggingDevice) return;

      // 使用防抖保存设备位置
      this.debouncedSavePosition(this.data.draggingDevice);

      this.setData({
        draggingDevice: null
      });
    },

    /**
     * 处理点击
     */
    handleTap(e) {
      const x = e.detail.x;
      const y = e.detail.y;

      // 检测点击的设备
      const device = this.getDeviceAtPoint(x, y);
      if (device) {
        this.setData({
          selectedDevice: device,
          showDevicePopup: true
        });
        return;
      }

      // 检测点击的连接
      const connection = this.getConnectionAtPoint(x, y);
      if (connection) {
        this.setData({
          selectedConnection: connection,
          showConnectionPopup: true
        });
      }
    },

    /**
     * 获取点击位置的设备
     */
    getDeviceAtPoint(x, y) {
      return this.data.devices.find(device => {
        const bounds = device._renderBounds;
        if (!bounds) return false;
        return x >= bounds.x && x <= bounds.x + bounds.width &&
               y >= bounds.y && y <= bounds.y + bounds.height;
      });
    },

    /**
     * 获取点击位置的连接
     */
    getConnectionAtPoint(x, y) {
      const threshold = 10; // 点击阈值

      return this.data.connections.find(conn => {
        const bounds = conn._renderBounds;
        if (!bounds) return false;

        // 计算点到线段的距离
        const distance = this.pointToLineDistance(x, y, bounds.x1, bounds.y1, bounds.x2, bounds.y2);
        return distance < threshold;
      });
    },

    /**
     * 计算点到线段的距离
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;

      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 保存设备位置
     */
    async saveDevicePosition(device) {
      try {
        const { updateLayout } = require('../../api/topology-api');
        await updateLayout(this.data.topologyId, [{
          id: device.id,
          x: device.position_x,
          y: device.position_y
        }]);
      } catch (error) {
        console.error('保存位置失败:', error);
      }
    },

    /**
     * 关闭弹窗
     */
    closePopup() {
      this.setData({
        showDevicePopup: false,
        showConnectionPopup: false
      });
    }
  }
});
