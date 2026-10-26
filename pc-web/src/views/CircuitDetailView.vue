<template>
  <div class="page-stack resource-detail" v-loading="loading">
    <section class="detail-hero">
      <div>
        <div class="detail-hero__label">{{ circuit?.circuit_type || '未分类' }} · {{ circuit?.bandwidth || '未填带宽' }}</div>
        <h1 class="detail-hero__title">{{ circuit?.circuit_name || '电路详情' }}</h1>
        <div class="detail-hero__meta">{{ circuit?.Customer?.name || `#${circuit?.customer_id || '-'}` }}</div>
      </div>
      <el-button @click="goBack">返回</el-button>
    </section>

    <div class="detail-sections">
    <el-card class="detail-section-card" shadow="never">
      <template #header>
        <div class="section-title">电路信息</div>
      </template>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-item__label">电路名称</span>
          <span class="info-item__value">{{ circuit?.circuit_name || '-' }}</span>
        </div>
        <div class="info-item info-item--clickable" @click="copyCircuitNumber">
          <span class="info-item__label">电路编号</span>
          <span class="info-item__value">{{ circuit?.circuit_number || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">客户单位</span>
          <span class="info-item__value">{{ circuit?.Customer?.name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">电路类型</span>
          <span class="info-item__value">{{ circuit?.circuit_type || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">带宽</span>
          <span class="info-item__value">{{ circuit?.bandwidth || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">所属拓扑</span>
          <span class="info-item__value">{{ circuit?.Topology?.topology_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">开通日期</span>
          <span class="info-item__value">{{ circuit?.open_date || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">绑定连接</span>
          <span class="info-item__value">{{ connectionLabel }}</span>
        </div>
      </div>

      <div class="address-grid">
        <div class="info-item">
          <span class="info-item__label">本端 IP</span>
          <span class="info-item__value">{{ circuit?.local_ip || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">对端 IP</span>
          <span class="info-item__value">{{ circuit?.remote_ip || '-' }}</span>
        </div>
      </div>

      <div class="remark-box">
        <span class="info-item__label">备注</span>
        <p>{{ circuit?.remark || '-' }}</p>
      </div>
    </el-card>

    <el-card class="detail-section-card" shadow="never">
      <template #header>
        <div class="section-title">连接信息</div>
      </template>

      <div class="connection-grid">
        <div class="info-item">
          <span class="info-item__label">源端口</span>
          <span class="info-item__value info-item__value--wrap">{{ sourcePortLabel }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">目标端口</span>
          <span class="info-item__value info-item__value--wrap">{{ targetPortLabel }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">连接类型</span>
          <span class="info-item__value">{{ connectionTypeLabel }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">线缆信息</span>
          <span class="info-item__value info-item__value--wrap">{{ circuit?.Connection?.fiber_info || '-' }}</span>
        </div>
      </div>

      <div class="meta-grid">
        <div class="info-item">
          <span class="info-item__label">创建时间</span>
          <span class="info-item__value">{{ formatDateTime(circuit?.created_at || circuit?.createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="info-item__label">更新时间</span>
          <span class="info-item__value">{{ formatDateTime(circuit?.updated_at || circuit?.updatedAt) }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="detail-section-card" shadow="never" v-if="topology">
      <template #header>
        <div>
          <div class="section-title">拓扑图</div>
          <div class="section-meta">{{ topology.topology_name }}</div>
        </div>
      </template>

      <TopologySvg
        :devices="topology.Devices || []"
        :connections="topology.Connections || []"
        :highlight-connection-id="circuit?.connection_id || null"
      />
    </el-card>

    <el-card class="detail-section-card" shadow="never" v-else>
      <el-empty description="当前电路未绑定拓扑" />
    </el-card>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import TopologySvg from '@/components/TopologySvg.vue';
import { fetchCircuitDetail } from '@/api/circuit';
import type { Circuit } from '@/types/circuit';
import type { Port, Topology } from '@/types/topology';

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);

const loading = ref(false);
const circuit = ref<Circuit | null>(null);

const topology = computed<Topology | null>(() => circuit.value?.Topology || null);

const connectionTypeLabels = {
  fiber: '光纤',
  cable: '网线',
  other: '其他'
} as const;

const sourcePortLabel = computed(() => formatConnectionPort(circuit.value?.Connection?.SourcePort));
const targetPortLabel = computed(() => formatConnectionPort(circuit.value?.Connection?.TargetPort));
const connectionTypeLabel = computed(() => {
  const type = circuit.value?.Connection?.connection_type;
  return type ? connectionTypeLabels[type] || '其他' : '-';
});
const connectionLabel = computed(() => {
  if (!circuit.value?.connection_id) return '-';
  if (!circuit.value.Connection) return `#${circuit.value.connection_id}`;
  return `${sourcePortLabel.value} -> ${targetPortLabel.value}`;
});

function goBack() {
  router.push('/circuits');
}

async function copyCircuitNumber() {
  const number = circuit.value?.circuit_number?.trim();
  if (!number) {
    ElMessage.warning('电路编号未填写');
    return;
  }

  await navigator.clipboard.writeText(number);
  ElMessage.success('编号已复制');
}

async function loadDetail() {
  loading.value = true;
  try {
    const res = await fetchCircuitDetail(id);
    circuit.value = res.data;
  } finally {
    loading.value = false;
  }
}

function formatConnectionPort(port?: Port) {
  if (!port) return '-';
  const device = port.Device || findDeviceByPortId(port.id);
  if (!device) return port.port_name || `端口#${port.id}`;
  return `${device.location || '未填机房'} · ${device.device_name}:${port.port_name}`;
}

function findDeviceByPortId(portId: number) {
  return topology.value?.Devices?.find((device) =>
    (device.Ports || []).some((port) => port.id === portId)
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
.resource-detail {
  gap: 28px;
}

.detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 8px;
}

.detail-hero__label {
  margin-bottom: 5px;
  color: #71829a;
  font-size: 14px;
}

.detail-hero__title {
  margin: 0;
  color: #101b2d;
  font-size: 32px;
  font-weight: 750;
  line-height: 45px;
  overflow-wrap: anywhere;
}

.detail-hero__meta {
  margin-top: 7px;
  color: #71829a;
  font-size: 14px;
}

.detail-hero :deep(.el-button) {
  width: 88px;
  height: 45px;
  background: #fff;
  font-size: 16px;
}

.detail-sections {
  min-width: 0;
  padding: 0 32px;
  border: 1px solid #edf1f7;
  border-radius: 10px;
  background: #fff;
}

.detail-section-card {
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.detail-section-card + .detail-section-card {
  border-top: 1px solid #e8edf5 !important;
}

.detail-section-card :deep(.el-card__header) {
  border: 0;
  padding: 28px 0 20px !important;
}

.detail-section-card :deep(.el-card__body) {
  padding: 0 0 28px !important;
}

.info-grid,
.address-grid,
.connection-grid,
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
}

.info-item {
  display: grid;
  min-width: 0;
  min-height: 54px;
  grid-template-columns: 125px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #edf1f7;
}

.info-item:nth-child(even) {
  border-left: 1px solid #edf1f7;
}

.info-item--clickable {
  cursor: pointer;
}

.info-item--clickable:hover {
  background: #f5f9ff;
}

.info-item__label {
  color: #71829a;
  font-size: 15px;
  font-weight: 500;
}

.info-item__value {
  min-width: 0;
  color: #17243b;
  font-size: 15px;
  font-weight: 550;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.remark-box {
  display: grid;
  grid-template-columns: 125px minmax(0, 1fr);
  align-items: baseline;
  gap: 12px;
  padding: 16px 20px 0;
}

.remark-box p {
  margin: 0;
  color: #17243b;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .detail-sections { padding: 0 24px; }
  .info-item { grid-template-columns: 90px minmax(0, 1fr); padding: 12px; }
  .remark-box { grid-template-columns: 90px minmax(0, 1fr); padding-left: 12px; }
}

@media (max-width: 850px) {
  .info-grid, .address-grid, .connection-grid, .meta-grid { grid-template-columns: 1fr; }
  .info-item:nth-child(even) { border-left: 0; }
}
</style>
