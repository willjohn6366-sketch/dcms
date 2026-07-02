<template>
  <div class="dashboard" v-loading="loading">
    <section class="metric-grid">
      <button class="metric-card" type="button" @click="router.push('/customers')">
        <span>客户资料</span>
        <strong>{{ stats.customers }}</strong>
      </button>
      <button class="metric-card" type="button" @click="router.push('/circuits')">
        <span>电路资料</span>
        <strong>{{ stats.circuits }}</strong>
      </button>
      <button class="metric-card" type="button" @click="router.push('/topologies')">
        <span>组网拓扑</span>
        <strong>{{ stats.topologies }}</strong>
      </button>
      <button class="metric-card" type="button" @click="router.push('/data')">
        <span>备份记录</span>
        <strong>{{ backups.length }}</strong>
      </button>
      <div class="metric-card metric-card--static">
        <span>最近更新</span>
        <strong class="metric-card__time">{{ latestUpdate }}</strong>
      </div>
    </section>

    <section class="rank-grid">
      <div class="rank-panel">
        <div class="rank-panel__head">
          <span>客户业务排行</span>
          <strong>电路数量</strong>
        </div>
        <div class="rank-list">
          <div v-for="item in customerRanking" :key="item.id" class="rank-row" @click="router.push(`/customers/${item.id}`)">
            <div class="rank-row__main">
              <span class="rank-row__name">{{ item.name }}</span>
              <div class="rank-row__bar">
                <span :style="{ width: item.percent + '%' }" />
              </div>
            </div>
            <strong>{{ item.count }}</strong>
          </div>
          <el-empty v-if="!customerRanking.length" description="暂无客户数据" />
        </div>
      </div>

      <div class="rank-panel">
        <div class="rank-panel__head">
          <span>电路类型排行</span>
          <strong>类型总数</strong>
        </div>
        <div class="rank-list">
          <div v-for="item in circuitTypeRanking" :key="item.name" class="rank-row">
            <div class="rank-row__main">
              <span class="rank-row__name">{{ item.name }}</span>
              <div class="rank-row__bar rank-row__bar--type">
                <span :style="{ width: item.percent + '%' }" />
              </div>
            </div>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="status-panel">
      <div class="status-panel__head">
        <span>服务状态</span>
      </div>
      <div class="status-grid">
        <div v-for="item in accessRows" :key="item.key" class="status-item">
          <span class="status-item__name">{{ item.name }}</span>
          <span class="status-item__port">{{ item.port }}</span>
          <em>{{ item.url }}</em>
          <el-tag :type="item.online ? 'success' : 'info'" effect="plain">{{ item.status }}</el-tag>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { fetchCustomers } from '@/api/customer';
import { searchCircuits } from '@/api/circuit';
import { fetchTopologiesPage } from '@/api/topology';
import { listBackups } from '@/api/data';
import type { BackupFile } from '@/api/data';
import type { Customer } from '@/types/customer';
import type { Circuit } from '@/types/circuit';

const router = useRouter();
const loading = ref(false);
const backendOnline = ref(false);
const backendChecked = ref(false);
const mobileOnline = ref(false);
const mobileChecked = ref(false);
const pcOnline = ref(false);
const pcChecked = ref(false);
const backups = ref<BackupFile[]>([]);
const customers = ref<Customer[]>([]);
const circuits = ref<Circuit[]>([]);
const currentHost = window.location.hostname || '127.0.0.1';
const circuitTypes = ['IPRAN', 'STN', '互联网专线', '裸纤', 'SDH', 'MSTP', 'OTN', '语音中继', 'FTTH', '其他'];

const stats = reactive({
  customers: 0,
  topologies: 0,
  circuits: 0
});

const accessRows = computed(() => [
  {
    key: 'data',
    name: '数据服务',
    port: '6100',
    url: `http://${currentHost}:6100/`,
    online: backendOnline.value,
    status: getServiceStatus(backendChecked.value, backendOnline.value, '异常')
  },
  {
    key: 'mobile',
    name: '移动端',
    port: '6101',
    url: `http://${currentHost}:6101/`,
    online: mobileOnline.value,
    status: mobileStatusText.value
  },
  {
    key: 'pc',
    name: 'PC 管理端',
    port: '6102',
    url: `http://${currentHost}:6102/`,
    online: pcOnline.value,
    status: getServiceStatus(pcChecked.value, pcOnline.value, '异常')
  }
]);

const mobileStatusText = computed(() => {
  if (!mobileChecked.value) return '检测中';
  return mobileOnline.value ? '正常' : '未启动';
});

const latestUpdate = computed(() => {
  const dates = [
    ...customers.value.map((item) => item.updated_at || item.updatedAt),
    ...circuits.value.map((item) => item.updated_at || item.updatedAt)
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  if (!dates.length) return '-';
  return formatDateTime(dates[0]);
});

const customerRanking = computed(() => {
  const rows = customers.value
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      count: customer.Circuits?.length || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const max = Math.max(...rows.map((item) => item.count), 1);
  return rows.map((item) => ({
    ...item,
    percent: getPercent(item.count, max)
  }));
});

const circuitTypeRanking = computed(() => {
  const counts = new Map<string, number>();
  circuitTypes.forEach((type) => counts.set(type, 0));
  circuits.value.forEach((circuit) => {
    const type = circuit.circuit_type || '其他';
    counts.set(type, (counts.get(type) || 0) + 1);
  });

  const rows = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);
  const max = Math.max(...rows.map((item) => item.count), 1);
  return rows.map((item) => ({
    ...item,
    percent: getPercent(item.count, max)
  }));
});

async function loadDashboard() {
  loading.value = true;
  try {
    const [customerRes, circuitRes, topologyRes, backupRes] = await Promise.all([
      fetchCustomers(),
      searchCircuits({}),
      fetchTopologiesPage({ page: 1, pageSize: 1 }),
      listBackups()
    ]);

    customers.value = customerRes.data;
    circuits.value = circuitRes.data;
    stats.customers = customerRes.data.length;
    stats.circuits = circuitRes.data.length;
    stats.topologies = topologyRes.data.total;
    backups.value = backupRes.data;
  } finally {
    loading.value = false;
  }
}

async function checkServices() {
  const [backendResult, mobileResult, pcResult] = await Promise.all([
    checkUrl('/api/health'),
    checkUrl(`http://${currentHost}:6101/`, 'no-cors'),
    checkUrl(window.location.origin || '/')
  ]);

  backendOnline.value = backendResult;
  backendChecked.value = true;
  mobileOnline.value = mobileResult;
  mobileChecked.value = true;
  pcOnline.value = pcResult;
  pcChecked.value = true;
}

async function checkUrl(url: string, mode?: RequestMode) {
  try {
    const res = await fetch(url, { method: 'GET', mode, cache: 'no-store' });
    return mode === 'no-cors' || res.ok;
  } catch {
    return false;
  }
}

function getServiceStatus(checked: boolean, online: boolean, offlineText: string) {
  if (!checked) return '检测中';
  return online ? '正常' : offlineText;
}

function getPercent(value: number, max: number) {
  if (value <= 0) return 0;
  return Math.max(10, Math.round((value / max) * 100));
}

function formatDateTime(date: Date) {
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

onMounted(async () => {
  try {
    await Promise.all([loadDashboard(), checkServices()]);
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
  gap: 14px;
}

.metric-card {
  position: relative;
  display: flex;
  min-height: 104px;
  cursor: pointer;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
  padding: 18px;
  text-align: left;
}

.metric-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
  background: var(--metric-accent, var(--cm-primary));
  content: '';
}

.metric-card:nth-child(1) {
  --metric-accent: #2563eb;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), #fff 58%);
}

.metric-card:nth-child(2) {
  --metric-accent: #0f766e;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.08), #fff 58%);
}

.metric-card:nth-child(3) {
  --metric-accent: #d97706;
  background: linear-gradient(135deg, rgba(217, 119, 6, 0.09), #fff 58%);
}

.metric-card:nth-child(4) {
  --metric-accent: #be123c;
  background: linear-gradient(135deg, rgba(190, 18, 60, 0.07), #fff 58%);
}

.metric-card:nth-child(5) {
  --metric-accent: #475569;
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.08), #fff 58%);
}

.metric-card:hover {
  border-color: rgba(37, 99, 235, 0.3);
  background: #f8fbff;
}

.metric-card--static {
  cursor: default;
}

.metric-card--static:hover {
  border-color: var(--cm-border);
}

.metric-card span {
  color: var(--cm-muted);
  font-size: 13px;
  font-weight: 800;
}

.metric-card strong {
  color: var(--cm-text);
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}

.metric-card__time {
  font-size: 18px !important;
  line-height: 1.25 !important;
}

.status-panel,
.rank-panel {
  overflow: hidden;
  border: 1px solid var(--cm-border);
  border-radius: 8px;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
}

.rank-panel__head {
  display: flex;
  height: 52px;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  color: var(--cm-text);
  font-size: 15px;
  font-weight: 800;
}

.rank-panel:first-child .rank-panel__head {
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0));
}

.rank-panel:nth-child(2) .rank-panel__head {
  background: linear-gradient(90deg, rgba(15, 118, 110, 0.1), rgba(15, 118, 110, 0));
}

.rank-panel__head strong {
  color: var(--cm-muted);
  font-size: 12px;
  font-weight: 800;
}

.status-panel {
  display: flex;
  min-height: 48px;
  align-items: center;
  padding: 0 14px;
}

.status-panel__head {
  display: flex;
  width: 150px;
  flex: 0 0 150px;
  align-items: center;
  gap: 10px;
  color: var(--cm-text);
  font-size: 14px;
  font-weight: 800;
}

.status-grid {
  min-width: 0;
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.status-item {
  min-width: 0;
  display: grid;
  grid-template-columns: auto 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-left: 1px solid var(--cm-border);
  padding: 0 10px;
}

.status-item__name {
  color: var(--cm-text);
  font-size: 13px;
  font-weight: 800;
}

.status-item__port {
  color: var(--cm-primary);
  font-size: 14px;
  font-weight: 800;
}

.status-item em {
  overflow: hidden;
  color: var(--cm-muted);
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.rank-list {
  display: flex;
  min-height: 440px;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 14px;
}

.rank-row {
  display: flex;
  min-height: 44px;
  cursor: default;
  align-items: center;
  gap: 16px;
  border-radius: 8px;
  padding: 0 12px;
}

.rank-panel:first-child .rank-row {
  cursor: pointer;
}

.rank-row:hover {
  background: transparent;
}

.rank-row__main {
  min-width: 0;
  flex: 1;
}

.rank-row__name {
  display: block;
  overflow: hidden;
  color: var(--cm-text);
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row__bar {
  height: 6px;
  overflow: hidden;
  margin-top: 8px;
  border-radius: 999px;
  background: #edf2f7;
}

.rank-row__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
}

.rank-row__bar--type span {
  background: linear-gradient(90deg, #0f766e, #5eead4);
}

.rank-row strong {
  width: 44px;
  color: var(--cm-text);
  font-size: 18px;
  font-weight: 800;
  text-align: right;
}
</style>
