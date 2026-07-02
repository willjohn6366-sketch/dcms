<template>
  <view class="page" v-if="topology">
    <!-- 标题区 -->
    <view class="hero">
      <view class="hero__body">
        <text class="hero__title">{{ topology.topology_name }}</text>
        <text v-if="topology.description" class="hero__meta">{{ topology.description }}</text>
      </view>
    </view>

    <!-- 拓扑图可视化 -->
    <view class="block" v-if="visualDevices.length || renderedConnections.length">
      <view class="block__header">
        <text class="block__title">拓扑图</text>
        <view class="block__actions">
          <view class="action-btn" @tap="runAutoLayout">自动布局</view>
        </view>
      </view>

      <view class="topology-card">
        <view class="topology-summary">
          <view class="topology-summary__item">
            <text class="topology-summary__label">设备数</text>
            <text class="topology-summary__value">{{ devices.length }}</text>
          </view>
          <view class="topology-summary__item">
            <text class="topology-summary__label">连接数</text>
            <text class="topology-summary__value">{{ connections.length }}</text>
          </view>
          <view class="topology-summary__item">
            <text class="topology-summary__label">区域数</text>
            <text class="topology-summary__value">{{ locationRegions.length }}</text>
          </view>
        </view>

        <view class="topology-legend">
          <view v-for="item in CONNECTION_LEGEND" :key="item.value" class="topology-legend__item">
            <view class="topology-legend__line" :style="{ background: item.color }" />
            <text class="topology-legend__label">{{ item.label }}</text>
          </view>
        </view>

        <scroll-view class="topology-board" scroll-x>
          <view
            class="topology-stage"
            :style="{
              width: `${canvasBounds.width}px`,
              height: `${canvasBounds.height}px`
            }"
          >
            <!-- 区域背景 -->
            <view
              v-for="region in locationRegions"
              :key="region.key"
              class="topology-region"
              :style="{
                left: `${region.x}px`,
                top: `${region.y}px`,
                width: `${region.width}px`,
                height: `${region.height}px`,
                background: region.fill,
                borderColor: region.stroke,
                color: region.textColor
              }"
            >
              <text class="topology-region__label">{{ region.label }}</text>
            </view>

            <!-- 连接线 -->
            <view
              v-for="conn in renderedConnections"
              :key="conn.id"
              class="topology-line"
              :style="getConnectionStyle(conn)"
            ></view>

            <!-- 端口标签 -->
            <template v-for="conn in renderedConnections" :key="`label-${conn.id}`">
              <view
                class="topology-line-label"
                :style="{
                  left: `${conn.sourceLabel.x}px`,
                  top: `${conn.sourceLabel.y}px`,
                  width: `${conn.sourceLabel.width}px`
                }"
              >
                {{ conn.sourceLabel.text }}
              </view>
              <view
                class="topology-line-label"
                :style="{
                  left: `${conn.targetLabel.x}px`,
                  top: `${conn.targetLabel.y}px`,
                  width: `${conn.targetLabel.width}px`
                }"
              >
                {{ conn.targetLabel.text }}
              </view>
            </template>

            <!-- 设备节点 -->
            <view
              v-for="dev in visualDevices"
              :key="dev.id"
              class="topology-node"
              :style="{
                left: `${dev.x}px`,
                top: `${dev.y}px`
              }"
            >
              <view
                class="topology-node__icon"
                :style="{
                  color: dev.accent,
                  borderColor: dev.accent,
                  background: dev.surface
                }"
              >
                {{ dev.shortLabel }}
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 设备列表 -->
        <view v-if="devices.length" class="device-list">
          <view class="device-list__title">设备列表</view>
          <view class="device-chip-list">
            <view
              v-for="device in devices"
              :key="device.id"
              class="device-chip"
              @tap="viewPorts(device.id, device.device_name)"
            >
              {{ device.device_name }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="block">
      <view class="block__title">拓扑图</view>
      <view class="empty-card">暂无设备或连接数据</view>
    </view>

    <!-- 设备列表 section -->
    <view class="block">
      <view class="block__header">
        <text class="block__title">设备管理</text>
        <view class="block__actions">
          <view class="action-btn action-btn--primary" @tap="addDevice">+ 新增</view>
        </view>
      </view>

      <view class="list" v-if="devices.length">
        <view
          v-for="(dev, index) in devices"
          :key="dev.id"
          class="list-item"
          :class="{ 'list-item--last': index === devices.length - 1 }"
        >
          <view class="list-item__main">
            <text class="list-item__name">{{ dev.device_name }}</text>
            <text class="list-item__meta">
              {{ getDeviceTypeLabel(dev.device_type) }}
              <text v-if="dev.device_model"> · {{ dev.device_model }}</text>
              <text v-if="dev.location"> · {{ dev.location }}</text>
            </text>
          </view>
          <view class="list-item__actions">
            <view class="tag-btn tag-btn--blue" @tap="viewPorts(dev.id, dev.device_name)">端口</view>
            <view class="tag-btn tag-btn--red" @tap="confirmDeleteDevice(dev.id)">删除</view>
          </view>
        </view>
      </view>
      <view v-else class="empty-row">
        <text class="empty-row__text">暂无设备</text>
      </view>
    </view>

    <!-- 连接列表 section -->
    <view class="block">
      <view class="block__header">
        <text class="block__title">连接管理</text>
        <view class="block__actions">
          <view class="action-btn action-btn--primary" @tap="addConnection">+ 新增</view>
        </view>
      </view>

      <view class="list" v-if="connections.length">
        <view
          v-for="(conn, index) in connections"
          :key="conn.id"
          class="list-item"
          :class="{ 'list-item--last': index === connections.length - 1 }"
        >
          <view class="list-item__main">
            <view class="list-item__row">
              <text class="list-item__name">{{ getConnectionLabel(conn) }}</text>
              <text class="conn-type-badge" :class="`conn-type-badge--${conn.connection_type || 'other'}`">
                {{ getConnectionTypeLabel(conn.connection_type) }}
              </text>
            </view>
            <text v-if="conn.fiber_info" class="list-item__meta">{{ conn.fiber_info }}</text>
          </view>
          <view class="tag-btn tag-btn--red" @tap="confirmDeleteConnection(conn.id)">删除</view>
        </view>
      </view>
      <view v-else class="empty-row">
        <text class="empty-row__text">暂无连接</text>
      </view>
    </view>
  </view>

  <view v-else class="state-tip">
    <text class="state-tip__text">{{ loading ? '正在加载拓扑数据...' : '未找到拓扑信息' }}</text>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
import { fetchTopologyDetail, fetchAutoLayout, updateLayout } from '@/api/topology';
import { deleteDevice } from '@/api/device';
import { deleteConnection } from '@/api/connection';
import type { Topology, TopologyDevice, TopologyConnection, TopologyPort } from '@/types/topology';

type Point = { x: number; y: number };

type VisualDevice = TopologyDevice & {
  x: number;
  y: number;
  shortLabel: string;
  accent: string;
  surface: string;
};

type PortTag = {
  text: string;
  x: number;
  y: number;
  width: number;
};

type PortSlot = {
  side: 'left' | 'right' | 'top' | 'bottom';
  order: number;
  total: number;
};

type VisualConnection = TopologyConnection & {
  sourceAnchor: Point;
  targetAnchor: Point;
  sourceLabel: PortTag;
  targetLabel: PortTag;
};

type LocationRegion = {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  textColor: string;
};

const BASE_VIEWBOX_WIDTH = 900;
const BASE_VIEWBOX_HEIGHT = 480;
const CANVAS_PADDING = 72;

const loading = ref(false);
const topology = ref<Topology | null>(null);
const topologyId = ref(0);

const CONNECTION_LEGEND = [
  { label: '光纤', value: 'fiber', color: '#f59e0b' },
  { label: '网线', value: 'cable', color: '#7a8496' },
  { label: '其他', value: 'other', color: '#2563eb' },
];

const devices = computed(() => topology.value?.Devices || []);
const connections = computed(() => topology.value?.Connections || []);

// 端口到设备的映射
const portToDeviceMap = computed(() => {
  const map = new Map<number, number>();
  devices.value.forEach((device) => {
    (device.Ports || []).forEach((port) => map.set(port.id, device.id));
  });
  return map;
});

const portMap = computed(() => {
  const map = new Map<number, TopologyPort>();
  devices.value.forEach((device) => {
    (device.Ports || []).forEach((port) => map.set(port.id, port));
  });
  return map;
});

// 计算可视化设备位置
const visualDevices = computed<VisualDevice[]>(() => {
  const devs = devices.value;
  if (!devs.length) return [];

  const allPositioned = devs.every(
    (device) => typeof device.position_x === 'number' && typeof device.position_y === 'number'
  );

  if (allPositioned) {
    const xs = devs.map((item) => item.position_x as number);
    const ys = devs.map((item) => item.position_y as number);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xRange = Math.max(maxX - minX, 1);
    const yRange = Math.max(maxY - minY, 1);

    return devs.map((device) => buildVisualDevice(device, {
      x: 100 + (((device.position_x as number) - minX) / xRange) * 700,
      y: 90 + (((device.position_y as number) - minY) / yRange) * 300
    }));
  }

  // 按位置分组布局
  const groups = new Map<string, TopologyDevice[]>();
  const order: string[] = [];
  devs.forEach((device) => {
    const key = normalizeLocation(device.location);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)?.push(device);
  });

  const positioned: VisualDevice[] = [];
  order.forEach((key, groupIndex) => {
    const group = groups.get(key) || [];
    const baseX = 150 + (groupIndex % 3) * 260;
    const baseY = 120 + Math.floor(groupIndex / 3) * 170;

    group.forEach((device, index) => {
      positioned.push(buildVisualDevice(device, {
        x: baseX + (index % 2) * 110,
        y: baseY + Math.floor(index / 2) * 88
      }));
    });
  });

  return positioned;
});

const visualDeviceMap = computed(() => {
  const map = new Map<number, VisualDevice>();
  visualDevices.value.forEach((device) => map.set(device.id, device));
  return map;
});

// 端口使用统计
const portUsageStats = computed(() => {
  const stats = new Map<number, { count: number; firstConnectionId: number }>();
  connections.value.forEach((conn) => {
    [conn.source_port_id, conn.target_port_id].forEach((portId) => {
      if (!portId) return;
      const current = stats.get(portId);
      if (!current) {
        stats.set(portId, { count: 1, firstConnectionId: conn.id });
        return;
      }
      current.count += 1;
    });
  });
  return stats;
});

// 端口锚点方向
const portAnchorMap = computed(() => {
  const map = new Map<number, Point>();
  connections.value.forEach((conn) => {
    addPortAnchorDirection(map, conn.source_port_id, conn.target_port_id);
    addPortAnchorDirection(map, conn.target_port_id, conn.source_port_id);
  });
  return map;
});

// 设备端口槽位
const devicePortSlotMap = computed(() => {
  const sideGroups = new Map<number, Record<PortSlot['side'], Array<{ portId: number; vector: Point }>>>();
  portAnchorMap.value.forEach((vector, portId) => {
    const deviceId = portToDeviceMap.value.get(portId);
    if (!deviceId) return;
    if (!sideGroups.has(deviceId)) {
      sideGroups.set(deviceId, { left: [], right: [], top: [], bottom: [] });
    }
    const side = resolvePortSide(vector);
    sideGroups.get(deviceId)![side].push({ portId, vector });
  });

  const slotMap = new Map<number, PortSlot>();
  sideGroups.forEach((groups) => {
    (Object.keys(groups) as PortSlot['side'][]).forEach((side) => {
      const entries = groups[side];
      entries.sort((a, b) => sortBySide(side, a.vector, b.vector));
      entries.forEach((entry, index) => {
        slotMap.set(entry.portId, { side, order: index, total: entries.length });
      });
    });
  });
  return slotMap;
});

// 渲染连接
const renderedConnections = computed<VisualConnection[]>(() => {
  return connections.value
    .map((connection) => {
      const sourceDevice = findDeviceByPortId(connection.source_port_id);
      const targetDevice = findDeviceByPortId(connection.target_port_id);
      if (!sourceDevice || !targetDevice) return null;

      const sourceAnchor = getConnectionAnchor(connection.source_port_id, sourceDevice, targetDevice);
      const targetAnchor = getConnectionAnchor(connection.target_port_id, targetDevice, sourceDevice);
      const sourcePort = portMap.value.get(connection.source_port_id!);
      const targetPort = portMap.value.get(connection.target_port_id!);
      const sourceUsage = portUsageStats.value.get(connection.source_port_id!);
      const targetUsage = portUsageStats.value.get(connection.target_port_id!);

      return {
        ...connection,
        sourceAnchor,
        targetAnchor,
        sourceLabel: buildPortTag(
          formatPortLabel(sourcePort?.port_name, sourceUsage),
          sourceAnchor,
          sourceDevice,
          devicePortSlotMap.value.get(connection.source_port_id!)
        ),
        targetLabel: buildPortTag(
          formatPortLabel(targetPort?.port_name, targetUsage),
          targetAnchor,
          targetDevice,
          devicePortSlotMap.value.get(connection.target_port_id!)
        )
      };
    })
    .filter((item): item is VisualConnection => !!item);
});

// 画布边界
const canvasBounds = computed(() => {
  if (!visualDevices.value.length) {
    return { minX: 0, minY: 0, width: BASE_VIEWBOX_WIDTH, height: BASE_VIEWBOX_HEIGHT, maxX: BASE_VIEWBOX_WIDTH, maxY: BASE_VIEWBOX_HEIGHT };
  }

  const minX = Math.min(...visualDevices.value.map((dev) => dev.x - 150)) - CANVAS_PADDING;
  const maxX = Math.max(...visualDevices.value.map((dev) => dev.x + 150)) + CANVAS_PADDING;
  const minY = Math.min(...visualDevices.value.map((dev) => dev.y - 96)) - CANVAS_PADDING;
  const maxY = Math.max(...visualDevices.value.map((dev) => dev.y + 112)) + CANVAS_PADDING;

  return {
    minX: Math.min(0, Math.floor(minX)),
    minY: Math.min(0, Math.floor(minY)),
    width: Math.max(BASE_VIEWBOX_WIDTH, Math.ceil(maxX - minX)),
    height: Math.max(BASE_VIEWBOX_HEIGHT, Math.ceil(maxY - minY)),
    maxX: Math.max(BASE_VIEWBOX_WIDTH, Math.ceil(maxX)),
    maxY: Math.max(BASE_VIEWBOX_HEIGHT, Math.ceil(maxY))
  };
});

// 位置区域
const locationRegions = computed<LocationRegion[]>(() => {
  const palette = [
    { fill: 'rgba(37, 99, 235, 0.06)', stroke: '#bfdbfe', textColor: '#1e3a8a' },
    { fill: 'rgba(15, 118, 110, 0.05)', stroke: '#b7ded7', textColor: '#0f766e' },
    { fill: 'rgba(245, 158, 11, 0.06)', stroke: '#f3d69a', textColor: '#92400e' },
    { fill: 'rgba(122, 132, 150, 0.06)', stroke: '#d6dce6', textColor: '#5f6b7a' }
  ];

  const groups = new Map<string, VisualDevice[]>();
  visualDevices.value.forEach((device) => {
    const key = normalizeLocation(device.location);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(device);
  });

  return Array.from(groups.entries()).map(([key, devs], index) => {
    const current = palette[index % palette.length];
    const minX = Math.min(...devs.map((device) => device.x - 76));
    const maxX = Math.max(...devs.map((device) => device.x + 76));
    const minY = Math.min(...devs.map((device) => device.y - 48));
    const maxY = Math.max(...devs.map((device) => device.y + 70));

    return {
      key,
      label: key,
      x: minX - 18,
      y: minY - 24,
      width: maxX - minX + 36,
      height: maxY - minY + 44,
      fill: current.fill,
      stroke: current.stroke,
      textColor: current.textColor
    };
  });
});

// 辅助函数
function buildVisualDevice(device: TopologyDevice, point: Point): VisualDevice {
  const style = getDeviceStyle(device.device_type);
  const shortLabel = shorten(device.device_name, 8);
  return { ...device, x: point.x, y: point.y, shortLabel, accent: style.accent, surface: style.surface };
}

function getDeviceStyle(type: string | null | undefined) {
  const map: Record<string, { accent: string; surface: string }> = {
    router: { accent: '#2563eb', surface: '#eff6ff' },
    switch: { accent: '#0f766e', surface: '#f0fdfa' },
    odf: { accent: '#5f6b7a', surface: '#f8fbff' },
    optical_device: { accent: '#2563eb', surface: '#eff6ff' },
    other: { accent: '#7a8496', surface: '#f8fbff' }
  };
  return map[type || ''] || map.other;
}

function shorten(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function estimateTextWidth(text: string) {
  return Math.max(40, Math.min(108, text.length * 11 + 12));
}

function normalizeLocation(value: string | null | undefined) {
  return (value || '').trim();
}

function buildPortTag(portName: string | null | undefined, anchor: Point, device: VisualDevice, slot?: PortSlot): PortTag {
  const text = (portName || '').trim() || '未命名';
  const width = estimateTextWidth(text);
  const labelHalfHeight = 9;
  const gap = 8;
  const side = slot?.side || resolvePortLabelSide(anchor, device);

  let x = anchor.x;
  let y = anchor.y;

  if (side === 'left') x = anchor.x - width / 2 - gap;
  if (side === 'right') x = anchor.x + width / 2 + gap;
  if (side === 'top') y = anchor.y - labelHalfHeight - gap;
  if (side === 'bottom') y = anchor.y + labelHalfHeight + gap;

  if (slot && slot.total > 1) {
    const spread = (slot.order - (slot.total - 1) / 2) * 18;
    if (side === 'left' || side === 'right') y += spread;
    else x += spread;
  }

  return { text, x, y, width };
}

function resolvePortLabelSide(anchor: Point, device: VisualDevice): PortSlot['side'] {
  const dx = anchor.x - device.x;
  const dy = anchor.y - device.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function formatPortLabel(portName: string | null | undefined, usage: { count: number; firstConnectionId: number } | undefined) {
  const text = (portName || '').trim();
  if (!text) return '未命名';
  if (usage && usage.count > 1) return `${text} 汇聚`;
  return text;
}

function lineColor(type: string | null | undefined) {
  return CONNECTION_LEGEND.find((item) => item.value === type)?.color || '#7a8496';
}

function findDeviceByPortId(portId: number | null | undefined) {
  if (!portId) return null;
  const deviceId = portToDeviceMap.value.get(portId);
  if (!deviceId) return null;
  return visualDeviceMap.value.get(deviceId) || null;
}

function resolvePortSide(vector: Point): PortSlot['side'] {
  if (Math.abs(vector.x) >= Math.abs(vector.y)) return vector.x >= 0 ? 'right' : 'left';
  return vector.y >= 0 ? 'bottom' : 'top';
}

function sortBySide(side: PortSlot['side'], a: Point, b: Point) {
  if (side === 'left' || side === 'right') return a.y - b.y;
  return a.x - b.x;
}

function addPortAnchorDirection(map: Map<number, Point>, fromPortId: number | null, toPortId: number | null) {
  if (!fromPortId || !toPortId) return;
  const fromDeviceId = portToDeviceMap.value.get(fromPortId);
  const toDeviceId = portToDeviceMap.value.get(toPortId);
  if (!fromDeviceId || !toDeviceId) return;
  const fromDevice = visualDeviceMap.value.get(fromDeviceId);
  const toDevice = visualDeviceMap.value.get(toDeviceId);
  if (!fromDevice || !toDevice) return;

  const current = map.get(fromPortId);
  const next = { x: toDevice.x - fromDevice.x, y: toDevice.y - fromDevice.y };
  if (!current) { map.set(fromPortId, next); return; }
  current.x += next.x;
  current.y += next.y;
}

function getConnectionAnchor(portId: number | null, fromDevice: VisualDevice, fallbackTarget: VisualDevice) {
  if (!portId) return getDeviceAnchor(fromDevice, fallbackTarget);
  const sharedDirection = portAnchorMap.value.get(portId);
  if (sharedDirection && (sharedDirection.x !== 0 || sharedDirection.y !== 0)) {
    const slot = devicePortSlotMap.value.get(portId);
    if (slot) return getSlottedDeviceAnchor(fromDevice, slot);
    return getDeviceAnchor(fromDevice, { x: fromDevice.x + sharedDirection.x, y: fromDevice.y + sharedDirection.y });
  }
  return getDeviceAnchor(fromDevice, fallbackTarget);
}

function getSlottedDeviceAnchor(device: VisualDevice, slot: PortSlot): Point {
  const halfWidth = 28, halfHeight = 20;
  const position = ((slot.order + 1) / (slot.total + 1) - 0.5) * 2;
  switch (slot.side) {
    case 'left': return { x: device.x - halfWidth, y: device.y + position * (halfHeight * 0.9) };
    case 'right': return { x: device.x + halfWidth, y: device.y + position * (halfHeight * 0.9) };
    case 'top': return { x: device.x + position * (halfWidth * 0.9), y: device.y - halfHeight };
    case 'bottom': return { x: device.x + position * (halfWidth * 0.9), y: device.y + halfHeight };
  }
}

function getDeviceAnchor(from: VisualDevice, to: { x: number; y: number }) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const halfWidth = 28, halfHeight = 20;
  if (dx === 0 && dy === 0) return { x: from.x, y: from.y };
  const scale = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function getConnectionStyle(conn: VisualConnection) {
  const dx = conn.targetAnchor.x - conn.sourceAnchor.x;
  const dy = conn.targetAnchor.y - conn.sourceAnchor.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    left: `${conn.sourceAnchor.x}px`,
    top: `${conn.sourceAnchor.y}px`,
    width: `${length}px`,
    transform: `rotate(${angle}deg)`,
    background: lineColor(conn.connection_type)
  };
}

function getDeviceTypeLabel(type: string | null | undefined) {
  const labels: Record<string, string> = { router: '路由器', switch: '交换机', odf: 'ODF', optical_device: '光设备', other: '其他' };
  return labels[type || ''] || '其他';
}

function getConnectionTypeLabel(type: string | null | undefined) {
  return CONNECTION_LEGEND.find((item) => item.value === type)?.label || '其他';
}

function getConnectionLabel(conn: TopologyConnection) {
  const sourcePort = portMap.value.get(conn.source_port_id!);
  const targetPort = portMap.value.get(conn.target_port_id!);
  const sourceDevice = findDeviceByPortId(conn.source_port_id);
  const targetDevice = findDeviceByPortId(conn.target_port_id);
  return `${sourceDevice?.device_name || '源'}:${sourcePort?.port_name || '?'} → ${targetDevice?.device_name || '目标'}:${targetPort?.port_name || '?'}`;
}

// 操作函数
function addDevice() {
  uni.navigateTo({ url: `/pages/device/form/index?topology_id=${topologyId.value}` });
}

function viewPorts(deviceId: number, deviceName: string) {
  uni.navigateTo({ url: `/pages/device/ports/index?device_id=${deviceId}&device_name=${encodeURIComponent(deviceName)}&topology_id=${topologyId.value}` });
}

function addConnection() {
  uni.navigateTo({ url: `/pages/connection/form/index?topology_id=${topologyId.value}` });
}

function confirmDeleteDevice(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '删除设备将同时删除其端口及相关连接，确认继续？',
    confirmColor: '#d9534f',
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await deleteDevice(id);
        uni.showToast({ title: '已删除', icon: 'success' });
        loadTopology(topologyId.value);
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' });
      }
    }
  });
}

function confirmDeleteConnection(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '确认删除该连接？',
    confirmColor: '#d9534f',
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await deleteConnection(id);
        uni.showToast({ title: '已删除', icon: 'success' });
        loadTopology(topologyId.value);
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' });
      }
    }
  });
}

async function loadTopology(id: number) {
  loading.value = true;
  try {
    topology.value = await fetchTopologyDetail(id);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function runAutoLayout() {
  if (!topologyId.value) return;
  uni.showLoading({ title: '计算布局...' });
  try {
    const positions = await fetchAutoLayout(topologyId.value);
    // 应用布局到设备
    await updateLayout(topologyId.value, positions);
    uni.hideLoading();
    uni.showToast({ title: '布局已更新', icon: 'success' });
    await loadTopology(topologyId.value);
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: error instanceof Error ? error.message : '布局失败', icon: 'none' });
  }
}

onLoad((query) => {
  topologyId.value = Number(query?.id) || 0;
});

onShow(() => {
  if (topologyId.value) loadTopology(topologyId.value);
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 28rpx 28rpx 96rpx;
  background: var(--cm-bg);
}

.hero,
.block {
  box-sizing: border-box;
  border: 1rpx solid var(--cm-border);
  border-radius: 26rpx;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
}

.hero {
  padding: 30rpx;
  color: var(--cm-text);
}

.hero__title {
  display: block;
  color: var(--cm-text);
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.28;
}

.hero__meta {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--cm-muted);
  line-height: 1.35;
}

.block {
  margin-top: 24rpx;
  padding: 26rpx;
}

.block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.block__title {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--cm-text);
  line-height: 1.25;
}

.block__actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  height: 52rpx;
  padding: 0 18rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.16);
  border-radius: 16rpx;
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 52rpx;
}

.action-btn--primary {
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
}

/* 拓扑图卡片 */
.topology-card {
  border: 1rpx solid #edf1f7;
  border-radius: 24rpx;
  background: #f8fbff;
  padding: 20rpx;
}

.topology-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.topology-summary__item {
  padding: 18rpx 16rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 18rpx;
  background: var(--cm-surface);
  text-align: center;
}

.topology-summary__label {
  display: block;
  font-size: 20rpx;
  color: var(--cm-muted);
}

.topology-summary__value {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--cm-primary);
}

.topology-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 18rpx;
}

.topology-legend__item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  height: 44rpx;
  padding: 0 14rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 999rpx;
  background: var(--cm-surface);
}

.topology-legend__line {
  width: 34rpx;
  height: 5rpx;
  border-radius: 999rpx;
}

.topology-legend__label {
  color: var(--cm-muted);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
}

.topology-board {
  margin-top: 20rpx;
  border: 1px solid #dbe3ef;
  border-radius: 20rpx;
  white-space: nowrap;
  background:
    linear-gradient(90deg, rgba(219, 227, 239, 0.42) 1px, transparent 1px),
    linear-gradient(180deg, rgba(219, 227, 239, 0.42) 1px, transparent 1px),
    #ffffff;
  background-size: 36px 36px;
}

.topology-stage {
  position: relative;
  min-width: 900px;
  min-height: 560px;
}

.topology-region {
  position: absolute;
  box-sizing: border-box;
  border: 2px dashed;
  border-radius: 20px;
}

.topology-region__label {
  position: absolute;
  left: 14px;
  top: 12px;
  font-size: 13px;
  font-weight: 700;
}

.topology-line {
  position: absolute;
  height: 3px;
  transform-origin: left center;
  border-radius: 999px;
  z-index: 1;
}

.topology-line-label {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 2px 6px;
  min-height: 18px;
  line-height: 12px;
  box-sizing: border-box;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #dbe3ef;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #5f6b7a;
  z-index: 3;
}

.topology-node {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.topology-node__icon {
  min-width: 56px;
  padding: 0 14px;
  height: 36px;
  border-radius: 12px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-sizing: border-box;
  white-space: nowrap;
}

.device-list {
  margin-top: 20rpx;
}

.device-list__title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.device-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 14rpx;
}

.device-chip {
  padding: 10rpx 18rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 999rpx;
  background: var(--cm-surface);
  font-size: 21rpx;
  color: var(--cm-muted);
}

/* 列表样式 */
.list {
  border-top: 1rpx solid #edf1f7;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #edf1f7;
  gap: 16rpx;
}

.list-item--last {
  border-bottom: none;
}

.list-item__main {
  flex: 1;
  min-width: 0;
}

.list-item__row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.list-item__name {
  display: block;
  overflow: hidden;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--cm-text);
  margin-bottom: 6rpx;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__meta {
  display: block;
  overflow: hidden;
  font-size: 24rpx;
  color: var(--cm-muted);
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.conn-type-badge {
  font-size: 22rpx;
  font-weight: 700;
  padding: 4rpx 14rpx;
  border-radius: 24rpx;
}

.conn-type-badge--fiber {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
}

.conn-type-badge--cable {
  background: #f1f5fb;
  color: var(--cm-muted);
}

.conn-type-badge--other {
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
}

.tag-btn {
  padding: 8rpx 20rpx;
  border: 1rpx solid transparent;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.tag-btn--blue {
  border-color: rgba(37, 99, 235, 0.16);
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
}

.tag-btn--red {
  border-color: rgba(220, 38, 38, 0.12);
  background: rgba(255, 59, 48, 0.08);
  color: var(--cm-danger);
}

.empty-row {
  padding: 40rpx 0;
  text-align: center;
}

.empty-row__text {
  font-size: 26rpx;
  color: var(--cm-muted);
}

.empty-card {
  padding: 60rpx 24rpx;
  border: 1rpx solid #edf1f7;
  border-radius: 20rpx;
  background: #f8fbff;
  text-align: center;
  font-size: 24rpx;
  color: var(--cm-muted);
}

.state-tip {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 120rpx 32rpx;
  background: var(--cm-bg);
  text-align: center;
}

.state-tip__text {
  font-size: 28rpx;
  color: var(--cm-muted);
}
</style>
