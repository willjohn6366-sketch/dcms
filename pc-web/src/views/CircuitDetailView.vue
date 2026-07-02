<template>
  <div class="page-stack" v-loading="loading">
    <section class="detail-hero page-card">
      <div>
        <div class="detail-hero__label">{{ circuit?.circuit_type || '未分类' }} · {{ circuit?.bandwidth || '未填带宽' }}</div>
        <h1 class="detail-hero__title">{{ circuit?.circuit_name || '电路详情' }}</h1>
        <div class="detail-hero__meta">{{ circuit?.Customer?.name || `#${circuit?.customer_id || '-'}` }}</div>
      </div>
      <el-button @click="goBack">返回</el-button>
    </section>

    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="section-title">基础信息</div>
      </template>

      <div class="info-grid">
        <div class="info-item info-item--clickable" @click="copyCircuitNumber">
          <span class="info-item__label">电路编号</span>
          <span class="info-item__value">{{ circuit?.circuit_number || '-' }}</span>
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
          <span class="info-item__value">{{ circuit?.connection_id ? `#${circuit.connection_id}` : '-' }}</span>
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
    </el-card>

    <el-card class="page-card" shadow="never" v-if="topology">
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

    <el-card class="page-card" shadow="never" v-else>
      <el-empty description="当前电路未绑定拓扑" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import TopologySvg from '@/components/TopologySvg.vue';
import { fetchCircuitDetail } from '@/api/circuit';
import type { Circuit } from '@/types/circuit';
import type { Topology } from '@/types/topology';

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id);

const loading = ref(false);
const circuit = ref<Circuit | null>(null);

const topology = computed<Topology | null>(() => circuit.value?.Topology || null);

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

onMounted(async () => {
  try {
    await loadDetail();
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
});
</script>

<style scoped>
.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
}

.detail-hero__label {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.detail-hero__title {
  margin: 6px 0 0;
  color: var(--cm-text);
  font-size: 28px;
  font-weight: 800;
  line-height: 1.25;
}

.detail-hero__meta {
  margin-top: 8px;
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 700;
}

.info-grid,
.address-grid {
  display: grid;
  gap: 14px;
}

.info-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.address-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 14px;
}

.info-item {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-surface-soft);
}

.info-item--clickable {
  cursor: pointer;
}

.info-item--clickable:hover {
  background: var(--cm-primary-soft);
}

.info-item__label {
  display: block;
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 700;
}

.info-item__value {
  display: block;
  overflow: hidden;
  margin-top: 8px;
  color: var(--cm-text);
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
