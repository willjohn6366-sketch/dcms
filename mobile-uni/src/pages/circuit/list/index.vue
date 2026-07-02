<template>
  <view
    class="page"
    @touchstart="handleRefreshTouchStart"
    @touchmove="handleRefreshTouchMove"
    @touchend="handleRefreshTouchEnd"
    @touchcancel="handleRefreshTouchEnd"
  >
    <view v-if="refreshTipVisible" class="refresh-tip">{{ refreshTipText }}</view>

    <view class="header">
      <view class="header__main">
        <text class="header__count">{{ visibleCircuits.length }} 条记录</text>
      </view>
      <view class="header__add" @tap="addCircuit" aria-label="新增电路">
        <text class="header__add-icon">＋</text>
      </view>
    </view>

    <view class="search">
      <view class="search__icon" />
      <input
        v-model="keyword"
        class="search__input"
        placeholder="名称 / 编号 / IP / 客户"
        placeholder-class="search__placeholder"
        confirm-type="search"
        @confirm="loadCircuits"
      />
      <text v-if="keyword" class="search__clear" @tap="clearSearch">×</text>
    </view>

    <scroll-view v-if="circuitTypes.length" class="filters" scroll-x>
      <view class="filters__inner">
        <view
          v-for="type in circuitTypes"
          :key="type"
          class="filter"
          :class="{ 'filter--active': selectedType === type }"
          @tap="selectType(type)"
        >
          <text class="filter__text">{{ type }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="loading" class="empty-tip">
      <text class="empty-tip__text">正在加载...</text>
    </view>

    <view v-else-if="visibleCircuits.length === 0" class="empty-tip">
      <text class="empty-tip__text">暂无电路数据</text>
    </view>

    <view v-else class="list">
      <view
        v-for="circuit in visibleCircuits"
        :key="circuit.id"
        class="circuit-card"
        @tap="openDetail(circuit.id)"
      >
        <view class="circuit-card__head">
          <view class="circuit-card__title-wrap">
            <text class="circuit-card__name">{{ circuit.circuit_name }}</text>
            <text class="circuit-card__number">{{ circuit.circuit_number || '未填编号' }}</text>
          </view>
          <view class="circuit-card__type">
            <text class="circuit-card__type-text">{{ circuit.circuit_type || '未分类' }}</text>
          </view>
        </view>

        <view class="circuit-card__grid">
          <view class="circuit-card__field">
            <text class="circuit-card__label">客户</text>
            <text class="circuit-card__value">{{ circuit.Customer?.name || '未绑定' }}</text>
          </view>
          <view class="circuit-card__field">
            <text class="circuit-card__label">带宽</text>
            <text class="circuit-card__value">{{ circuit.bandwidth || '未填写' }}</text>
          </view>
        </view>

        <view class="circuit-card__foot">
          <text class="circuit-card__ip">{{ formatIp(circuit) }}</text>
          <text class="circuit-card__arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchCircuits } from '@/api/circuit';
import { usePullRefresh } from '@/utils/pull-refresh';
import type { Circuit } from '@/types/circuit';

const loading = ref(false);
const keyword = ref('');
const selectedType = ref<NonNullable<Circuit['circuit_type']> | ''>('');
const circuits = ref<Circuit[]>([]);

const circuitTypes = computed(() => {
  const types = circuits.value
    .map((item) => item.circuit_type)
    .filter((type): type is NonNullable<Circuit['circuit_type']> => Boolean(type));
  return Array.from(new Set(types));
});

const visibleCircuits = computed(() => {
  if (!selectedType.value) {
    return circuits.value;
  }

  return circuits.value.filter((item) => item.circuit_type === selectedType.value);
});

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/circuit/detail/index?id=${id}` });
}

function addCircuit() {
  uni.navigateTo({ url: '/pages/circuit/form/index' });
}

function selectType(type: NonNullable<Circuit['circuit_type']>) {
  selectedType.value = selectedType.value === type ? '' : type;
}

function clearSearch() {
  keyword.value = '';
  loadCircuits();
}

function formatIp(circuit: Circuit) {
  const local = circuit.local_ip || '本端未填';
  const remote = circuit.remote_ip || '对端未填';
  return `${local} → ${remote}`;
}

async function loadCircuits() {
  loading.value = true;
  try {
    circuits.value = await fetchCircuits(keyword.value.trim());
    if (selectedType.value && !circuitTypes.value.includes(selectedType.value)) {
      selectedType.value = '';
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载失败';
    uni.showToast({ title: message, icon: 'none' });
    return false;
  } finally {
    loading.value = false;
  }
}

const {
  refreshTipVisible,
  refreshTipText,
  handleRefreshTouchStart,
  handleRefreshTouchMove,
  handleRefreshTouchEnd,
  runRefresh
} = usePullRefresh(loadCircuits);

onShow(() => {
  loadCircuits();
});

onPullDownRefresh(() => {
  runRefresh();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-bg);
  padding: 28rpx 28rpx 142rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.header__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.header__count {
  color: var(--cm-muted);
  font-size: 24rpx;
  line-height: 1.2;
}

.header__add {
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(37, 99, 235, 0.16);
  border-radius: 24rpx;
  background: linear-gradient(180deg, #ffffff 0%, #edf5ff 100%);
  box-shadow: 0 14rpx 30rpx rgba(37, 99, 235, 0.12);
}

.header__add-icon {
  color: var(--cm-primary);
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1;
}

.search {
  display: flex;
  align-items: center;
  gap: 18rpx;
  height: 86rpx;
  padding: 0 24rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 26rpx;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
}

.search__icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid #98a2b3;
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
  background: #98a2b3;
  transform: rotate(45deg);
}

.search__input {
  min-width: 0;
  flex: 1;
  height: 86rpx;
  color: var(--cm-text);
  font-size: 27rpx;
}

.search__placeholder {
  color: #9aa3b2;
}

.search__clear {
  width: 44rpx;
  height: 44rpx;
  color: var(--cm-muted);
  font-size: 38rpx;
  line-height: 40rpx;
  text-align: center;
}

.filters {
  width: 100%;
  margin: 22rpx 0 24rpx;
  white-space: nowrap;
}

.filters__inner {
  display: inline-flex;
  gap: 14rpx;
  min-width: 100%;
}

.filter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96rpx;
  height: 58rpx;
  padding: 0 22rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.78);
}

.filter--active {
  border-color: rgba(37, 99, 235, 0.18);
  background: var(--cm-primary-soft);
}

.filter__text {
  color: var(--cm-muted);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.2;
}

.filter--active .filter__text {
  color: var(--cm-primary);
}

.empty-tip {
  padding: 120rpx 32rpx;
  text-align: center;
}

.empty-tip__text {
  display: block;
  color: var(--cm-muted);
  font-size: 30rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.circuit-card {
  padding: 26rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 28rpx;
  background: var(--cm-surface);
  box-shadow: 0 14rpx 34rpx rgba(25, 43, 78, 0.07);
}

.circuit-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.circuit-card__title-wrap {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.circuit-card__name {
  overflow: hidden;
  color: var(--cm-text);
  font-size: 31rpx;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-card__number {
  overflow: hidden;
  color: var(--cm-muted);
  font-size: 23rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-card__type {
  flex: 0 0 auto;
  max-width: 168rpx;
  padding: 9rpx 14rpx;
  border-radius: 999rpx;
  background: var(--cm-primary-soft);
}

.circuit-card__type-text {
  display: block;
  overflow: hidden;
  color: var(--cm-primary);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.circuit-card__field {
  min-width: 0;
  padding: 18rpx;
  border-radius: 20rpx;
  background: #f8fbff;
}

.circuit-card__label {
  display: block;
  color: var(--cm-muted);
  font-size: 21rpx;
  line-height: 1.2;
}

.circuit-card__value {
  display: block;
  overflow: hidden;
  margin-top: 8rpx;
  color: var(--cm-text);
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-card__foot {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 22rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid var(--cm-border);
}

.circuit-card__ip {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--cm-muted);
  font-size: 23rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-card__arrow {
  flex: 0 0 auto;
  color: #b7c0ce;
  font-size: 36rpx;
  line-height: 1;
}
</style>
