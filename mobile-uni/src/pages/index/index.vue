<template>
  <view
    class="home"
    @touchstart="handleRefreshTouchStart"
    @touchmove="handleRefreshTouchMove"
    @touchend="handleRefreshTouchEnd"
    @touchcancel="handleRefreshTouchEnd"
  >
    <view v-if="refreshTipVisible" class="refresh-tip">{{ refreshTipText }}</view>

    <view class="hero">
      <view class="hero__shade" />

      <view class="topbar">
        <view class="brand">
          <text class="brand__title">工作台</text>
        </view>
      </view>

      <view class="search">
        <view class="search__icon" />
        <input
          v-model="searchKeyword"
          class="search__input"
          placeholder="搜索客户、电路编号、IP 地址"
          placeholder-class="search__placeholder"
          confirm-type="search"
        />
        <text v-if="searchKeyword" class="search__clear" @tap="clearSearch">×</text>
      </view>

      <view v-if="showSearchPanel" class="search-panel">
        <view
          v-for="item in searchResults"
          :key="item.key"
          class="search-panel__item"
          @tap="openSearchResult(item)"
        >
          <view class="search-panel__main">
            <text class="search-panel__title">{{ item.title }}</text>
            <text class="search-panel__meta">{{ item.meta }}</text>
          </view>
          <text class="search-panel__tag">{{ item.type }}</text>
        </view>
        <view v-if="!searchResults.length" class="search-panel__empty">
          <text class="search-panel__empty-text">无匹配结果</text>
        </view>
      </view>

      <view class="hero-card">
        <view class="hero-card__copy">
          <text class="hero-card__label">电路档案总数</text>
          <view class="hero-card__value-row">
            <text class="hero-card__value">{{ circuitCount || 0 }}</text>
            <text class="hero-card__unit">条</text>
          </view>
        </view>
        <view class="ledger-summary">
          <view class="ledger-summary__item">
            <text class="ledger-summary__value">{{ customerCount || 0 }}</text>
            <text class="ledger-summary__label">客户</text>
          </view>
          <view class="ledger-summary__line" />
          <view class="ledger-summary__item">
            <text class="ledger-summary__value">{{ circuitTypeCount || 0 }}</text>
            <text class="ledger-summary__label">类型</text>
          </view>
        </view>
      </view>
    </view>

    <view class="content">
      <view class="section">
        <view class="section__head">
          <text class="section__title">快捷处理</text>
          <text class="section__more" @tap="goTo('/pages/circuit/list/index')">全部</text>
        </view>
        <view class="actions">
          <view
            v-for="action in quickActions"
            :key="action.label"
            class="action"
            @tap="goTo(action.url)"
          >
            <view class="action__icon" :class="action.icon">
              <view class="action__glyph" />
            </view>
            <text class="action__label">{{ action.label }}</text>
          </view>
        </view>
      </view>

      <view class="overview">
        <view class="overview__head">
          <text class="overview__title">今日概览</text>
          <text class="overview__time">{{ currentDate }}</text>
        </view>
        <view class="overview__items">
          <view v-for="item in pulseItems" :key="item.title" class="overview__item">
            <text class="overview__value">{{ item.value }}</text>
            <text class="overview__label">{{ item.title }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <text class="section__title">最近客户</text>
          <text class="section__more" @tap="goTo('/pages/customer/list/index')">查看</text>
        </view>
        <view class="customer-list">
          <view
            v-for="customer in recentCustomers"
            :key="customer.id"
            class="customer"
            @tap="goTo(`/pages/customer/detail/index?id=${customer.id}`)"
          >
            <view class="customer__mark">
              <text class="customer__initial">{{ customer.initial }}</text>
            </view>
            <view class="customer__main">
              <text class="customer__name">{{ customer.name }}</text>
              <text class="customer__meta">{{ customer.meta }}</text>
            </view>
            <view class="customer__badge">
              <text class="customer__badge-text">{{ customer.circuitText }}</text>
            </view>
          </view>
          <view v-if="!recentCustomers.length" class="empty">
            <text class="empty__title">暂无客户数据</text>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchCustomers } from '@/api/customer';
import { fetchCircuits } from '@/api/circuit';
import { usePullRefresh } from '@/utils/pull-refresh';
import type { Customer } from '@/types/customer';
import type { Circuit } from '@/types/circuit';

const customers = ref<Customer[]>([]);
const circuits = ref<Circuit[]>([]);
const searchKeyword = ref('');

type SearchResult = {
  key: string;
  id: number;
  type: '客户' | '电路';
  title: string;
  meta: string;
};

const quickActions = [
  {
    label: '新增客户',
    url: '/pages/customer/form/index',
    icon: 'action__icon--customer'
  },
  {
    label: '新建电路',
    url: '/pages/circuit/form/index',
    icon: 'action__icon--circuit'
  }
];

const currentDate = computed(() => {
  const date = new Date();
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});

const customerCount = computed(() => customers.value.length);
const circuitCount = computed(() => circuits.value.length);
const circuitTypeCount = computed(() => {
  return new Set(circuits.value.map((item) => item.circuit_type).filter(Boolean)).size;
});

const normalizedKeyword = computed(() => searchKeyword.value.trim().toLowerCase());

const showSearchPanel = computed(() => normalizedKeyword.value.length > 0);

const searchResults = computed<SearchResult[]>(() => {
  const keyword = normalizedKeyword.value;
  if (!keyword) {
    return [];
  }

  const customerResults = customers.value
    .filter((customer) => {
      return [
        customer.name,
        customer.contact_person,
        customer.contact_phone,
        customer.account_manager
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    })
    .slice(0, 4)
    .map((customer) => ({
      key: `customer-${customer.id}`,
      id: customer.id,
      type: '客户' as const,
      title: customer.name,
      meta: customer.contact_person || customer.account_manager || '客户资料'
    }));

  const circuitResults = circuits.value
    .filter((circuit) => {
      return [
        circuit.circuit_name,
        circuit.circuit_number,
        circuit.local_ip,
        circuit.remote_ip,
        circuit.Customer?.name
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    })
    .slice(0, 5)
    .map((circuit) => ({
      key: `circuit-${circuit.id}`,
      id: circuit.id,
      type: '电路' as const,
      title: circuit.circuit_name,
      meta: circuit.circuit_number || circuit.Customer?.name || '电路资料'
    }));

  return [...customerResults, ...circuitResults].slice(0, 8);
});

const pulseItems = computed(() => [
  {
    title: '客户资料',
    value: `${customerCount.value || 0} 项`
  },
  {
    title: '电路档案',
    value: `${circuitCount.value || 0} 条`
  }
]);

const recentCustomers = computed(() => {
  return customers.value.slice(0, 4).map((customer) => {
    const circuitTotal = customer.Circuits?.length ?? 0;
    return {
      id: customer.id,
      name: customer.name,
      initial: customer.name.slice(0, 1),
      meta: customer.account_manager
        ? `${customer.account_manager} 负责`
        : formatDate(customer.latest_check_date || customer.updated_at),
      circuitText: circuitTotal ? `${circuitTotal} 条` : '未绑定'
    };
  });
});

const tabPages = new Set([
  '/pages/index/index',
  '/pages/customer/list/index',
  '/pages/circuit/list/index'
]);

function goTo(url: string) {
  if (tabPages.has(url)) {
    uni.switchTab({ url });
    return;
  }

  uni.navigateTo({ url });
}

function clearSearch() {
  searchKeyword.value = '';
}

function openSearchResult(item: SearchResult) {
  clearSearch();
  const url =
    item.type === '客户'
      ? `/pages/customer/detail/index?id=${item.id}`
      : `/pages/circuit/detail/index?id=${item.id}`;
  goTo(url);
}

function formatDate(value: string | null) {
  if (!value) {
    return '待完善资料';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '最近更新';
  }

  return `${date.getMonth() + 1}月${date.getDate()}日更新`;
}

async function loadSummary() {
  try {
    const [customerData, circuitData] = await Promise.all([fetchCustomers(), fetchCircuits()]);
    customers.value = customerData;
    circuits.value = circuitData;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : '数据加载失败';
    uni.showToast({ title: message, icon: 'none' });
    return false;
  }
}

const {
  refreshTipVisible,
  refreshTipText,
  handleRefreshTouchStart,
  handleRefreshTouchMove,
  handleRefreshTouchEnd,
  runRefresh
} = usePullRefresh(loadSummary);

onShow(() => {
  loadSummary();
});

onPullDownRefresh(() => {
  runRefresh();
});
</script>

<style scoped lang="scss">
.home {
  min-height: 100%;
  box-sizing: border-box;
  background: var(--cm-bg);
  color: var(--cm-text);
  padding-bottom: 132rpx;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: calc(28rpx + env(safe-area-inset-top)) 32rpx 36rpx;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(255, 255, 255, 0) 42%),
    var(--cm-bg);
  border-bottom: 1rpx solid rgba(22, 32, 51, 0.04);
}

.hero__shade {
  position: absolute;
  right: -120rpx;
  top: -120rpx;
  width: 360rpx;
  height: 360rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.14), transparent 62%);
  pointer-events: none;
}

.topbar,
.search,
.hero-card {
  position: relative;
  z-index: 1;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.brand {
  display: flex;
  flex-direction: column;
}

.brand__title {
  color: var(--cm-text);
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.12;
}

.search {
  display: flex;
  align-items: center;
  gap: 18rpx;
  height: 84rpx;
  margin-top: 34rpx;
  padding: 0 26rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 42rpx;
  background: var(--cm-surface);
  box-shadow: 0 12rpx 28rpx rgba(25, 43, 78, 0.06);
}

.search__icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid var(--cm-muted);
  border-radius: 50%;
}

.search__icon::after {
  content: '';
  position: absolute;
  right: -10rpx;
  bottom: -8rpx;
  width: 14rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: var(--cm-muted);
  transform: rotate(45deg);
}

.search__input {
  min-width: 0;
  flex: 1;
  height: 84rpx;
  color: var(--cm-text);
  font-size: 27rpx;
}

.search__placeholder {
  color: #9aa3b2;
}

.search__clear {
  width: 44rpx;
  height: 44rpx;
  flex: 0 0 44rpx;
  color: var(--cm-muted);
  font-size: 38rpx;
  line-height: 40rpx;
  text-align: center;
}

.search-panel {
  position: relative;
  z-index: 3;
  overflow: hidden;
  margin-top: 18rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 24rpx;
  background: var(--cm-surface);
  box-shadow: 0 18rpx 50rpx rgba(25, 43, 78, 0.12);
}

.search-panel__item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 92rpx;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #eef0ec;
}

.search-panel__item:last-child {
  border-bottom: 0;
}

.search-panel__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.search-panel__title,
.search-panel__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-panel__title {
  color: var(--cm-text);
  font-size: 27rpx;
  font-weight: 800;
  line-height: 1.2;
}

.search-panel__meta {
  color: #7b827d;
  font-size: 22rpx;
  line-height: 1.2;
}

.search-panel__tag {
  flex: 0 0 auto;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
  font-size: 21rpx;
  font-weight: 700;
  line-height: 1.2;
}

.search-panel__empty {
  min-height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-panel__empty-text {
  color: #7b827d;
  font-size: 25rpx;
  line-height: 1.2;
}

.hero-card {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28rpx;
  margin-top: 34rpx;
  padding: 34rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.16);
  border-radius: 32rpx;
  background:
    linear-gradient(118deg, rgba(255, 255, 255, 0) 0 58%, rgba(37, 99, 235, 0.08) 58% 100%),
    repeating-linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0 2rpx, rgba(37, 99, 235, 0) 2rpx 18rpx),
    linear-gradient(180deg, #ffffff 0%, #edf5ff 100%);
  box-shadow: 0 22rpx 52rpx rgba(37, 99, 235, 0.14);
}

.hero-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 8rpx;
  background: linear-gradient(90deg, #2563eb 0%, #22c55e 52%, #f59e0b 100%);
}

.hero-card::after {
  content: '';
  position: absolute;
  right: 20rpx;
  bottom: 18rpx;
  width: 164rpx;
  height: 46rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, rgba(37, 99, 235, 0.08), rgba(34, 197, 94, 0.08));
  transform: skewX(-18deg);
}

.hero-card__copy {
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.hero-card__label {
  align-self: flex-start;
  padding: 8rpx 14rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.14);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
  color: var(--cm-primary);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.2;
}

.hero-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  margin-top: 20rpx;
}

.hero-card__value {
  color: var(--cm-primary);
  font-size: 74rpx;
  font-weight: 800;
  line-height: 0.95;
}

.hero-card__unit {
  color: var(--cm-muted);
  font-size: 28rpx;
  font-weight: 700;
}

.ledger-summary {
  position: relative;
  z-index: 1;
  width: 154rpx;
  min-height: 154rpx;
  flex: 0 0 154rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.14);
  border-radius: 28rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(234, 242, 255, 0.9) 100%);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.8), 0 12rpx 28rpx rgba(37, 99, 235, 0.08);
}

.ledger-summary__item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ledger-summary__line {
  width: 86rpx;
  height: 1rpx;
  background: rgba(37, 99, 235, 0.14);
}

.ledger-summary__value {
  color: var(--cm-primary);
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1;
}

.ledger-summary__label {
  margin-top: 6rpx;
  color: var(--cm-muted);
  font-size: 20rpx;
  line-height: 1;
}

.content {
  padding: 0 28rpx;
}

.section {
  margin-top: 34rpx;
}

.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.section__title {
  color: var(--cm-text);
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.2;
}

.section__more,
.section__time {
  color: #7b827d;
  font-size: 24rpx;
  line-height: 1.2;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.action {
  min-height: 148rpx;
  padding: 26rpx;
  border: 1rpx solid rgba(24, 36, 34, 0.06);
  border-radius: 26rpx;
  background: var(--cm-surface);
  box-shadow: 0 14rpx 34rpx rgba(28, 44, 40, 0.06);
}

.action__icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
}

.action__glyph {
  position: relative;
  width: 30rpx;
  height: 30rpx;
}

.action__icon--customer { background: #e5f7ef; }
.action__icon--circuit { background: #e8f0ff; }

.action__icon--customer .action__glyph {
  border: 5rpx solid #059669;
  border-radius: 50%;
}

.action__icon--customer .action__glyph::after {
  content: '';
  position: absolute;
  left: -8rpx;
  right: -8rpx;
  bottom: -15rpx;
  height: 16rpx;
  border: 5rpx solid #059669;
  border-top: 0;
  border-radius: 0 0 18rpx 18rpx;
}

.action__icon--circuit .action__glyph::before,
.action__icon--circuit .action__glyph::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 6rpx;
  border-radius: 6rpx;
  background: #2563eb;
}

.action__icon--circuit .action__glyph::before { top: 6rpx; }
.action__icon--circuit .action__glyph::after { bottom: 6rpx; }

.action__label {
  display: block;
  color: var(--cm-text);
  font-size: 29rpx;
  font-weight: 800;
  line-height: 1.2;
}

.overview {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 30rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.12);
  border-radius: 26rpx;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(255, 255, 255, 0) 54%),
    var(--cm-surface);
  box-shadow: 0 14rpx 34rpx rgba(25, 43, 78, 0.06);
}

.overview__head {
  flex: 0 0 132rpx;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.overview__title {
  color: var(--cm-text);
  font-size: 29rpx;
  font-weight: 800;
  line-height: 1.2;
}

.overview__time {
  color: var(--cm-muted);
  font-size: 22rpx;
  line-height: 1.2;
}

.overview__items {
  min-width: 0;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10rpx;
}

.overview__item {
  min-width: 0;
  padding: 14rpx 8rpx;
  border-radius: 18rpx;
  background: rgba(245, 247, 251, 0.88);
  text-align: center;
}

.overview__value {
  display: block;
  overflow: hidden;
  color: var(--cm-primary);
  font-size: 25rpx;
  font-weight: 800;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview__label {
  display: block;
  overflow: hidden;
  margin-top: 8rpx;
  color: var(--cm-muted);
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-list {
  overflow: hidden;
  border: 1rpx solid rgba(24, 36, 34, 0.06);
  border-radius: 26rpx;
  background: var(--cm-surface);
  box-shadow: 0 14rpx 34rpx rgba(28, 44, 40, 0.05);
}

.customer {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 96rpx;
  padding: 24rpx 26rpx;
  border-bottom: 1rpx solid #eef0ec;
}

.customer:last-child {
  border-bottom: 0;
}

.customer__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.customer__name {
  overflow: hidden;
  color: var(--cm-text);
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer__meta {
  overflow: hidden;
  color: #7b827d;
  font-size: 23rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer__mark {
  width: 68rpx;
  height: 68rpx;
  flex: 0 0 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #ecfdf5;
}

.customer__initial {
  color: #047857;
  font-size: 28rpx;
  font-weight: 800;
}

.customer__badge {
  flex: 0 0 auto;
  max-width: 132rpx;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
  background: #f2f5f1;
}

.customer__badge-text {
  display: block;
  overflow: hidden;
  color: #55615b;
  font-size: 22rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180rpx;
  padding: 30rpx;
}

.empty__title {
  color: var(--cm-text);
  font-size: 28rpx;
  font-weight: 800;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .home {
    max-width: 520px;
    margin: 0 auto;
    box-shadow: 0 0 0 1px rgba(24, 36, 34, 0.06);
  }
}
</style>
