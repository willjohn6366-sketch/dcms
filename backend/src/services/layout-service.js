/**
 * 拓扑图自动布局算法
 * 先按位置区域布局，再布局区域内设备，避免区域重叠。
 */

const HORIZONTAL_MARGIN = 90;
const VERTICAL_MARGIN = 80;
const MIN_NODE_GAP = 280;
const LAYER_GAP = 280;
const LOCATION_COLUMN_GAP = 360;
const LOCATION_DEVICE_ROW_GAP = 190;

function autoLayout(devices, connections, canvasWidth = 750, canvasHeight = 600) {
  if (!devices || devices.length === 0) {
    return [];
  }

  if (devices.length === 1) {
    return [{ id: devices[0].id, x: canvasWidth / 2, y: canvasHeight / 2 }];
  }

  const { adjacencyList, degreeMap } = buildAdjacencyList(devices, connections);
  const locationGroups = buildLocationGroups(devices);
  const deviceMetaMap = buildDeviceMetaMap(devices, degreeMap);

  if (locationGroups.length <= 1) {
    const layers = optimizeLayerOrdering(buildDeviceLayers(devices, adjacencyList, degreeMap), adjacencyList);
    return assignLayeredPositions(layers, adjacencyList, degreeMap, deviceMetaMap, canvasWidth, canvasHeight);
  }

  const locationGraph = buildLocationGraph(locationGroups, devices, connections);
  return assignPositionsByLocationGroups(
    locationGroups,
    locationGraph,
    adjacencyList,
    degreeMap,
    canvasWidth
  );
}

function buildAdjacencyList(devices, connections) {
  const adjacencyList = {};
  const degreeMap = {};
  const portToDeviceMap = new Map();

  devices.forEach((device) => {
    adjacencyList[device.id] = [];
    degreeMap[device.id] = 0;
    (device.Ports || []).forEach((port) => portToDeviceMap.set(port.id, device.id));
  });

  connections.forEach((conn) => {
    const sourceDeviceId = portToDeviceMap.get(conn.source_port_id);
    const targetDeviceId = portToDeviceMap.get(conn.target_port_id);

    if (!sourceDeviceId || !targetDeviceId || sourceDeviceId === targetDeviceId) return;

    adjacencyList[sourceDeviceId].push(targetDeviceId);
    adjacencyList[targetDeviceId].push(sourceDeviceId);
    degreeMap[sourceDeviceId] += 1;
    degreeMap[targetDeviceId] += 1;
  });

  return { adjacencyList, degreeMap };
}

function buildLocationGroups(devices) {
  const grouped = new Map();

  devices.forEach((device) => {
    const key = normalizeLocation(device.location);
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        devices: []
      });
    }
    grouped.get(key).devices.push(device);
  });

  return Array.from(grouped.values());
}

function buildLocationGraph(locationGroups, devices, connections) {
  const deviceToLocation = new Map();
  const portToDevice = new Map();
  const graph = {};
  const degreeMap = {};

  locationGroups.forEach((group) => {
    graph[group.key] = [];
    degreeMap[group.key] = 0;
    group.devices.forEach((device) => {
      deviceToLocation.set(device.id, group.key);
      (device.Ports || []).forEach((port) => portToDevice.set(port.id, device.id));
    });
  });

  connections.forEach((conn) => {
    const sourceDeviceId = portToDevice.get(conn.source_port_id);
    const targetDeviceId = portToDevice.get(conn.target_port_id);
    if (!sourceDeviceId || !targetDeviceId) return;

    const sourceLocation = deviceToLocation.get(sourceDeviceId);
    const targetLocation = deviceToLocation.get(targetDeviceId);
    if (!sourceLocation || !targetLocation || sourceLocation === targetLocation) return;

    graph[sourceLocation].push(targetLocation);
    graph[targetLocation].push(sourceLocation);
    degreeMap[sourceLocation] += 1;
    degreeMap[targetLocation] += 1;
  });

  return { graph, degreeMap };
}

function buildDeviceMetaMap(devices, degreeMap) {
  const metaMap = new Map();

  devices.forEach((device) => {
    const portCount = (device.Ports || []).length;
    const labelLength = Math.max((device.device_name || '').length, (device.device_model || '').length);
    metaMap.set(device.id, {
      portCount,
      degree: degreeMap[device.id] || 0,
      labelLength,
      spacing: resolveDeviceSpacing(portCount, degreeMap[device.id] || 0, labelLength)
    });
  });

  return metaMap;
}

function buildDeviceLayers(devices, adjacencyList, degreeMap) {
  const deviceMap = new Map(devices.map((device) => [device.id, device]));
  const visited = new Set();
  const layers = [];
  const roots = [...devices]
    .sort((a, b) => (degreeMap[b.id] || 0) - (degreeMap[a.id] || 0) || a.id - b.id)
    .map((device) => device.id);

  roots.forEach((rootId) => {
    if (visited.has(rootId)) return;

    const queue = [{ id: rootId, layer: 0 }];
    visited.add(rootId);

    while (queue.length > 0) {
      const { id, layer } = queue.shift();
      const device = deviceMap.get(id);
      if (!device) continue;

      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(device);

      const neighbors = (adjacencyList[id] || [])
        .filter((neighborId) => deviceMap.has(neighborId) && !visited.has(neighborId))
        .sort((a, b) => (degreeMap[b] || 0) - (degreeMap[a] || 0) || a - b);

      neighbors.forEach((neighborId) => {
        visited.add(neighborId);
        queue.push({ id: neighborId, layer: layer + 1 });
      });
    }
  });

  return layers.filter((layer) => layer && layer.length > 0);
}

function assignPositionsByLocationGroups(
  locationGroups,
  locationGraph,
  adjacencyList,
  degreeMap,
  canvasWidth
) {
  const positions = [];
  const orderedGroups = orderLocationGroups(locationGroups, locationGraph);
  const placedRows = new Map();
  const startX = Math.max(HORIZONTAL_MARGIN, canvasWidth / 2 - ((orderedGroups.length - 1) * LOCATION_COLUMN_GAP) / 2);

  orderedGroups.forEach((group, groupIndex) => {
    const orderedDevices = orderDevicesForLocation(group, adjacencyList, degreeMap, placedRows);
    const rowGap = resolveLocationDeviceRowGap(group, degreeMap);
    const x = startX + groupIndex * LOCATION_COLUMN_GAP;

    orderedDevices.forEach((device, rowIndex) => {
      const y = VERTICAL_MARGIN + rowIndex * rowGap;
      positions.push({
        id: device.id,
        x,
        y
      });
      placedRows.set(device.id, rowIndex);
    });
  });

  return positions;
}

function orderLocationGroups(locationGroups, locationGraph) {
  const groupMap = new Map(locationGroups.map((group) => [group.key, group]));
  const visited = new Set();
  const ordered = [];
  const roots = [...locationGroups].sort((a, b) => {
    const degreeDiff = (locationGraph.degreeMap[b.key] || 0) - (locationGraph.degreeMap[a.key] || 0);
    if (degreeDiff !== 0) return degreeDiff;
    return a.key.localeCompare(b.key, 'zh-Hans-CN');
  });

  roots.forEach((root) => {
    if (visited.has(root.key)) return;

    const queue = [root.key];
    visited.add(root.key);

    while (queue.length > 0) {
      const key = queue.shift();
      const group = groupMap.get(key);
      if (!group) continue;

      ordered.push(group);

      const neighbors = [...new Set(locationGraph.graph[key] || [])]
        .filter((neighborKey) => groupMap.has(neighborKey) && !visited.has(neighborKey))
        .sort((a, b) => {
          const degreeDiff = (locationGraph.degreeMap[b] || 0) - (locationGraph.degreeMap[a] || 0);
          if (degreeDiff !== 0) return degreeDiff;
          return a.localeCompare(b, 'zh-Hans-CN');
        });

      neighbors.forEach((neighborKey) => {
        visited.add(neighborKey);
        queue.push(neighborKey);
      });
    }
  });

  return ordered;
}

function orderDevicesForLocation(group, adjacencyList, degreeMap, placedRows) {
  return [...group.devices].sort((a, b) => {
    const aNeighborRow = getPlacedNeighborRow(a.id, adjacencyList, placedRows);
    const bNeighborRow = getPlacedNeighborRow(b.id, adjacencyList, placedRows);

    if (aNeighborRow !== null && bNeighborRow !== null && Math.abs(aNeighborRow - bNeighborRow) > 0.01) {
      return aNeighborRow - bNeighborRow;
    }
    if (aNeighborRow !== null && bNeighborRow === null) return -1;
    if (aNeighborRow === null && bNeighborRow !== null) return 1;

    const degreeDiff = (degreeMap[b.id] || 0) - (degreeMap[a.id] || 0);
    if (degreeDiff !== 0) return degreeDiff;

    return a.id - b.id;
  });
}

function getPlacedNeighborRow(deviceId, adjacencyList, placedRows) {
  const rows = (adjacencyList[deviceId] || [])
    .map((neighborId) => placedRows.get(neighborId))
    .filter((row) => typeof row === 'number');

  if (!rows.length) return null;
  return rows.reduce((sum, row) => sum + row, 0) / rows.length;
}

function resolveLocationDeviceRowGap(group, degreeMap) {
  const maxDensity = group.devices.reduce((max, device) => {
    const portCount = (device.Ports || []).length;
    return Math.max(max, portCount + (degreeMap[device.id] || 0));
  }, 0);

  return Math.max(LOCATION_DEVICE_ROW_GAP, 150 + maxDensity * 8);
}

function assignLayeredPositions(layers, adjacencyList, degreeMap, deviceMetaMap, canvasWidth, canvasHeight) {
  const relativePositions = assignRelativePositions(layers, adjacencyList, degreeMap, deviceMetaMap, LAYER_GAP);
  const maxYOffset = relativePositions.reduce((max, pos) => Math.max(max, pos.y), 0);
  const yOffset = Math.max(VERTICAL_MARGIN, (canvasHeight - maxYOffset) / 2 - 20);

  return relativePositions.map((pos) => ({
    id: pos.id,
    x: canvasWidth / 2 + pos.x,
    y: yOffset + pos.y
  }));
}

function assignRelativePositions(layers, adjacencyList, degreeMap, deviceMetaMap, layerGap) {
  const positions = [];
  const orderedIdsByLayer = [];
  const xById = new Map();

  layers.forEach((layer, layerIndex) => {
    const orderedLayer = orderLayer(layer, layerIndex, orderedIdsByLayer, adjacencyList, degreeMap, xById);
    orderedIdsByLayer[layerIndex] = orderedLayer.map((device) => device.id);

    const gaps = computeSequentialGaps(orderedLayer, (device) => deviceMetaMap.get(device.id)?.spacing || MIN_NODE_GAP);
    const rowWidth = gaps.reduce((sum, gap) => sum + gap, 0);
    const startX = -rowWidth / 2;
    const y = layerIndex * layerGap;
    let cursorX = startX;

    orderedLayer.forEach((device, index) => {
      const x = cursorX;
      positions.push({ id: device.id, x, y });
      xById.set(device.id, x);
      cursorX += gaps[index] || 0;
    });
  });

  return positions;
}

function orderLayer(layer, layerIndex, orderedIdsByLayer, adjacencyList, degreeMap, xById) {
  if (layerIndex === 0) {
    return [...layer].sort((a, b) => {
      const degreeDiff = (degreeMap[b.id] || 0) - (degreeMap[a.id] || 0);
      if (degreeDiff !== 0) return degreeDiff;
      return a.id - b.id;
    });
  }

  const previousLayerIds = new Set(orderedIdsByLayer[layerIndex - 1] || []);

  return [...layer].sort((a, b) => {
    const aParentCenter = getParentCenter(a.id, previousLayerIds, adjacencyList, xById);
    const bParentCenter = getParentCenter(b.id, previousLayerIds, adjacencyList, xById);
    const centerDiff = aParentCenter - bParentCenter;
    if (Math.abs(centerDiff) > 1) return centerDiff;

    const locationCompare = normalizeLocation(a.location).localeCompare(normalizeLocation(b.location), 'zh-Hans-CN');
    if (locationCompare !== 0) return locationCompare;

    const degreeDiff = (degreeMap[b.id] || 0) - (degreeMap[a.id] || 0);
    if (degreeDiff !== 0) return degreeDiff;

    return a.id - b.id;
  });
}

function getParentCenter(deviceId, previousLayerIds, adjacencyList, xById) {
  const parentXs = (adjacencyList[deviceId] || [])
    .filter((neighborId) => previousLayerIds.has(neighborId))
    .map((neighborId) => xById.get(neighborId))
    .filter((value) => typeof value === 'number');

  if (!parentXs.length) return Number.MAX_SAFE_INTEGER;
  return parentXs.reduce((sum, value) => sum + value, 0) / parentXs.length;
}

function optimizeLayerOrdering(layers, adjacencyList) {
  const optimized = layers.map((layer) => [...layer]);

  for (let round = 0; round < 3; round += 1) {
    for (let index = 1; index < optimized.length; index += 1) {
      const prevOrder = new Map(optimized[index - 1].map((item, order) => [item.id, order]));
      optimized[index].sort((a, b) => {
        const diff = getNeighborBarycenter(a.id, prevOrder, adjacencyList) - getNeighborBarycenter(b.id, prevOrder, adjacencyList);
        if (Math.abs(diff) > 0.01) return diff;
        return a.id - b.id;
      });
    }

    for (let index = optimized.length - 2; index >= 0; index -= 1) {
      const nextOrder = new Map(optimized[index + 1].map((item, order) => [item.id, order]));
      optimized[index].sort((a, b) => {
        const diff = getNeighborBarycenter(a.id, nextOrder, adjacencyList) - getNeighborBarycenter(b.id, nextOrder, adjacencyList);
        if (Math.abs(diff) > 0.01) return diff;
        return a.id - b.id;
      });
    }
  }

  return optimized;
}

function getNeighborBarycenter(id, orderMap, graph) {
  const orders = (graph[id] || []).map((neighborId) => orderMap.get(neighborId)).filter((value) => typeof value === 'number');
  if (!orders.length) return Number.MAX_SAFE_INTEGER;
  return orders.reduce((sum, value) => sum + value, 0) / orders.length;
}

function computeSequentialGaps(items, getSpacing) {
  if (items.length <= 1) return [0];

  const gaps = [];
  for (let index = 0; index < items.length - 1; index += 1) {
    const currentSpacing = getSpacing(items[index]);
    const nextSpacing = getSpacing(items[index + 1]);
    gaps.push(Math.max(MIN_NODE_GAP, (currentSpacing + nextSpacing) / 2));
  }
  gaps.push(0);
  return gaps;
}

function resolveDeviceSpacing(portCount, degree, labelLength) {
  return Math.max(
    MIN_NODE_GAP,
    120 + portCount * 18 + degree * 12 + Math.max(0, labelLength - 6) * 5
  );
}

function normalizeLocation(value) {
  return (value || '').trim() || '未分区';
}

module.exports = {
  autoLayout
};
