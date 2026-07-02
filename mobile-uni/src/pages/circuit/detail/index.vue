<template>
  <view class="page" v-if="circuit">
    <view class="hero">
      <view class="hero__body">
        <view class="hero__title">{{ circuit.circuit_name }}</view>
        <view class="hero__meta">{{ circuit.circuit_type || '未分类' }} · {{ circuit.bandwidth || '未填带宽' }}</view>
      </view>
      <view class="hero__edit" @tap="editCircuit">编辑</view>
    </view>

    <view class="block">
      <view class="block__title">基础信息</view>
      <view class="info-grid">
        <view class="info-item info-item--clickable" @tap="copyCircuitNumber">
          <text class="info-item__label">电路编号</text>
          <text class="info-item__value">{{ circuit.circuit_number || '未填写' }}</text>
        </view>
        <view class="info-item">
          <text class="info-item__label">归属客户</text>
          <text class="info-item__value">{{ circuit.Customer?.name || '未绑定' }}</text>
        </view>
        <view class="info-item">
          <text class="info-item__label">所属拓扑</text>
          <text class="info-item__value">{{ circuit.Topology?.topology_name || '未绑定' }}</text>
        </view>
        <view class="info-item">
          <text class="info-item__label">开通日期</text>
          <text class="info-item__value">{{ circuit.open_date || '未填写' }}</text>
        </view>
      </view>
    </view>

    <view class="block">
      <view class="block__title">地址信息</view>
      <view class="ip-path">
        <view class="ip-path__side">
          <text class="ip-path__label">本端 IP</text>
          <text class="ip-path__value">{{ circuit.local_ip || '未填写' }}</text>
        </view>
        <view class="ip-path__side">
          <text class="ip-path__label">对端 IP</text>
          <text class="ip-path__value">{{ circuit.remote_ip || '未填写' }}</text>
        </view>
      </view>
    </view>

    <view class="block" v-if="topologyDevices.length || topologyConnections.length">
      <view class="block__title">拓扑图</view>

      <view class="topology-card">
        <view class="topology-summary">
          <view class="topology-summary__item">
            <text class="topology-summary__label">设备数</text>
            <text class="topology-summary__value">{{ topologyDevices.length }}</text>
          </view>
          <view class="topology-summary__item">
            <text class="topology-summary__label">连接数</text>
            <text class="topology-summary__value">{{ topologyConnections.length }}</text>
          </view>
          <view class="topology-summary__item">
            <text class="topology-summary__label">高亮连接</text>
            <text class="topology-summary__value">{{ circuit?.connection_id || '无' }}</text>
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

            <view
              v-for="conn in renderedConnections"
              :key="conn.id"
              class="topology-line"
              :class="{ 'topology-line--active': conn.isActive }"
              :style="getConnectionStyle(conn)"
            ></view>

            <template v-for="conn in renderedConnections" :key="`label-${conn.id}`">
              <view
                class="topology-line-label"
                :class="{ 'topology-line-label--active': conn.isActive }"
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
                :class="{ 'topology-line-label--active': conn.isActive }"
                :style="{
                  left: `${conn.targetLabel.x}px`,
                  top: `${conn.targetLabel.y}px`,
                  width: `${conn.targetLabel.width}px`
                }"
              >
                {{ conn.targetLabel.text }}
              </view>
            </template>

            <view
              v-for="dev in visualDevices"
              :key="dev.id"
              class="topology-node"
              :class="{ 'topology-node--endpoint': dev.isEndpoint }"
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

        <view v-if="activePathText" class="path-card">
          <view class="path-card__title">当前电路路径</view>
          <view class="path-card__value">{{ activePathText }}</view>
        </view>
      </view>
    </view>

    <view v-else class="block">
      <view class="block__title">拓扑图</view>
      <view class="empty-card">当前电路暂无可展示的拓扑数据</view>
    </view>
  </view>

  <view v-else class="state">{{ loading ? '正在加载电路详情...' : '未找到电路信息' }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { fetchCircuitDetail } from '@/api/circuit';
import type { Circuit, TopologyConnection, TopologyDevice, TopologyPort } from '@/types/circuit';

type Point = { x: number; y: number };

type VisualDevice = TopologyDevice & {
  x: number;
  y: number;
  shortLabel: string;
  accent: string;
  surface: string;
  isEndpoint: boolean;
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
  isActive: boolean;
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
const circuit = ref<Circuit | null>(null);
const circuitId = ref(0);
const hasLoaded = ref(false);

const CONNECTION_LEGEND = [
  { label: '光纤', value: 'fiber', color: '#f59e0b' },
  { label: '网线', value: 'cable', color: '#7a8496' },
  { label: '其他', value: 'other', color: '#2563eb' },
];

const topologyDevices = computed(() => circuit.value?.Topology?.Devices || []);
const topologyConnections = computed(() => circuit.value?.Topology?.Connections || []);

const endpointPortIds = computed(() => {
  const source = circuit.value?.Connection?.SourcePort?.id;
  const target = circuit.value?.Connection?.TargetPort?.id;
  return [source, target].filter((id): id is number => typeof id === 'number');
});

const endpointDeviceIds = computed(() => {
  const ids = new Set<number>();
  topologyDevices.value.forEach((device) => {
    if (device.Ports?.some((port) => endpointPortIds.value.includes(port.id))) ids.add(device.id);
  });
  return Array.from(ids);
});

const visualDevices = computed<VisualDevice[]>(() => {
  const devices = topologyDevices.value;
  if (!devices.length) return [];

  const allPositioned = devices.every(
    (device) => typeof device.position_x === 'number' && typeof device.position_y === 'number'
  );

  if (allPositioned) {
    const xs = devices.map((item) => item.position_x as number);
    const ys = devices.map((item) => item.position_y as number);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xRange = Math.max(maxX - minX, 1);
    const yRange = Math.max(maxY - minY, 1);

    return devices.map((device) => buildVisualDevice(device, {
      x: 100 + (((device.position_x as number) - minX) / xRange) * 700,
      y: 90 + (((device.position_y as number) - minY) / yRange) * 300
    }));
  }

  const groups = new Map<string, TopologyDevice[]>();
  const order: string[] = [];
  devices.forEach((device) => {
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

const portToDeviceMap = computed(() => {
  const map = new Map<number, number>();
  topologyDevices.value.forEach((device) => {
    (device.Ports || []).forEach((port) => map.set(port.id, device.id));
  });
  return map;
});

const portMap = computed(() => {
  const map = new Map<number, TopologyPort>();
  topologyDevices.value.forEach((device) => {
    (device.Ports || []).forEach((port) => map.set(port.id, port));
  });
  return map;
});

const portUsageStats = computed(() => {
  const stats = new Map<number, { count: number; firstConnectionId: number }>();

  topologyConnections.value.forEach((conn) => {
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

const portAnchorMap = computed(() => {
  const map = new Map<number, Point>();

  topologyConnections.value.forEach((conn) => {
    addPortAnchorDirection(map, conn.source_port_id, conn.target_port_id);
    addPortAnchorDirection(map, conn.target_port_id, conn.source_port_id);
  });

  return map;
});

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
        slotMap.set(entry.portId, {
          side,
          order: index,
          total: entries.length
        });
      });
    });
  });

  return slotMap;
});

const renderedConnections = computed<VisualConnection[]>(() => {
  return topologyConnections.value
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
        isActive: connection.id === circuit.value?.connection_id,
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

const canvasBounds = computed(() => {
  if (!visualDevices.value.length) {
    return {
      minX: 0,
      minY: 0,
      width: BASE_VIEWBOX_WIDTH,
      height: BASE_VIEWBOX_HEIGHT,
      maxX: BASE_VIEWBOX_WIDTH,
      maxY: BASE_VIEWBOX_HEIGHT
    };
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

  return Array.from(groups.entries()).map(([key, devices], index) => {
    const current = palette[index % palette.length];
    const minX = Math.min(...devices.map((device) => device.x - 76));
    const maxX = Math.max(...devices.map((device) => device.x + 76));
    const minY = Math.min(...devices.map((device) => device.y - 48));
    const maxY = Math.max(...devices.map((device) => device.y + 70));

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

const activePathText = computed(() => {
  const sourcePort = circuit.value?.Connection?.SourcePort;
  const targetPort = circuit.value?.Connection?.TargetPort;
  if (!sourcePort || !targetPort) return '';

  const sourceDevice = findDeviceByPortId(sourcePort.id);
  const targetDevice = findDeviceByPortId(targetPort.id);

  return `${sourceDevice?.device_name || '源设备'}:${sourcePort.port_name} → ${targetDevice?.device_name || '目标设备'}:${targetPort.port_name}`;
});

function buildVisualDevice(device: TopologyDevice, point: Point): VisualDevice {
  const isEndpoint = endpointDeviceIds.value.includes(device.id);
  const style = getDeviceStyle(device.device_type);
  const shortLabel = shorten(device.device_name, 8);
  return {
    ...device,
    x: point.x,
    y: point.y,
    shortLabel,
    accent: style.accent,
    surface: style.surface,
    isEndpoint
  };
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

function getShortName(name: string) {
  return name.slice(0, 2);
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

function buildPortTag(
  portName: string | null | undefined,
  anchor: Point,
  device: VisualDevice,
  slot?: PortSlot
): PortTag {
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

  // Use slot info to spread labels along the device edge
  if (slot && slot.total > 1) {
    const spread = (slot.order - (slot.total - 1) / 2) * 18;
    if (side === 'left' || side === 'right') {
      y += spread;
    } else {
      x += spread;
    }
  }

  return { text, x, y, width };
}

function resolvePortLabelSide(anchor: Point, device: VisualDevice): PortSlot['side'] {
  const dx = anchor.x - device.x;
  const dy = anchor.y - device.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function formatPortLabel(
  portName: string | null | undefined,
  usage: { count: number; firstConnectionId: number } | undefined
) {
  const text = (portName || '').trim();
  if (!text) return '未命名';
  if (usage && usage.count > 1) {
    return `${text} 汇聚`;
  }
  return text;
}

function lineColor(connectionId: number, type: string | null | undefined) {
  return CONNECTION_LEGEND.find((item) => item.value === type)?.color || '#7a8496';
}

function findDeviceByPortId(portId: number | null | undefined) {
  if (!portId) return null;
  const deviceId = portToDeviceMap.value.get(portId);
  if (!deviceId) return null;
  return visualDeviceMap.value.get(deviceId) || null;
}

function resolvePortSide(vector: Point): PortSlot['side'] {
  if (Math.abs(vector.x) >= Math.abs(vector.y)) {
    return vector.x >= 0 ? 'right' : 'left';
  }
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
  const next = {
    x: toDevice.x - fromDevice.x,
    y: toDevice.y - fromDevice.y
  };

  if (!current) {
    map.set(fromPortId, next);
    return;
  }

  current.x += next.x;
  current.y += next.y;
}

function getConnectionAnchor(portId: number | null, fromDevice: VisualDevice, fallbackTarget: VisualDevice) {
  if (!portId) return getDeviceAnchor(fromDevice, fallbackTarget);

  const sharedDirection = portAnchorMap.value.get(portId);
  if (sharedDirection && (sharedDirection.x !== 0 || sharedDirection.y !== 0)) {
    const slot = devicePortSlotMap.value.get(portId);
    if (slot) {
      return getSlottedDeviceAnchor(fromDevice, slot);
    }
    return getDeviceAnchor(fromDevice, {
      x: fromDevice.x + sharedDirection.x,
      y: fromDevice.y + sharedDirection.y
    });
  }

  return getDeviceAnchor(fromDevice, fallbackTarget);
}

function getSlottedDeviceAnchor(device: VisualDevice, slot: PortSlot): Point {
  const halfWidth = 28;
  const halfHeight = 20;
  const position = ((slot.order + 1) / (slot.total + 1) - 0.5) * 2;

  switch (slot.side) {
    case 'left':
      return {
        x: device.x - halfWidth,
        y: device.y + position * (halfHeight * 0.9)
      };
    case 'right':
      return {
        x: device.x + halfWidth,
        y: device.y + position * (halfHeight * 0.9)
      };
    case 'top':
      return {
        x: device.x + position * (halfWidth * 0.9),
        y: device.y - halfHeight
      };
    case 'bottom':
      return {
        x: device.x + position * (halfWidth * 0.9),
        y: device.y + halfHeight
      };
  }
}

function getDeviceAnchor(from: VisualDevice, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const halfWidth = 28;
  const halfHeight = 20;

  if (dx === 0 && dy === 0) {
    return { x: from.x, y: from.y };
  }

  const scale = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
  return {
    x: from.x + dx * scale,
    y: from.y + dy * scale
  };
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length
  };
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
    background: lineColor(conn.id, conn.connection_type)
  };
}

function isEndpointDevice(deviceId: number) {
  return endpointDeviceIds.value.includes(deviceId);
}

async function loadCircuit(id: number) {
  loading.value = true;
  try {
    circuit.value = await fetchCircuitDetail(id);
    hasLoaded.value = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载失败';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function editCircuit() {
  if (!circuit.value) return;
  uni.navigateTo({
    url: `/pages/circuit/form/index?id=${circuit.value.id}&customer_id=${circuit.value.customer_id || 0}`
  });
}

function copyCircuitNumber() {
  const number = circuit.value?.circuit_number?.trim();
  if (!number) {
    uni.showToast({ title: '电路编号未填写', icon: 'none' });
    return;
  }

  uni.setClipboardData({
    data: number,
    success: () => {
      uni.showToast({ title: '编号已复制', icon: 'none' });
    }
  });
}

onLoad((query) => {
  const id = Number(query?.id);
  if (id) {
    circuitId.value = id;
    loadCircuit(id);
  }
});

onShow(() => {
  if (circuitId.value && hasLoaded.value) {
    loadCircuit(circuitId.value);
  }
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding: 30rpx;
  color: var(--cm-text);
}

.hero__body { flex: 1; }

.hero__title {
  color: var(--cm-text);
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.28;
}

.hero__meta {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--cm-muted);
  line-height: 1.35;
}

.hero__edit {
  flex-shrink: 0;
  min-width: 88rpx;
  height: 54rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.16);
  border-radius: 18rpx;
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 54rpx;
  text-align: center;
}

.block {
  margin-top: 24rpx;
  padding: 26rpx;
}

.block__title {
  margin-bottom: 18rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--cm-text);
  line-height: 1.25;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.info-item {
  padding: 20rpx;
  border: 1rpx solid #edf1f7;
  border-radius: 18rpx;
  background: #f8fbff;
  box-sizing: border-box;
}

.info-item--clickable {
  cursor: pointer;
}

.info-item--clickable:active {
  background: var(--cm-primary-soft);
}

.info-item__label {
  display: block;
  font-size: 21rpx;
  color: var(--cm-muted);
  line-height: 1.25;
}

.info-item__value {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--cm-text);
  font-weight: 600;
  word-break: break-all;
}

.ip-path {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 14rpx;
  padding: 20rpx;
  border: 1rpx solid #edf1f7;
  border-radius: 18rpx;
  background: #f8fbff;
}

.ip-path__side {
  min-width: 0;
}

.ip-path__label {
  display: block;
  color: var(--cm-muted);
  font-size: 21rpx;
  line-height: 1.25;
}

.ip-path__value {
  display: block;
  overflow: hidden;
  margin-top: 10rpx;
  color: var(--cm-text);
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 360px) {
  .ip-path {
    grid-template-columns: minmax(0, 1fr);
  }
}

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

.topology-line--active {
  height: 3px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.16);
}

.topology-line--active::after {
  content: '';
  position: absolute;
  left: -60px;
  top: 50%;
  width: 52px;
  height: 7px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent 0%, rgba(220, 38, 38, 0.15) 18%, rgba(220, 38, 38, 0.95) 50%, rgba(220, 38, 38, 0.15) 82%, transparent 100%);
  box-shadow: 0 0 8px rgba(220, 38, 38, 0.65);
  transform: translateY(-50%);
  animation: active-line-flow 1.7s linear infinite;
}

@keyframes active-line-flow {
  0% {
    left: -60px;
  }

  100% {
    left: 100%;
  }
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

.topology-line-label--active {
  color: var(--cm-primary);
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

.topology-node--endpoint .topology-node__icon {
  border-width: 3px;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.16);
}


.path-card {
  margin-top: 20rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 18rpx;
  background: var(--cm-surface);
}

.path-card__title {
  font-size: 22rpx;
  color: var(--cm-muted);
}

.path-card__value {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--cm-text);
  font-weight: 600;
}

.empty-card {
  padding: 80rpx 24rpx;
  border: 1rpx solid #edf1f7;
  border-radius: 20rpx;
  background: #f8fbff;
  text-align: center;
  font-size: 24rpx;
  color: var(--cm-muted);
}

.state {
  min-height: 100vh;
  padding: 120rpx 24rpx;
  background: var(--cm-bg);
  text-align: center;
  font-size: 26rpx;
  color: var(--cm-muted);
}
</style>
