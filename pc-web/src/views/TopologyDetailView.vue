<template>
  <div class="topology-detail" v-loading="loading">
    <section class="detail-bar">
      <div class="detail-bar__main">
        <strong>{{ topology?.Customer?.name || `客户 #${topology?.customer_id || '-'}` }}</strong>
        <span>{{ topology?.topology_name || '拓扑详情' }}</span>
      </div>
      <div class="detail-bar__stats">
        <span>设备 {{ devices.length }}</span>
        <span>端口 {{ portCount }}</span>
        <span>连接 {{ connections.length }}</span>
        <span>光纤 {{ fiberCount }}</span>
      </div>
      <div class="detail-bar__actions">
        <el-button @click="goBack">返回</el-button>
        <el-button @click="loadDetail">刷新</el-button>
        <el-button type="primary" @click="runAutoLayout">自动布局</el-button>
      </div>
    </section>

    <section class="canvas-panel">
      <div class="panel-head">
        <div>
          <div class="section-title">拓扑图</div>
        </div>
        <div class="toolbar-actions">
          <el-button @click="openDeviceCreate">新增设备</el-button>
          <el-button type="primary" @click="openConnectionCreate">新增连接</el-button>
        </div>
      </div>
      <TopologySvg
        :devices="devices"
        :connections="connections"
        :editable="true"
        @position-change="onPositionChange"
      />
    </section>

    <section class="manage-grid">
      <div class="manage-panel">
        <div class="panel-head">
          <div>
            <div class="section-title">设备清单</div>
            <div class="section-meta">{{ devices.length }} 台设备</div>
          </div>
        </div>

        <el-table :data="devices" max-height="360">
          <el-table-column label="名称" min-width="220">
            <template #default="{ row }">
              <span class="wrap-cell strong-cell">{{ row.device_name || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="110">
            <template #default="{ row }">{{ getDeviceTypeLabel(row.device_type) }}</template>
          </el-table-column>
          <el-table-column label="型号" min-width="180">
            <template #default="{ row }">
              <span class="wrap-cell">{{ row.device_model || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="位置" min-width="180">
            <template #default="{ row }">
              <span class="wrap-cell">{{ row.location || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDeviceEdit(row)">编辑</el-button>
              <el-popconfirm title="确认删除设备？" @confirm="onDeleteDevice(row.id)">
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="manage-panel">
        <div class="panel-head">
          <div>
            <div class="section-title">连接清单</div>
            <div class="section-meta">{{ connections.length }} 条连接</div>
          </div>
        </div>

        <el-table :data="connections" max-height="360">
          <el-table-column label="源端口" min-width="260">
            <template #default="{ row }">
              <span class="wrap-cell strong-cell">{{ getPortLabel(row.source_port_id) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="目标端口" min-width="260">
            <template #default="{ row }">
              <span class="wrap-cell strong-cell">{{ getPortLabel(row.target_port_id) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag effect="plain">{{ getConnectionTypeLabel(row.connection_type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="线缆信息" min-width="220">
            <template #default="{ row }">
              <span class="wrap-cell">{{ row.fiber_info || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openConnectionEdit(row)">编辑</el-button>
              <el-popconfirm title="确认删除连接？" @confirm="onDeleteConnection(row.id)">
                <template #reference>
                  <el-button link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>

  <el-dialog v-model="deviceDialog" :title="deviceEditingId ? '编辑设备' : '新增设备'" width="820px">
    <el-form ref="deviceFormRef" :model="deviceForm" :rules="deviceRules" label-width="90px">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="设备名称" prop="device_name"><el-input v-model="deviceForm.device_name" /></el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备类型" prop="device_type">
            <el-select v-model="deviceForm.device_type" style="width: 100%">
              <el-option label="路由器" value="router" />
              <el-option label="交换机" value="switch" />
              <el-option label="ODF" value="odf" />
              <el-option label="光设备" value="optical_device" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="设备型号"><el-input v-model="deviceForm.device_model" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="位置"><el-input v-model="deviceForm.location" /></el-form-item></el-col>
      </el-row>
    </el-form>

    <div class="port-editor">
      <div class="head-row port-head">
        <span class="section-title">端口信息</span>
        <el-button @click="addDevicePortRow">新增端口</el-button>
      </div>

      <el-table :data="devicePorts">
        <el-table-column label="端口名" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.port_name" placeholder="如 GE1 / PON1" />
          </template>
        </el-table-column>
        <el-table-column label="类型" width="160">
          <template #default="{ row }">
            <el-select v-model="row.port_type" style="width: 100%">
              <el-option label="光口" value="optical" />
              <el-option label="电口" value="electrical" />
              <el-option label="其他" value="other" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="速率" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.port_speed" placeholder="如 1000M / 10G" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" @click="removeDevicePortRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="devicePorts.length === 0" description="当前未添加端口" />
    </div>

    <template #footer>
      <el-button @click="deviceDialog = false">取消</el-button>
      <el-button type="primary" :loading="deviceSubmitting" @click="onSubmitDevice">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="connectionDialog" :title="connectionEditingId ? '编辑连接' : '新增连接'" width="560px">
    <el-form ref="connectionFormRef" :model="connectionForm" :rules="connectionRules" label-width="90px">
      <el-form-item label="源端口" prop="source_port_id">
        <el-select v-model="connectionForm.source_port_id" style="width: 100%" filterable>
          <el-option v-for="port in allPorts" :key="port.id" :label="port.label" :value="port.id">
            <div class="port-option" :class="{ 'port-option--child': !port.isFirstInDevice }">
              <span v-if="!port.isFirstInDevice" class="port-option__branch" />
              <span class="port-option__text">{{ port.displayLabel }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="目标端口" prop="target_port_id">
        <el-select v-model="connectionForm.target_port_id" style="width: 100%" filterable>
          <el-option v-for="port in allPorts" :key="port.id" :label="port.label" :value="port.id">
            <div class="port-option" :class="{ 'port-option--child': !port.isFirstInDevice }">
              <span v-if="!port.isFirstInDevice" class="port-option__branch" />
              <span class="port-option__text">{{ port.displayLabel }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="连接类型" prop="connection_type">
        <el-select v-model="connectionForm.connection_type" style="width: 100%">
          <el-option label="光纤" value="fiber" />
          <el-option label="网线" value="cable" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="线缆信息"><el-input v-model="connectionForm.fiber_info" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="connectionDialog = false">取消</el-button>
      <el-button type="primary" :loading="connectionSubmitting" @click="onSubmitConnection">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import TopologySvg from '@/components/TopologySvg.vue';
import {
  createConnection,
  createDevice,
  createPort,
  deleteConnection,
  deleteDevice,
  deletePort,
  fetchAutoLayout,
  fetchTopologyDetail,
  updateConnection,
  updateDevice,
  updateLayout,
  updatePort
} from '@/api/topology';
import type { Connection, Device, Port, Topology } from '@/types/topology';

interface EditablePortRow {
  id?: number;
  port_name: string;
  port_type: Port['port_type'];
  port_speed: string;
}

const route = useRoute();
const router = useRouter();
const topologyId = Number(route.params.id);

const loading = ref(false);
const topology = ref<Topology | null>(null);

const deviceDialog = ref(false);
const deviceSubmitting = ref(false);
const deviceEditingId = ref<number | null>(null);
const deviceFormRef = ref<FormInstance>();
const deviceForm = reactive({
  device_name: '',
  device_type: 'other' as Device['device_type'],
  device_model: '',
  location: '',
  position_x: 100,
  position_y: 100
});
const devicePorts = ref<EditablePortRow[]>([]);
const originalDevicePortIds = ref<number[]>([]);

const connectionDialog = ref(false);
const connectionSubmitting = ref(false);
const connectionEditingId = ref<number | null>(null);
const connectionFormRef = ref<FormInstance>();
const connectionForm = reactive({
  source_port_id: undefined as number | undefined,
  target_port_id: undefined as number | undefined,
  connection_type: 'fiber' as Connection['connection_type'],
  fiber_info: ''
});

const deviceRules = reactive<FormRules<typeof deviceForm>>({
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  device_type: [{ required: true, message: '请选择设备类型', trigger: 'change' }]
});

const connectionRules = reactive<FormRules<typeof connectionForm>>({
  source_port_id: [{ required: true, message: '请选择源端口', trigger: 'change' }],
  target_port_id: [{ required: true, message: '请选择目标端口', trigger: 'change' }],
  connection_type: [{ required: true, message: '请选择连接类型', trigger: 'change' }]
});

const devices = computed(() => topology.value?.Devices || []);
const connections = computed(() => topology.value?.Connections || []);
const portCount = computed(() => devices.value.reduce((sum, device) => sum + (device.Ports?.length || 0), 0));
const fiberCount = computed(() => connections.value.filter((connection) => connection.connection_type === 'fiber').length);
const deviceTypeLabels: Record<Device['device_type'], string> = {
  router: '路由器',
  switch: '交换机',
  odf: 'ODF',
  optical_device: '光设备',
  other: '其他'
};
const connectionTypeLabels: Record<Connection['connection_type'], string> = {
  fiber: '光纤',
  cable: '网线',
  other: '其他'
};

const allPorts = computed(() => {
  return devices.value.flatMap((dev) => {
    const deviceLabel = `${dev.location || '未填机房'} · ${dev.device_name}`;
    return (dev.Ports || []).map((port, index) => ({
      ...port,
      deviceName: dev.device_name,
      label: `${deviceLabel}:${port.port_name}`,
      displayLabel: index === 0 ? `${deviceLabel}:${port.port_name}` : port.port_name,
      isFirstInDevice: index === 0
    }));
  });
});

const portById = computed(() => {
  const map = new Map<number, (typeof allPorts.value)[number]>();
  allPorts.value.forEach((port) => map.set(port.id, port));
  return map;
});

function getPortLabel(portId: number) {
  return portById.value.get(portId)?.label || `端口#${portId}`;
}

function getDeviceTypeLabel(deviceType: Device['device_type']) {
  return deviceTypeLabels[deviceType] || '其他';
}

function getConnectionTypeLabel(connectionType: Connection['connection_type']) {
  return connectionTypeLabels[connectionType] || '其他';
}

async function loadDetail() {
  loading.value = true;
  try {
    const res = await fetchTopologyDetail(topologyId);
    topology.value = res.data;
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/topologies');
}

async function runAutoLayout() {
  try {
    const positions = await fetchAutoLayout(topologyId);
    await updateLayout(topologyId, positions.data);
    ElMessage.success('自动布局完成');
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

async function onPositionChange(payload: { id: number; x: number; y: number }) {
  try {
    await updateLayout(topologyId, [payload]);
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function resetDeviceForm() {
  deviceForm.device_name = '';
  deviceForm.device_type = 'other';
  deviceForm.device_model = '';
  deviceForm.location = '';
  deviceForm.position_x = 100;
  deviceForm.position_y = 100;
  devicePorts.value = [];
  originalDevicePortIds.value = [];
}

function openDeviceCreate() {
  deviceEditingId.value = null;
  resetDeviceForm();
  deviceDialog.value = true;
}

function openDeviceEdit(row: Device) {
  deviceEditingId.value = row.id;
  deviceForm.device_name = row.device_name;
  deviceForm.device_type = row.device_type;
  deviceForm.device_model = row.device_model || '';
  deviceForm.location = row.location || '';
  deviceForm.position_x = Math.round(row.position_x || 100);
  deviceForm.position_y = Math.round(row.position_y || 100);
  devicePorts.value = (row.Ports || []).map((port) => ({
    id: port.id,
    port_name: port.port_name,
    port_type: port.port_type,
    port_speed: port.port_speed || ''
  }));
  originalDevicePortIds.value = (row.Ports || []).map((port) => port.id);
  deviceDialog.value = true;
}

function addDevicePortRow() {
  devicePorts.value.push({
    port_name: '',
    port_type: 'other',
    port_speed: ''
  });
}

function removeDevicePortRow(index: number) {
  devicePorts.value.splice(index, 1);
}

async function onSubmitDevice() {
  if (!deviceFormRef.value) return;
  const valid = await deviceFormRef.value.validate().catch(() => false);
  if (!valid) return;

  const normalizedPorts = devicePorts.value.map((port) => ({
    ...port,
    port_name: port.port_name.trim(),
    port_speed: port.port_speed.trim()
  }));
  const invalidPort = normalizedPorts.find((port) => !port.port_name);
  if (invalidPort) {
    ElMessage.warning('请完善端口名称');
    return;
  }

  deviceSubmitting.value = true;
  try {
    const payload = {
      topology_id: topologyId,
      device_name: deviceForm.device_name,
      device_type: deviceForm.device_type,
      device_model: deviceForm.device_model,
      location: deviceForm.location,
      position_x: deviceForm.position_x,
      position_y: deviceForm.position_y
    };

    let deviceId = deviceEditingId.value;
    if (deviceEditingId.value) {
      await updateDevice(deviceEditingId.value, payload);
    } else {
      const res = await createDevice(payload);
      deviceId = res.data.id;
    }

    if (!deviceId) {
      throw new Error('设备保存失败');
    }

    const currentPortIds = new Set(
      normalizedPorts
        .filter((port) => port.id)
        .map((port) => port.id as number)
    );
    const deletedPortIds = originalDevicePortIds.value.filter((id) => !currentPortIds.has(id));

    await Promise.all([
      ...deletedPortIds.map((id) => deletePort(id)),
      ...normalizedPorts.map((port) => {
        const portPayload = {
          device_id: deviceId as number,
          port_name: port.port_name,
          port_type: port.port_type,
          port_speed: port.port_speed || ''
        };
        return port.id ? updatePort(port.id, portPayload) : createPort(portPayload);
      })
    ]);

    ElMessage.success('设备及端口保存成功');
    deviceDialog.value = false;
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    deviceSubmitting.value = false;
  }
}

async function onDeleteDevice(id: number) {
  try {
    await deleteDevice(id);
    ElMessage.success('设备删除成功');
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function resetConnectionForm() {
  connectionForm.source_port_id = undefined;
  connectionForm.target_port_id = undefined;
  connectionForm.connection_type = 'fiber';
  connectionForm.fiber_info = '';
}

function openConnectionCreate() {
  connectionEditingId.value = null;
  resetConnectionForm();
  connectionDialog.value = true;
}

function openConnectionEdit(row: Connection) {
  connectionEditingId.value = row.id;
  connectionForm.source_port_id = row.source_port_id;
  connectionForm.target_port_id = row.target_port_id;
  connectionForm.connection_type = row.connection_type;
  connectionForm.fiber_info = row.fiber_info || '';
  connectionDialog.value = true;
}

async function onSubmitConnection() {
  if (!connectionFormRef.value) return;
  const valid = await connectionFormRef.value.validate().catch(() => false);
  if (!valid) return;

  if (connectionForm.source_port_id === connectionForm.target_port_id) {
    ElMessage.warning('源端口和目标端口不能相同');
    return;
  }

  connectionSubmitting.value = true;
  try {
    const payload = {
      topology_id: topologyId,
      source_port_id: connectionForm.source_port_id,
      target_port_id: connectionForm.target_port_id,
      connection_type: connectionForm.connection_type,
      fiber_info: connectionForm.fiber_info
    };

    if (connectionEditingId.value) {
      await updateConnection(connectionEditingId.value, payload);
      ElMessage.success('连接更新成功');
    } else {
      await createConnection(payload);
      ElMessage.success('连接创建成功');
    }

    connectionDialog.value = false;
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    connectionSubmitting.value = false;
  }
}

async function onDeleteConnection(id: number) {
  try {
    await deleteConnection(id);
    ElMessage.success('连接删除成功');
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

onMounted(async () => {
  try {
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
});
</script>

<style scoped>
.topology-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-bar,
.canvas-panel,
.manage-panel {
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.78);
  border-radius: 8px;
  background: var(--cm-surface);
  box-shadow: 0 12px 30px rgba(25, 43, 78, 0.055);
}

.detail-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
}

.detail-bar__main {
  display: flex;
  min-width: 220px;
  align-items: baseline;
  gap: 10px;
}

.detail-bar__main strong {
  overflow: hidden;
  color: var(--cm-text);
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-bar__main span {
  overflow: hidden;
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-bar__stats {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.detail-bar__stats span {
  border-radius: 999px;
  background: #f4f7fb;
  color: #516176;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  padding: 7px 10px;
  white-space: nowrap;
}

.detail-bar__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.detail-bar__actions :deep(.el-button) {
  height: 32px;
}

.canvas-panel {
  min-width: 0;
}

.panel-head {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
}

.canvas-panel :deep(.topology-canvas-wrap) {
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  border-radius: 0;
  min-height: 560px;
}

.manage-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.manage-panel :deep(.el-table__cell) {
  vertical-align: top;
}

.wrap-cell {
  display: block;
  color: var(--cm-text);
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
}

.strong-cell {
  font-weight: 700;
}

.port-option {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  line-height: 1.35;
}

.port-option--child {
  padding-left: 18px;
  color: #64748b;
}

.port-option__branch {
  width: 12px;
  height: 16px;
  flex: 0 0 auto;
  border-bottom: 1px solid #cbd5e1;
  border-left: 1px solid #cbd5e1;
  transform: translateY(-4px);
}

.port-option__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.port-editor {
  margin-top: 8px;
}

.port-head {
  margin-bottom: 12px;
}
</style>
