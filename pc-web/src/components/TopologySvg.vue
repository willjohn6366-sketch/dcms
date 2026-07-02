<template>
  <div
    ref="wrapRef"
    class="topology-canvas-wrap"
    :class="{ 'is-panning': isPanning }"
    @mousedown="onCanvasMouseDown"
    @mousemove="onCanvasMouseMove"
    @mouseup="onCanvasMouseUp"
    @mouseleave="onCanvasMouseUp"
  >
    <div class="zoom-toolbar">
      <button type="button" class="zoom-btn" @click="zoomOut">-</button>
      <button type="button" class="zoom-readout" @click="resetZoom">{{ zoomPercent }}</button>
      <button type="button" class="zoom-btn" @click="zoomIn">+</button>
    </div>

    <div class="topology-legend">
      <span class="topology-legend__item">
        <i class="topology-legend__line topology-legend__line--fiber" />
        光纤
      </span>
      <span class="topology-legend__item">
        <i class="topology-legend__line topology-legend__line--cable" />
        网线
      </span>
      <span class="topology-legend__item">
        <i class="topology-legend__line topology-legend__line--other" />
        其他
      </span>
    </div>

    <svg
      ref="svgRef"
      :viewBox="`${canvasBounds.minX} ${canvasBounds.minY} ${canvasBounds.width} ${canvasBounds.height}`"
      class="topology-svg"
      :style="svgStyle"
      @mousemove="onMove"
      @mouseup="onUp"
      @mouseleave="onUp"
      @wheel.prevent="onWheel"
    >
      <defs>
        <filter id="device-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#93a8bf" flood-opacity="0.18" />
        </filter>
      </defs>

      <g :transform="zoomTransform">
        <g v-for="region in locationRegions" :key="region.key">
          <rect
            :x="region.x"
            :y="region.y"
            :width="region.width"
            :height="region.height"
            :fill="region.fill"
            :stroke="region.stroke"
            stroke-width="1.2"
            rx="22"
            stroke-dasharray="8 8"
          />
          <text
            :x="region.x + 16"
            :y="region.y + 24"
            font-size="13"
            font-weight="700"
            :fill="region.textColor"
          >
            {{ region.label }}
          </text>
        </g>

        <g v-for="conn in renderedConnections" :key="conn.id">
          <line
            :x1="conn.sourceAnchor.x"
            :y1="conn.sourceAnchor.y"
            :x2="conn.targetAnchor.x"
            :y2="conn.targetAnchor.y"
            :stroke="lineColor(conn.id, conn.connection_type)"
            stroke-width="3"
            :stroke-dasharray="conn.connection_type === 'fiber' ? '0' : conn.connection_type === 'cable' ? '10 7' : '4 8'"
            stroke-linecap="round"
          />
          <line
            v-if="highlightedConnection(conn.id)"
            class="active-connection-line"
            :x1="conn.sourceAnchor.x"
            :y1="conn.sourceAnchor.y"
            :x2="conn.targetAnchor.x"
            :y2="conn.targetAnchor.y"
            stroke="#dc2626"
            stroke-width="4"
            stroke-dasharray="18 90"
            stroke-linecap="round"
          />

          <circle
            :cx="conn.sourceAnchor.x"
            :cy="conn.sourceAnchor.y"
            r="4.5"
            :fill="lineColor(conn.id, conn.connection_type)"
            stroke="#ffffff"
            stroke-width="2"
          />
          <circle
            :cx="conn.targetAnchor.x"
            :cy="conn.targetAnchor.y"
            r="4.5"
            :fill="lineColor(conn.id, conn.connection_type)"
            stroke="#ffffff"
            stroke-width="2"
          />

        </g>

        <g
          v-for="dev in visualDevices"
          :key="dev.id"
          :transform="`translate(${dev.x}, ${dev.y}) scale(${dev.scale})`"
          :class="{ draggable: editable }"
          @mousedown="onDown($event, dev.id)"
        >
          <g v-if="dev.kind === 'router'" :stroke="dev.accent" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="0" cy="-5" r="18" :fill="dev.surface" />
            <path d="M -6 -5 H 6 M 0 -11 V 1" />
            <path d="M 0 -17 l-4 5 h8 z" fill="none" />
            <path d="M 17 -5 l-5 -4 v8 z" fill="none" />
            <path d="M 0 7 l-4 -5 h8 z" fill="none" />
            <path d="M -17 -5 l5 -4 v8 z" fill="none" />
          </g>

          <g v-else-if="dev.kind === 'switch'" :stroke="dev.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="-24" y="-18" width="48" height="28" rx="8" :fill="dev.surface" />
            <path d="M -10 -4 H 10 M -4 -10 l-6 6 6 6 M 4 2 l6 -6 -6 -6" />
            <rect x="-16" y="-14" width="5" height="3" rx="1.5" :fill="dev.surface" />
            <rect x="-8" y="-14" width="5" height="3" rx="1.5" :fill="dev.surface" />
            <rect x="0" y="-14" width="5" height="3" rx="1.5" :fill="dev.surface" />
            <rect x="8" y="-14" width="5" height="3" rx="1.5" :fill="dev.surface" />
          </g>

          <g v-else-if="dev.kind === 'firewall'" :stroke="dev.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M -22 7 V -16 H 22 V 7" :fill="dev.surface" />
            <path d="M -20 -7 H 20 M -20 0 H 20" />
            <path d="M -10 -15 V -7 M 0 -15 V -7 M 10 -15 V -7 M -15 0 V 7 M -5 0 V 7 M 5 0 V 7 M 15 0 V 7" />
          </g>

          <g v-else-if="dev.kind === 'transceiver'" :stroke="dev.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="-24" y="-16" width="48" height="26" rx="7" :fill="dev.surface" />
            <circle cx="-9" cy="-3" r="3.5" :fill="dev.surface" />
            <circle cx="9" cy="-3" r="3.5" :fill="dev.surface" />
            <path d="M -18 12 H 18 M 0 12 V 4 M -4 8 l4 -4 4 4" />
          </g>

          <g v-else-if="dev.kind === 'odf'" :stroke="dev.accent" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="-24" y="-17" width="48" height="28" rx="6" :fill="dev.surface" />
            <circle v-for="point in odfDots" :key="point.key" :cx="point.x" :cy="point.y" r="2.1" :fill="dev.accent" />
            <path d="M -18 14 H 18" />
          </g>

          <g v-else-if="dev.kind === 'optical'" :stroke="dev.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="0" cy="-4" rx="18" ry="12" :fill="dev.surface" />
            <path d="M -23 -4 H -10 M 10 -4 H 23" />
            <path d="M -7 -11 C -2 -1 2 -1 7 -11 M -7 3 C -2 -7 2 -7 7 3" />
          </g>

          <g v-else :stroke="dev.accent" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="-20" y="-18" width="40" height="30" rx="6" :fill="dev.surface" />
            <path d="M -12 -9 H 12 M -12 -1 H 12 M -12 7 H 12" />
            <circle cx="-8" cy="-13" r="1.5" :fill="dev.accent" stroke="none" />
            <circle cx="-3" cy="-13" r="1.5" :fill="dev.accent" stroke="none" />
          </g>
        </g>

        <g v-for="label in deviceNameLayouts" :key="label.key">
          <rect
            :x="label.x"
            :y="label.y"
            :width="label.width"
            :height="label.height"
            rx="9"
            fill="#ffffff"
            fill-opacity="0.82"
          />
          <text
            :x="label.x + label.width / 2"
            :y="label.y + 15"
            text-anchor="middle"
            font-size="12.5"
            font-weight="700"
            fill="#203247"
          >
            <tspan
              v-for="(line, index) in label.lines"
              :key="`${label.key}-${index}`"
              :x="label.x + label.width / 2"
              :dy="index === 0 ? 0 : 15"
            >
              {{ line }}
            </tspan>
          </text>
        </g>

        <g class="top-label-layer">
          <g v-for="conn in renderedConnections" :key="`top-labels-${conn.id}`">
            <g v-for="label in conn.labels" :key="`${conn.id}-${label.key}`">
              <rect
                :x="portLabelLayoutMap.get(label.layoutKey)?.x ?? label.x - label.width / 2"
                :y="portLabelLayoutMap.get(label.layoutKey)?.y ?? label.y - 11"
                :width="portLabelLayoutMap.get(label.layoutKey)?.width ?? label.width"
                :height="portLabelLayoutMap.get(label.layoutKey)?.height ?? 22"
                rx="11"
                fill="#ffffff"
                fill-opacity="0.96"
                stroke="#d7e3f2"
              />
              <text
                :x="(portLabelLayoutMap.get(label.layoutKey)?.x ?? label.x - label.width / 2) + (portLabelLayoutMap.get(label.layoutKey)?.width ?? label.width) / 2"
                :y="(portLabelLayoutMap.get(label.layoutKey)?.y ?? label.y - 11) + 15"
                text-anchor="middle"
                font-size="11"
                font-weight="600"
                fill="#35506e"
              >
                {{ label.text }}
              </text>
            </g>

            <g v-if="conn.circuitLabel">
              <text
                :x="(portLabelLayoutMap.get(conn.circuitLabel.layoutKey)?.x ?? conn.circuitLabel.x - conn.circuitLabel.width / 2) + (portLabelLayoutMap.get(conn.circuitLabel.layoutKey)?.width ?? conn.circuitLabel.width) / 2"
                :y="(portLabelLayoutMap.get(conn.circuitLabel.layoutKey)?.y ?? conn.circuitLabel.y - 12) + 16"
                text-anchor="middle"
                font-size="11.5"
                font-weight="700"
                fill="#9a4c08"
              >
                {{ conn.circuitLabel.text }}
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Connection, Device, Port } from '@/types/topology';

interface DeviceRender {
  id: number;
  x: number;
  y: number;
  scale: number;
  iconWidth: number;
  iconHeight: number;
  shortName: string;
  location: string;
  kind: DeviceKind;
  accent: string;
  surface: string;
}

interface Point {
  x: number;
  y: number;
}

interface PortSlot {
  side: 'left' | 'right' | 'top' | 'bottom';
  order: number;
  total: number;
}

interface PortLabelRender {
  key: string;
  layoutKey: string;
  text: string;
  x: number;
  y: number;
  width: number;
}

interface LayoutBox {
  key: string;
  text: string;
  lines?: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  baseX: number;
  baseY: number;
  weightX: number;
  weightY: number;
}

interface LocationRegion {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  textColor: string;
}

interface CanvasBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
  maxX: number;
  maxY: number;
}

interface LocationCollisionBox {
  location: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type DeviceKind = 'router' | 'switch' | 'firewall' | 'transceiver' | 'odf' | 'optical' | 'other';

const VIEWBOX_WIDTH = 900;
const BASE_VIEWBOX_WIDTH = 1120;
const BASE_VIEWBOX_HEIGHT = 560;
const DEVICE_WIDTH = 126;
const DEVICE_HEIGHT = 72;
const CANVAS_PADDING = 72;
const CANVAS_EXPAND_BUFFER = 28;
const DEVICE_COLLISION_GAP_X = 132;
const DEVICE_COLLISION_GAP_Y = 92;
const LOCATION_REGION_GAP = 36;

const odfDots = [
  { key: '1', x: -12, y: -8 },
  { key: '2', x: -4, y: -8 },
  { key: '3', x: 4, y: -8 },
  { key: '4', x: 12, y: -8 },
  { key: '5', x: -12, y: 0 },
  { key: '6', x: -4, y: 0 },
  { key: '7', x: 4, y: 0 },
  { key: '8', x: 12, y: 0 }
] as const;

const regionPalette = [
  { fill: 'rgba(37, 99, 235, 0.06)', stroke: '#bfdbfe', textColor: '#1e3a8a' },
  { fill: 'rgba(15, 118, 110, 0.05)', stroke: '#b7ded7', textColor: '#0f766e' },
  { fill: 'rgba(245, 158, 11, 0.06)', stroke: '#f3d69a', textColor: '#92400e' },
  { fill: 'rgba(122, 132, 150, 0.06)', stroke: '#d6dce6', textColor: '#5f6b7a' }
] as const;

const kindStyleMap: Record<DeviceKind, { accent: string; surface: string; label: string }> = {
  router: { accent: '#2563eb', surface: '#eff6ff', label: '路由器' },
  switch: { accent: '#0f766e', surface: '#ecfdf5', label: '交换机' },
  firewall: { accent: '#dc2626', surface: '#fff1f2', label: '防火墙' },
  transceiver: { accent: '#64748b', surface: '#f8fafc', label: '收发器' },
  odf: { accent: '#f59e0b', surface: '#fffbeb', label: 'ODF' },
  optical: { accent: '#0891b2', surface: '#ecfeff', label: '光设备' },
  other: { accent: '#7a8496', surface: '#f8fafc', label: '网络设备' }
};

const props = withDefaults(
  defineProps<{
    devices: Device[];
    connections: Connection[];
    highlightConnectionId?: number | null;
    highlightConnectionIds?: number[];
    editable?: boolean;
  }>(),
  {
    highlightConnectionId: null,
    highlightConnectionIds: () => [],
    editable: false
  }
);

const emit = defineEmits<{
  (e: 'position-change', payload: { id: number; x: number; y: number }): void;
}>();

const wrapRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const positionMap = ref<Map<number, Point>>(new Map());
const draggingId = ref<number | null>(null);
const dragBoundsSnapshot = ref<CanvasBounds | null>(null);
const zoom = ref(1);
const isPanning = ref(false);
const panStart = ref<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

const deviceConnectionStats = computed(() => {
  const stats = new Map<number, { connectionCount: number; portCount: number }>();

  props.devices.forEach((dev) => {
    const devicePortIds = new Set((dev.Ports || []).map((port) => port.id));
    let connectionCount = 0;
    const usedPorts = new Set<number>();

    props.connections.forEach((conn) => {
      if (devicePortIds.has(conn.source_port_id)) {
        connectionCount += 1;
        usedPorts.add(conn.source_port_id);
      }
      if (devicePortIds.has(conn.target_port_id)) {
        connectionCount += 1;
        usedPorts.add(conn.target_port_id);
      }
    });

    stats.set(dev.id, {
      connectionCount,
      portCount: usedPorts.size
    });
  });

  return stats;
});

watch(
  () => props.devices,
  () => {
    const next = new Map<number, Point>();
    const grouped = new Map<string, Device[]>();
    const groupOrder: string[] = [];

    props.devices.forEach((dev) => {
      const key = normalizeLocation(dev.location);
      if (!grouped.has(key)) {
        grouped.set(key, []);
        groupOrder.push(key);
      }
      grouped.get(key)?.push(dev);
    });

    groupOrder.forEach((key, groupIndex) => {
      const devices = grouped.get(key) || [];
      const baseX = 140 + (groupIndex % 3) * 260;
      const baseY = 110 + Math.floor(groupIndex / 3) * 170;

      devices.forEach((dev, index) => {
        const fallbackX = baseX + (index % 2) * 110;
        const fallbackY = baseY + Math.floor(index / 2) * 90;
        const hasSavedX = Number.isFinite(dev.position_x);
        const hasSavedY = Number.isFinite(dev.position_y);
        next.set(dev.id, {
          x: hasSavedX ? dev.position_x : fallbackX,
          y: hasSavedY ? dev.position_y : fallbackY
        });
      });
    });
    positionMap.value = next;
  },
  { immediate: true, deep: true }
);

const visualDevices = computed<DeviceRender[]>(() => {
  const devices = props.devices.map((dev) => {
    const pos = positionMap.value.get(dev.id) || { x: 90, y: 90 };
    const kind = resolveDeviceKind(dev);
    const style = kindStyleMap[kind];
    const stats = deviceConnectionStats.value.get(dev.id);
    const scale = resolveDeviceScale(stats?.connectionCount || 0, stats?.portCount || 0);
    return {
      id: dev.id,
      x: pos.x,
      y: pos.y,
      scale,
      iconWidth: 50 * scale,
      iconHeight: 34 * scale,
      shortName: dev.device_name,
      location: normalizeLocation(dev.location),
      kind,
      accent: style.accent,
      surface: style.surface
    };
  });

  return resolveLocationCollisions(resolveDeviceCollisions(devices));
});

const canvasBounds = computed<CanvasBounds>(() => {
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

  const minDeviceX = Math.min(...visualDevices.value.map((dev) => dev.x - Math.max(78, dev.iconWidth / 2 + 36)));
  const maxDeviceX = Math.max(...visualDevices.value.map((dev) => dev.x + Math.max(78, dev.iconWidth / 2 + 36)));
  const minDeviceY = Math.min(...visualDevices.value.map((dev) => dev.y - Math.max(56, dev.iconHeight / 2 + 34)));
  const maxDeviceY = Math.max(...visualDevices.value.map((dev) => dev.y + Math.max(68, dev.iconHeight / 2 + 56)));

  const minX = Math.min(0, Math.floor(minDeviceX - CANVAS_PADDING));
  const minY = Math.min(0, Math.floor(minDeviceY - CANVAS_PADDING));
  const maxX = Math.max(BASE_VIEWBOX_WIDTH, Math.ceil(maxDeviceX + CANVAS_PADDING));
  const maxY = Math.max(BASE_VIEWBOX_HEIGHT, Math.ceil(maxDeviceY + CANVAS_PADDING));
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    minX,
    minY,
    width,
    height,
    maxX,
    maxY
  };
});

const VIEWBOX_HEIGHT = computed(() => canvasBounds.value.height);

const svgStyle = computed(() => ({
  width: `${canvasBounds.value.width}px`,
  height: `${canvasBounds.value.height}px`
}));

const locationRegions = computed<LocationRegion[]>(() => {
  const grouped = new Map<string, DeviceRender[]>();

  visualDevices.value.forEach((dev) => {
    if (!dev.location) return;
    if (!grouped.has(dev.location)) grouped.set(dev.location, []);
    grouped.get(dev.location)?.push(dev);
  });

  return Array.from(grouped.entries())
    .filter(([, devices]) => devices.length > 0)
    .map(([location, devices], index) => {
      const palette = regionPalette[index % regionPalette.length];
      const minX = Math.min(...devices.map((dev) => dev.x - Math.max(78, dev.iconWidth / 2 + 28)));
      const maxX = Math.max(...devices.map((dev) => dev.x + Math.max(78, dev.iconWidth / 2 + 28)));
      const minY = Math.min(...devices.map((dev) => dev.y - Math.max(52, dev.iconHeight / 2 + 24)));
      const maxY = Math.max(...devices.map((dev) => dev.y + Math.max(58, dev.iconHeight / 2 + 44)));

      return {
        key: location,
        label: location,
        x: Math.max(canvasBounds.value.minX + 8, minX - 18),
        y: Math.max(canvasBounds.value.minY + 8, minY - 26),
        width: Math.min(
          Math.max(120, maxX - minX + 36),
          canvasBounds.value.maxX - Math.max(canvasBounds.value.minX + 8, minX - 18) - 8
        ),
        height: Math.min(
          Math.max(96, maxY - minY + 44),
          canvasBounds.value.maxY - Math.max(canvasBounds.value.minY + 8, minY - 26) - 8
        ),
        fill: palette.fill,
        stroke: palette.stroke,
        textColor: palette.textColor
      };
    });
});

const visualDeviceMap = computed(() => {
  const map = new Map<number, DeviceRender>();
  visualDevices.value.forEach((dev) => map.set(dev.id, dev));
  return map;
});

const portToDeviceMap = computed(() => {
  const map = new Map<number, number>();
  props.devices.forEach((dev) => {
    (dev.Ports || []).forEach((port) => map.set(port.id, dev.id));
  });
  return map;
});

const portMap = computed(() => {
  const map = new Map<number, Port>();
  props.devices.forEach((dev) => {
    (dev.Ports || []).forEach((port) => map.set(port.id, port));
  });
  return map;
});

const portUsageStats = computed(() => {
  const stats = new Map<number, { count: number; firstConnectionId: number }>();

  props.connections.forEach((conn) => {
    [conn.source_port_id, conn.target_port_id].forEach((portId) => {
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

  props.connections.forEach((conn) => {
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

const renderedConnections = computed(() => {
  return props.connections
    .map((conn) => {
      const sourceDeviceId = portToDeviceMap.value.get(conn.source_port_id);
      const targetDeviceId = portToDeviceMap.value.get(conn.target_port_id);
      if (!sourceDeviceId || !targetDeviceId) return null;

      const sourceDevice = visualDeviceMap.value.get(sourceDeviceId);
      const targetDevice = visualDeviceMap.value.get(targetDeviceId);
      if (!sourceDevice || !targetDevice) return null;

      const sourceAnchor = getConnectionAnchor(conn.source_port_id, sourceDevice, targetDevice);
      const targetAnchor = getConnectionAnchor(conn.target_port_id, targetDevice, sourceDevice);
      const dir = normalize({
        x: targetAnchor.x - sourceAnchor.x,
        y: targetAnchor.y - sourceAnchor.y
      });
      const perp = { x: -dir.y, y: dir.x };
      const offsetSign = conn.id % 2 === 0 ? 1 : -1;

      const labels: PortLabelRender[] = [];
      const sourcePort = portMap.value.get(conn.source_port_id);
      const targetPort = portMap.value.get(conn.target_port_id);
      const sourcePortUsage = portUsageStats.value.get(conn.source_port_id);
      const targetPortUsage = portUsageStats.value.get(conn.target_port_id);
      const midPoint = {
        x: (sourceAnchor.x + targetAnchor.x) / 2,
        y: (sourceAnchor.y + targetAnchor.y) / 2
      };

      if (shouldRenderPortLabel(sourcePort?.port_name, sourcePortUsage, conn.id)) {
        labels.push(
          createPortLabel(
            'source',
            formatPortLabel(sourcePort?.port_name || '', sourcePortUsage),
            sourceAnchor,
            {
              x: dir.x * 25 + perp.x * 12 * offsetSign,
              y: dir.y * 25 + perp.y * 12 * offsetSign
            },
            conn.source_port_id
          )
        );
      }

      if (shouldRenderPortLabel(targetPort?.port_name, targetPortUsage, conn.id)) {
        labels.push(
          createPortLabel(
            'target',
            formatPortLabel(targetPort?.port_name || '', targetPortUsage),
            targetAnchor,
            {
              x: -dir.x * 25 + perp.x * 12 * offsetSign,
              y: -dir.y * 25 + perp.y * 12 * offsetSign
            },
            conn.target_port_id
          )
        );
      }

      const circuitLabel = createCircuitLabel(conn, midPoint, perp, offsetSign);

      return {
        ...conn,
        sourceAnchor,
        targetAnchor,
        labels,
        circuitLabel
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
});

const zoomTransform = computed(() => {
  const centerX = canvasBounds.value.minX + canvasBounds.value.width / 2;
  const centerY = canvasBounds.value.minY + canvasBounds.value.height / 2;
  return `translate(${centerX} ${centerY}) scale(${zoom.value}) translate(${-centerX} ${-centerY})`;
});

const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`);

const deviceNameLayouts = computed(() => {
  const boxes = buildResolvedLabelBoxes();
  return boxes.filter((box) => box.key.startsWith('device:'));
});

const portLabelLayoutMap = computed(() => {
  const boxes = buildResolvedLabelBoxes();
  const map = new Map<string, LayoutBox>();
  boxes
    .filter((box) => box.key.startsWith('port:'))
    .forEach((box) => map.set(box.key, box));
  return map;
});

function highlightedConnection(connectionId: number) {
  return props.highlightConnectionId === connectionId || props.highlightConnectionIds.includes(connectionId);
}

function lineColor(connectionId: number, type: Connection['connection_type']) {
  if (type === 'fiber') return '#f59e0b';
  if (type === 'cable') return '#7a8496';
  return '#2563eb';
}

function resolveDeviceKind(device: Device): DeviceKind {
  const deviceType = device.device_type;
  const text = `${device.device_name} ${device.device_model || ''}`.toLowerCase();

  if (text.includes('firewall') || text.includes('fw') || text.includes('防火墙')) return 'firewall';
  if (text.includes('transceiver') || text.includes('media converter') || text.includes('收发器') || text.includes('光猫')) {
    return 'transceiver';
  }
  if (text.includes('otn') || text.includes('wdm') || text.includes('olt') || text.includes('onu') || text.includes('光设备')) {
    return 'optical';
  }
  if (deviceType === 'router') return 'router';
  if (deviceType === 'switch') return 'switch';
  if (deviceType === 'odf') return 'odf';
  if (deviceType === 'optical_device') return 'optical';
  return 'other';
}

function normalizeLocation(value: string | null | undefined) {
  return (value || '').trim();
}

function resolveDeviceScale(connectionCount: number, portCount: number) {
  const density = Math.max(connectionCount, portCount * 1.4);
  if (density >= 10) return 1.7;
  if (density >= 8) return 1.5;
  if (density >= 6) return 1.35;
  if (density >= 4) return 1.2;
  return 1;
}

function resolveDeviceCollisions(sourceDevices: DeviceRender[]) {
  const devices = sourceDevices.map((dev) => ({ ...dev }));

  for (let round = 0; round < 20; round += 1) {
    let moved = false;

    for (let i = 0; i < devices.length; i += 1) {
      for (let j = i + 1; j < devices.length; j += 1) {
        const a = devices[i];
        const b = devices[j];
        const minGapX = Math.max(DEVICE_COLLISION_GAP_X, (a.iconWidth + b.iconWidth) / 2 + 76);
        const minGapY = Math.max(DEVICE_COLLISION_GAP_Y, (a.iconHeight + b.iconHeight) / 2 + 62);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = minGapX - Math.abs(dx);
        const overlapY = minGapY - Math.abs(dy);

        if (overlapX <= 0 || overlapY <= 0) continue;

        const pushXSign = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
        const pushYSign = dy === 0 ? (j % 2 === 0 ? 1 : -1) : Math.sign(dy);

        if (overlapX < overlapY) {
          const pushX = (overlapX / 2 + 8) * pushXSign;
          a.x -= pushX;
          b.x += pushX;
        } else {
          const pushY = (overlapY / 2 + 8) * pushYSign;
          a.y -= pushY;
          b.y += pushY;
        }

        moved = true;
      }
    }

    if (!moved) break;
  }

  return devices;
}

function resolveLocationCollisions(sourceDevices: DeviceRender[]) {
  const devices = sourceDevices.map((dev) => ({ ...dev }));

  for (let round = 0; round < 18; round += 1) {
    const boxes = buildLocationCollisionBoxes(devices);
    let moved = false;

    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX =
          Math.min(a.x + a.width + LOCATION_REGION_GAP, b.x + b.width + LOCATION_REGION_GAP) -
          Math.max(a.x - LOCATION_REGION_GAP, b.x - LOCATION_REGION_GAP);
        const overlapY =
          Math.min(a.y + a.height + LOCATION_REGION_GAP, b.y + b.height + LOCATION_REGION_GAP) -
          Math.max(a.y - LOCATION_REGION_GAP, b.y - LOCATION_REGION_GAP);

        if (overlapX <= 0 || overlapY <= 0) continue;

        const centerAX = a.x + a.width / 2;
        const centerAY = a.y + a.height / 2;
        const centerBX = b.x + b.width / 2;
        const centerBY = b.y + b.height / 2;
        const signX = centerBX >= centerAX ? 1 : -1;
        const signY = centerBY >= centerAY ? 1 : -1;

        if (overlapX <= overlapY) {
          const pushX = overlapX / 2 + 12;
          shiftLocationDevices(devices, a.location, -pushX * signX, 0);
          shiftLocationDevices(devices, b.location, pushX * signX, 0);
        } else {
          const pushY = overlapY / 2 + 12;
          shiftLocationDevices(devices, a.location, 0, -pushY * signY);
          shiftLocationDevices(devices, b.location, 0, pushY * signY);
        }

        moved = true;
      }
    }

    if (!moved) break;
  }

  return devices;
}

function buildLocationCollisionBoxes(devices: DeviceRender[]): LocationCollisionBox[] {
  const grouped = new Map<string, DeviceRender[]>();

  devices.forEach((dev) => {
    if (!dev.location) return;
    if (!grouped.has(dev.location)) grouped.set(dev.location, []);
    grouped.get(dev.location)?.push(dev);
  });

  return Array.from(grouped.entries()).map(([location, locationDevices]) => {
    const minX = Math.min(...locationDevices.map((dev) => dev.x - Math.max(78, dev.iconWidth / 2 + 28)));
    const maxX = Math.max(...locationDevices.map((dev) => dev.x + Math.max(78, dev.iconWidth / 2 + 28)));
    const minY = Math.min(...locationDevices.map((dev) => dev.y - Math.max(52, dev.iconHeight / 2 + 24)));
    const maxY = Math.max(...locationDevices.map((dev) => dev.y + Math.max(58, dev.iconHeight / 2 + 44)));

    return {
      location,
      x: minX - 18,
      y: minY - 26,
      width: Math.max(120, maxX - minX + 36),
      height: Math.max(96, maxY - minY + 44)
    };
  });
}

function shiftLocationDevices(devices: DeviceRender[], location: string, deltaX: number, deltaY: number) {
  devices.forEach((dev) => {
    if (dev.location !== location) return;
    dev.x += deltaX;
    dev.y += deltaY;
  });
}

function shouldRenderPortLabel(
  portName: string | undefined,
  usage: { count: number; firstConnectionId: number } | undefined,
  connectionId: number
) {
  if (!portName) return false;
  if (!usage || usage.count <= 1) return true;
  return usage.firstConnectionId === connectionId;
}

function formatPortLabel(portName: string, usage: { count: number; firstConnectionId: number } | undefined) {
  if (usage && usage.count > 1) {
    return `${portName} 汇聚`;
  }
  return portName;
}

function createPortLabel(key: string, text: string, anchor: Point, offset: Point, portId: number): PortLabelRender {
  return {
    key,
    layoutKey: `port:${portId}:${key}:${text}:${Math.round(anchor.x)}:${Math.round(anchor.y)}`,
    text,
    x: anchor.x + offset.x,
    y: anchor.y + offset.y,
    width: estimateTextWidth(text)
  };
}

function createCircuitLabel(connection: Connection, midPoint: Point, perp: Point, offsetSign: number): PortLabelRender | null {
  const circuit = connection.Circuits?.[0];
  if (!circuit) return null;

  const text = circuit.circuit_name || circuit.circuit_number || `电路#${circuit.id}`;
  return {
    key: `circuit-${connection.id}`,
    layoutKey: `port:circuit:${connection.id}`,
    text,
    x: midPoint.x + perp.x * 18 * offsetSign,
    y: midPoint.y + perp.y * 18 * offsetSign,
    width: Math.max(72, Math.min(180, estimateTextWidth(text) + 16))
  };
}

function estimateTextWidth(text: string) {
  return Math.max(44, Math.min(132, text.length * 7 + 18));
}

function buildResolvedLabelBoxes() {
  const boxes: LayoutBox[] = [];

  visualDevices.value.forEach((dev) => {
    const lines = splitDeviceName(dev.shortName);
    const width = Math.max(...lines.map((line) => estimateTextWidth(line)));
    const height = lines.length * 15 + 8;
    boxes.push({
      key: `device:${dev.id}`,
      text: dev.shortName,
      lines,
      x: dev.x - width / 2,
      y: dev.y + dev.iconHeight / 2 + 10,
      width,
      height,
      baseX: dev.x - width / 2,
      baseY: dev.y + dev.iconHeight / 2 + 10,
      weightX: 0.25,
      weightY: 0.9
    });
  });

  renderedConnections.value.forEach((conn) => {
    conn.labels.forEach((label) => {
      boxes.push({
        key: label.layoutKey,
        text: label.text,
        x: label.x - label.width / 2,
        y: label.y - 11,
        width: label.width,
        height: 22,
        baseX: label.x - label.width / 2,
        baseY: label.y - 11,
        weightX: 0.75,
        weightY: 0.75
      });
    });

    if (conn.circuitLabel) {
      boxes.push({
        key: conn.circuitLabel.layoutKey,
        text: conn.circuitLabel.text,
        x: conn.circuitLabel.x - conn.circuitLabel.width / 2,
        y: conn.circuitLabel.y - 12,
        width: conn.circuitLabel.width,
        height: 24,
        baseX: conn.circuitLabel.x - conn.circuitLabel.width / 2,
        baseY: conn.circuitLabel.y - 12,
        weightX: 0.55,
        weightY: 0.55
      });
    }
  });

  return resolveLabelCollisions(boxes);
}

function splitDeviceName(value: string) {
  const text = String(value || '').trim() || '未命名设备';
  const maxChars = 12;
  const lines: string[] = [];
  let current = '';

  Array.from(text).forEach((char) => {
    current += char;
    if (current.length >= maxChars || /[\s/\\_-]/.test(char)) {
      lines.push(current.trim());
      current = '';
    }
  });

  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 4);
}

function resolveLabelCollisions(sourceBoxes: LayoutBox[]) {
  const boxes = sourceBoxes.map((box) => ({ ...box }));

  for (let round = 0; round < 18; round += 1) {
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

        if (overlapX <= 0 || overlapY <= 0) continue;

        const centerAX = a.x + a.width / 2;
        const centerAY = a.y + a.height / 2;
        const centerBX = b.x + b.width / 2;
        const centerBY = b.y + b.height / 2;
        const diffX = centerBX - centerAX || (i % 2 === 0 ? 1 : -1);
        const diffY = centerBY - centerAY || (j % 2 === 0 ? 1 : -1);

        if (overlapY >= overlapX) {
          const pushX = (overlapX / 2 + 4) * Math.sign(diffX);
          a.x -= pushX * a.weightX;
          b.x += pushX * b.weightX;
        } else {
          const pushY = (overlapY / 2 + 4) * Math.sign(diffY);
          a.y -= pushY * a.weightY;
          b.y += pushY * b.weightY;
        }
      }
    }

    boxes.forEach((box) => {
      box.x += (box.baseX - box.x) * 0.08 * (1 - box.weightX);
      box.y += (box.baseY - box.y) * 0.06 * (1 - box.weightY);
      box.x = clamp(box.x, canvasBounds.value.minX + 6, canvasBounds.value.maxX - box.width - 6);
      box.y = clamp(box.y, canvasBounds.value.minY + 6, canvasBounds.value.maxY - box.height - 6);
    });
  }

  return boxes;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function addPortAnchorDirection(map: Map<number, Point>, fromPortId: number, toPortId: number) {
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

function getConnectionAnchor(portId: number, fromDevice: DeviceRender, fallbackTarget: DeviceRender) {
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

function getSlottedDeviceAnchor(device: DeviceRender, slot: PortSlot): Point {
  const halfWidth = device.iconWidth / 2;
  const halfHeight = device.iconHeight / 2;
  const centerY = device.y - 5;
  const position = ((slot.order + 1) / (slot.total + 1) - 0.5) * 2;

  switch (slot.side) {
    case 'left':
      return {
        x: device.x - halfWidth,
        y: centerY + position * (halfHeight * 0.9)
      };
    case 'right':
      return {
        x: device.x + halfWidth,
        y: centerY + position * (halfHeight * 0.9)
      };
    case 'top':
      return {
        x: device.x + position * (halfWidth * 0.9),
        y: centerY - halfHeight
      };
    case 'bottom':
      return {
        x: device.x + position * (halfWidth * 0.9),
        y: centerY + halfHeight
      };
  }
}

function getDeviceAnchor(from: DeviceRender, to: { x: number; y: number }): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (dx === 0 && dy === 0) {
    return { x: from.x, y: from.y };
  }

  const iconCenterY = from.y - 5;
  const adjustedDy = to.y - iconCenterY;
  const scale = 1 / Math.max(Math.abs(dx) / (from.iconWidth / 2), Math.abs(adjustedDy) / (from.iconHeight / 2));
  return {
    x: from.x + dx * scale,
    y: iconCenterY + adjustedDy * scale
  };
}

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

function onDown(event: MouseEvent, id: number) {
  if (!props.editable) return;
  event.preventDefault();
  event.stopPropagation();
  draggingId.value = id;
  dragBoundsSnapshot.value = { ...canvasBounds.value };
}

function onCanvasMouseDown(event: MouseEvent) {
  if (event.button !== 0 || draggingId.value !== null) return;

  const target = event.target as HTMLElement | null;
  if (!target || target.closest('.draggable')) return;

  const wrap = wrapRef.value;
  if (!wrap) return;

  isPanning.value = true;
  panStart.value = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: wrap.scrollLeft,
    scrollTop: wrap.scrollTop
  };
  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);
  event.preventDefault();
}

function onCanvasMouseMove(event: MouseEvent) {
  if (!isPanning.value || !panStart.value) return;
  updateCanvasPan(event);
}

function onWindowMouseMove(event: MouseEvent) {
  if (!isPanning.value || !panStart.value) return;
  updateCanvasPan(event);
}

function updateCanvasPan(event: MouseEvent) {
  if (!isPanning.value || !panStart.value) return;

  const wrap = wrapRef.value;
  if (!wrap) return;

  const deltaX = event.clientX - panStart.value.x;
  const deltaY = event.clientY - panStart.value.y;
  wrap.scrollLeft = panStart.value.scrollLeft - deltaX;
  wrap.scrollTop = panStart.value.scrollTop - deltaY;
}

function onCanvasMouseUp() {
  stopCanvasPan();
}

function onWindowMouseUp() {
  stopCanvasPan();
}

function stopCanvasPan() {
  isPanning.value = false;
  panStart.value = null;
  window.removeEventListener('mousemove', onWindowMouseMove);
  window.removeEventListener('mouseup', onWindowMouseUp);
}

function toSvgPoint(event: MouseEvent) {
  const svg = svgRef.value;
  if (!svg) return { x: 0, y: 0 };

  const rect = svg.getBoundingClientRect();
  const x = canvasBounds.value.minX + ((event.clientX - rect.left) / rect.width) * canvasBounds.value.width;
  const y = canvasBounds.value.minY + ((event.clientY - rect.top) / rect.height) * canvasBounds.value.height;
  const draggingDevice = draggingId.value ? visualDeviceMap.value.get(draggingId.value) : null;
  const activeBounds = dragBoundsSnapshot.value || canvasBounds.value;
  const edgeInsetX = Math.max(10, (draggingDevice?.iconWidth || 44) / 2 - 10);
  const edgeInsetTop = Math.max(10, (draggingDevice?.iconHeight || 34) / 2 - 8);
  const edgeInsetBottom = Math.max(18, (draggingDevice?.iconHeight || 34) / 2 + 18);

  const unscaled = fromZoomedPoint({ x, y });

  return {
    x: clamp(
      unscaled.x,
      activeBounds.minX - CANVAS_EXPAND_BUFFER + edgeInsetX,
      activeBounds.maxX + CANVAS_EXPAND_BUFFER - edgeInsetX
    ),
    y: clamp(
      unscaled.y,
      activeBounds.minY - CANVAS_EXPAND_BUFFER + edgeInsetTop,
      activeBounds.maxY + CANVAS_EXPAND_BUFFER - edgeInsetBottom
    )
  };
}

function onMove(event: MouseEvent) {
  if (!props.editable || draggingId.value === null) return;
  const pt = toSvgPoint(event);
  positionMap.value.set(draggingId.value, pt);
}

function onUp() {
  if (!props.editable || draggingId.value === null) return;
  const id = draggingId.value;
  const pt = positionMap.value.get(id);
  draggingId.value = null;
  dragBoundsSnapshot.value = null;

  if (pt) {
    emit('position-change', {
      id,
      x: Math.round(pt.x),
      y: Math.round(pt.y)
    });
  }
}

function fromZoomedPoint(point: Point) {
  const centerX = canvasBounds.value.minX + canvasBounds.value.width / 2;
  const centerY = canvasBounds.value.minY + canvasBounds.value.height / 2;
  return {
    x: centerX + (point.x - centerX) / zoom.value,
    y: centerY + (point.y - centerY) / zoom.value
  };
}

function setZoom(next: number) {
  zoom.value = Math.max(0.6, Math.min(2.2, Number(next.toFixed(2))));
}

function zoomIn() {
  setZoom(zoom.value + 0.1);
}

function zoomOut() {
  setZoom(zoom.value - 0.1);
}

function resetZoom() {
  setZoom(1);
}

function onWheel(event: WheelEvent) {
  const step = event.deltaY < 0 ? 0.1 : -0.1;
  setZoom(zoom.value + step);
}

onBeforeUnmount(() => {
  stopCanvasPan();
});
</script>

<style scoped>
.topology-canvas-wrap {
  position: relative;
  width: 100%;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: #f8fbff;
  overflow: auto;
  cursor: grab;
  user-select: none;
}

.topology-svg {
  min-height: 560px;
  min-width: 1120px;
  display: block;
}

.topology-canvas-wrap.is-panning {
  cursor: grabbing;
}

.active-connection-line {
  pointer-events: none;
  opacity: 0.92;
  filter: drop-shadow(0 0 5px rgba(220, 38, 38, 0.55));
  animation: active-line-flow 1.7s linear infinite;
}

.top-label-layer {
  pointer-events: none;
}

@keyframes active-line-flow {
  0% {
    stroke-dashoffset: 0;
  }

  100% {
    stroke-dashoffset: -108;
  }
}

.zoom-toolbar {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: flex;
  gap: 8px;
}

.topology-legend {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--cm-muted);
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(25, 43, 78, 0.08);
}

.topology-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.topology-legend__line {
  width: 24px;
  height: 3px;
  border-radius: 999px;
}

.topology-legend__line--fiber {
  background: #f59e0b;
}

.topology-legend__line--cable {
  background: #7a8496;
}

.topology-legend__line--other {
  background: #2563eb;
}

.zoom-btn,
.zoom-readout {
  border: 1px solid #d6e3ef;
  background: rgba(255, 255, 255, 0.92);
  color: #27425e;
  border-radius: 8px;
  height: 32px;
  min-width: 32px;
  padding: 0 10px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(88, 116, 146, 0.12);
}

.zoom-readout {
  min-width: 58px;
  font-size: 12px;
}

.zoom-btn:hover,
.zoom-readout:hover {
  border-color: #9eb8d4;
  color: #123c69;
}

.draggable {
  cursor: move;
}

.draggable:hover text:first-of-type {
  fill: #0f4aa3;
}
</style>
