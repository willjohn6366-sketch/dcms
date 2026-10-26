<template>
  <div class="dashboard" v-loading="loading">
    <header class="dashboard-hero">
      <h1>工作台</h1>
      <p>实时掌握电路资源与客户业务情况，保障网络运行稳定高效。</p>
    </header>

    <section class="metric-grid" aria-label="台账概览">
      <component
        :is="item.path ? 'button' : 'div'"
        v-for="(item, index) in metricCards" :key="item.label"
        class="metric-card" :class="`metric-card--${index}`"
        :type="item.path ? 'button' : undefined"
        @click="item.path && router.push(item.path)"
      >
        <span class="metric-icon"><el-icon><component :is="item.icon" /></el-icon></span>
        <div class="metric-copy">
          <span class="metric-label">{{ item.label }}</span>
          <strong :class="{ 'metric-card__time': !item.path }">{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </div>
        <svg v-if="item.path" class="sparkline" viewBox="0 0 84 52" aria-hidden="true">
          <defs><linearGradient :id="`spark-${index}`" x1="0" y1="0" x2="0" y2="1"><stop stop-color="currentColor" stop-opacity=".22" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs>
          <path d="M1 34 C8 25 13 48 20 27 S31 26 36 29 S43 13 51 22 S62 22 66 11 S77 6 83 10 V52 H1Z" :fill="`url(#spark-${index})`" />
          <path d="M1 34 C8 25 13 48 20 27 S31 26 36 29 S43 13 51 22 S62 22 66 11 S77 6 83 10" fill="none" stroke="currentColor" stroke-opacity=".5" />
        </svg>
      </component>
    </section>

    <section class="rank-grid">
      <div class="rank-panel">
        <div class="panel-head"><h2>客户业务排行</h2><RouterLink to="/customers">查看更多 <el-icon><ArrowRight /></el-icon></RouterLink></div>
        <div class="customer-table">
          <div class="table-head customer-row"><span>排名</span><span>客户名称</span><span class="count-heading">电路数量</span></div>
          <RouterLink v-for="(item, index) in customerRanking" :key="item.id" :to="`/customers/${item.id}`" class="customer-row data-row">
            <span class="rank-number" :class="`rank-number--${index + 1}`">{{ index + 1 }}</span>
            <span class="customer-name" :title="item.name">{{ item.name }}</span>
            <span class="bar-track"><span :style="{ width: item.percent + '%' }" /></span>
            <strong>{{ item.count }}</strong>
          </RouterLink>
          <el-empty v-if="!customerRanking.length" description="暂无客户数据" />
        </div>
      </div>

      <div class="rank-panel">
        <div class="panel-head"><h2>电路类型分布</h2><RouterLink to="/circuits">查看更多 <el-icon><ArrowRight /></el-icon></RouterLink></div>
        <div class="distribution">
          <div class="distribution-chart">
            <div class="donut" role="img" :aria-label="`电路总数 ${circuits.length}`">
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="78" fill="none" stroke="#edf2f9" stroke-width="32" />
                <circle v-for="segment in donutSegments" :key="segment.name" cx="100" cy="100" r="78" fill="none" :stroke="segment.color" stroke-width="32" :stroke-dasharray="segment.dash" :stroke-dashoffset="segment.offset" transform="rotate(-90 100 100)" />
              </svg>
              <div class="donut-label"><strong>{{ circuits.length }}</strong><span>电路总数</span></div>
            </div>
            <div class="chart-legend">
              <div v-for="item in typeLegend" :key="item.name"><i :style="{ background: item.color }" /><span>{{ item.name }}</span><em>{{ item.share }}%</em></div>
            </div>
          </div>
          <div class="type-table">
            <div class="table-head type-row"><span>类型</span><span class="count-heading">数量</span></div>
            <div v-for="item in circuitTypeRanking" :key="item.name" class="type-row data-row">
              <span>{{ item.name }}</span><span class="bar-track"><span :style="{ width: item.percent + '%', background: item.color }" /></span><strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="status-panel">
      <div class="panel-head"><h2>服务状态</h2><p>监控核心服务运行状态，确保系统稳定可用。</p></div>
      <div class="status-grid">
        <div v-for="item in accessRows" :key="item.key" class="status-item">
          <span class="service-icon"><el-icon><component :is="item.key === 'data' ? Coin : item.key === 'mobile' ? Iphone : Monitor" /></el-icon></span>
          <div class="service-copy"><strong>{{ item.name }}</strong><div><span class="service-port">{{ item.port }}</span><a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.url }}</a></div></div>
          <span class="service-status" :class="{ 'service-status--online': item.online }"><i />{{ item.status }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowRight, Avatar, Coin, Document, Connection, Clock, Iphone, Monitor } from '@element-plus/icons-vue';
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
const circuitTypes = ['IPRAN', '互联网专线', '语音中继', 'OTN', '裸纤', '其他', 'FTTH', 'MSTP', 'SDH', 'STN'];
const typeColors = ['#2c80ff', '#14c599', '#ffab26', '#8b55ff', '#c6d0e1', '#c6d0e1', '#a5b6ed', '#a5b6ed', '#a5b6ed', '#a5b6ed'];

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
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const max = Math.max(...rows.map((item) => item.count), 1);
  return rows.map((item) => ({
    ...item,
    percent: getPercent(item.count, max),
    color: typeColors[circuitTypes.indexOf(item.name)] || '#c6d0e1'
  }));
});

const metricCards = computed(() => [
  { label: '客户资料', value: stats.customers, icon: Avatar, path: '/customers', note: '已收录客户单位' },
  { label: '电路资料', value: stats.circuits, icon: Document, path: '/circuits', note: '已收录电路资源' },
  { label: '组网拓扑', value: stats.topologies, icon: Connection, path: '/topologies', note: '已建立组网拓扑' },
  { label: '备份记录', value: backups.value.length, icon: Coin, path: '/data', note: '已保存数据备份' },
  { label: '最近更新', value: latestUpdate.value, icon: Clock, path: '', note: '系统数据最后更新时间' }
]);

const typeLegend = computed(() => {
  const active = circuitTypeRanking.value.filter(item => item.count > 0);
  const leading = active.filter(item => item.name !== '其他').slice(0, 4);
  const remaining = circuits.value.length - leading.reduce((sum, item) => sum + item.count, 0);
  return [...leading, { name: '其他', count: remaining, color: '#c6d0e1' }]
    .map(item => ({ ...item, share: Number(((item.count / (circuits.value.length || 1)) * 100).toFixed(1)) }));
});

const donutSegments = computed(() => {
  const circumference = 2 * Math.PI * 78;
  let offset = 0;
  return typeLegend.value.map(item => {
    const length = item.count / (circuits.value.length || 1) * circumference;
    const segment = { ...item, dash: `${Math.max(0, length - 1.5)} ${circumference}`, offset: -offset };
    offset += length;
    return segment;
  });
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
  return Math.max(3, Math.round((value / max) * 89));
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
.dashboard { display: flex; flex-direction: column; gap: 18px; color: #101b3c; }
.dashboard-hero { position: relative; display: flex; flex-direction: column; justify-content: flex-end; height: 156px; flex-shrink: 0; padding: 0 13px 8px; isolation: isolate; }
.dashboard-hero::before { position: absolute; z-index: -1; content: ''; inset: 0 -18px -58px 35%; background: url('../assets/dashboard-hero.svg') right top / auto 260px no-repeat; pointer-events: none; }
h1 { margin: 0 0 4px; color: #070e2c; font-size: 32px; font-weight: 750; line-height: 1.4; letter-spacing: 1px; }
.dashboard-hero p { margin: 0; color: #536281; font-size: 16px; line-height: 24px; }
.metric-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.metric-card { position: relative; display: flex; gap: 21px; min-width: 0; height: 124px; padding: 18px; border: 1px solid #e4ebf6; border-radius: 11px; background: #ffffffed; box-shadow: 0 4px 14px #3b537a03; text-align: left; color: #2d80ff; }
button.metric-card { cursor: pointer; }
button.metric-card:hover { border-color: #adcaff; box-shadow: 0 4px 18px #287bff10; }
.metric-card--1 { color: #12bf7c; }.metric-card--2 { color: #ff8918; }.metric-card--3 { color: #ff326d; }.metric-card--4 { color: #974cff; }
.metric-icon { display: grid; place-items: center; width: 53px; height: 53px; flex-shrink: 0; border-radius: 14px; background: linear-gradient(145deg, color-mix(in srgb, currentColor 24%, white), color-mix(in srgb, currentColor 12%, white)); box-shadow: inset 0 1px 10px #ffffff77; }
.metric-icon .el-icon { font-size: 31px; filter: drop-shadow(0 2px 2px #ffffffaa); }
.metric-copy { position: relative; z-index: 1; display: flex; flex-direction: column; min-width: 0; }
.metric-label { color: #536388; font-size: 14px; font-weight: 600; line-height: 23px; }
.metric-copy strong { margin-top: 6px; color: #080e31; font-size: 30px; font-weight: 750; line-height: 34px; letter-spacing: -.8px; white-space: nowrap; }
.metric-copy small { margin-top: 7px; color: #8391ad; font-size: 12px; line-height: 17px; white-space: nowrap; }
.metric-copy .metric-card__time { margin-top: 10px; font-size: 21px; letter-spacing: -.6px; line-height: 26px; }
.sparkline { position: absolute; right: 16px; bottom: 12px; width: 82px; height: 52px; opacity: .85; }
.rank-grid { display: grid; grid-template-columns: minmax(0, 1.205fr) minmax(0, 1fr); gap: 12px; }
.rank-panel, .status-panel { border: 1px solid #e4ebf6; border-radius: 11px; background: #ffffffed; box-shadow: 0 4px 16px #3b537a03; }
.rank-panel { min-width: 0; height: 466px; padding: 0 17px 17px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; height: 57px; gap: 18px; }
.panel-head h2 { position: relative; margin: 0; padding-left: 22px; color: #0a1230; font-size: 19px; line-height: 24px; font-weight: 750; white-space: nowrap; }
.panel-head h2::before { position: absolute; left: 0; top: 2px; width: 5px; height: 20px; content: ''; border-radius: 4px; background: linear-gradient(#62a6ff, #266bff); }
.panel-head > a { display: flex; align-items: center; gap: 10px; color: #7a88a3; font-size: 13px; font-weight: 600; text-decoration: none; }
.panel-head > a:hover { color: #2c80ff; }
.table-head { height: 33px; border-radius: 7px 7px 0 0; background: #f5f7fb; color: #8390a7; font-size: 11px; font-weight: 600; }
.customer-row { display: grid; grid-template-columns: 58px minmax(0, 1fr) 26% 45px; align-items: center; gap: 0; padding: 0 14px; }
.count-heading { grid-column: -3 / -1; text-align: right; }
.data-row { min-width: 0; height: 35.7px; border-bottom: 1px solid #f3f5f9; color: #192849; font-size: 13px; text-decoration: none; }
a.data-row:hover { background: #f6f9ff; }
.data-row strong { font-size: 13px; font-weight: 650; text-align: right; }
.customer-name { overflow: hidden; padding-right: 15px; text-overflow: ellipsis; white-space: nowrap; }
.rank-number { display: grid; place-items: center; width: 29px; height: 21px; border-radius: 9px; background: linear-gradient(#e2e7ee, #edf0f5); color: #445476; font-size: 14px; }
.rank-number--1 { color: #fff; background: linear-gradient(120deg, #ffd34c, #ffb311); }.rank-number--2 { color: #fff; background: linear-gradient(120deg, #d0d9e6, #adb9cc); }.rank-number--3 { color: #fff; background: linear-gradient(120deg, #f9c69a, #ee9b62); }
.bar-track { display: block; height: 12px; overflow: hidden; border-radius: 4px; background: linear-gradient(90deg, #edf1f7, #f1f4f8); }
.bar-track > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2779ff, #35a0ff); }
.distribution { display: grid; grid-template-columns: 37% minmax(0, 1fr); gap: 19px; }
.distribution-chart { min-width: 0; padding-top: 17px; }
.donut { position: relative; width: 100%; max-width: 200px; aspect-ratio: 1; margin: 0 auto; }
.donut svg { display: block; width: 100%; height: 100%; }
.donut-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px; }
.donut-label strong { font-size: 30px; color: #060e2e; line-height: 38px; }.donut-label span { font-size: 13px; color: #8090ac; }
.chart-legend { max-width: 185px; display: flex; flex-direction: column; gap: 13px; margin: 26px auto 0; padding: 0 4px; }
.chart-legend > div { display: flex; align-items: center; gap: 10px; font-size: 13px; }.chart-legend i { width: 10px; height: 10px; border-radius: 4px; flex-shrink: 0; }.chart-legend em { margin-left: auto; color: #52668e; font-style: normal; }
.type-row { display: grid; grid-template-columns: 96px minmax(0, 1fr) 55px; align-items: center; padding: 0 17px; }.type-row.data-row { height: 34.3px; }.type-row .bar-track { height: 12px; }
.status-panel { padding: 0 17px 12px; }.status-panel .panel-head { justify-content: flex-start; height: 49px; }.status-panel h2::before { background: linear-gradient(#35d9b2, #0abd8c); }.panel-head p { margin: 0; color: #8a98b3; font-size: 12px; }
.status-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.status-item { display: flex; align-items: center; gap: 18px; height: 71px; min-width: 0; padding: 8px 15px; border: 1px solid #e9edf6; border-radius: 10px; }
.service-icon { display: grid; place-items: center; width: 51px; height: 51px; flex-shrink: 0; border: 1px solid #e1ecff; border-radius: 13px; background: #eaf2ff; color: #287eff; font-size: 31px; }
.service-copy { min-width: 0; flex: 1; }.service-copy > strong { display: block; margin-bottom: 5px; color: #101b36; font-size: 13px; }.service-copy > div { display: flex; align-items: center; min-width: 0; gap: 17px; }.service-port { color: #287eff; font-size: 22px; line-height: 24px; font-weight: 650; }.service-copy a { overflow: hidden; padding-left: 17px; border-left: 1px solid #cbd5e6; color: #8392af; font-size: 12px; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
.service-status { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding: 6px 13px; border: 1px solid #e1e6ee; border-radius: 12px; background: #f8fafc; color: #8692a5; font-size: 13px; white-space: nowrap; }.service-status i { width: 9px; height: 9px; border-radius: 50%; background: currentColor; }.service-status--online { color: #0abb4d; border-color: #cbefd3; background: #f5fff7; }
@media (min-width: 1800px) { .rank-panel { height: 500px; }.data-row { height: 39px; }.type-row.data-row { height: 38px; } }
@media (max-width: 1400px) { .metric-card { gap: 12px; padding: 16px 12px; }.metric-icon { width: 44px; height: 48px; }.metric-copy .metric-card__time { font-size: 15px; }.metric-card--4 { gap: 8px; }.metric-card--4 .metric-icon { width: 32px; }.metric-card--4 .metric-icon .el-icon { font-size: 23px; }.sparkline { width: 60px; right: 10px; }.distribution { grid-template-columns: 36% minmax(0, 1fr); gap: 10px; }.type-row { grid-template-columns: 76px minmax(0, 1fr) 30px; padding: 0 10px; }.status-item { gap: 10px; padding: 8px; }.service-copy > div { gap: 9px; }.service-copy a { padding-left: 9px; }.service-status { gap: 6px; padding: 6px 8px; } }
@media (max-width: 1150px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }.rank-grid { grid-template-columns: 1fr; }.status-grid { grid-template-columns: 1fr; }.metric-copy .metric-card__time { font-size: 20px; }.distribution { grid-template-columns: 220px minmax(0, 1fr); }.dashboard-hero::before { opacity: .6; }.rank-panel { height: auto; min-height: 466px; } }
</style>
