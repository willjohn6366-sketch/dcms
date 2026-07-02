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
        <text class="header__count">{{ filteredCustomers.length }} 个客户</text>
      </view>
      <view class="header__add" @tap="addCustomer" aria-label="新增客户">
        <text class="header__add-icon">＋</text>
      </view>
    </view>

    <view class="search">
      <view class="search__icon" />
      <input
        v-model="keyword"
        class="search__input"
        placeholder="搜索客户名称"
        placeholder-class="search__placeholder"
        confirm-type="search"
      />
      <text v-if="keyword" class="search__clear" @tap="clearSearch">×</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="state">
      <text class="state__text">正在加载...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="filteredCustomers.length === 0" class="state">
      <text class="state__text">未查询到匹配客户</text>
      <text class="state__hint">请调整关键词后重新检索</text>
    </view>

    <!-- 列表 -->
    <view v-else class="list">
      <view
        v-for="customer in filteredCustomers"
        :key="customer.id"
        class="list-item"
        @tap="openDetail(customer.id)"
      >
        <view class="list-item__main">
          <view class="list-item__top">
            <text class="list-item__name">{{ customer.name }}</text>
            <view class="list-item__badge">
              <text class="list-item__badge-text">{{ customer.Circuits?.length || 0 }} 条</text>
            </view>
          </view>
          <text class="list-item__sub">
            {{ customer.contact_person || '联系人未填' }} · {{ customer.contact_phone || '电话未填' }}
          </text>
        </view>
        <text class="list-item__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { fetchCustomers } from '@/api/customer';
import { usePullRefresh } from '@/utils/pull-refresh';
import type { Customer } from '@/types/customer';

const loading = ref(false);
const keyword = ref('');
const customers = ref<Customer[]>([]);

const filteredCustomers = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return customers.value;
  return customers.value.filter((item) => item.name.toLowerCase().includes(q));
});

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/customer/detail/index?id=${id}` });
}

function addCustomer() {
  uni.navigateTo({ url: '/pages/customer/form/index' });
}

function clearSearch() {
  keyword.value = '';
}

async function loadCustomers() {
  loading.value = true;
  try {
    customers.value = await fetchCustomers();
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
} = usePullRefresh(loadCustomers);

onShow(() => {
  loadCustomers();
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

/* 状态 */
.state {
  padding: 120rpx 32rpx;
  text-align: center;
}

.state__text {
  display: block;
  font-size: 30rpx;
  color: var(--cm-muted);
}

.state__hint {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--cm-muted);
}

/* 列表 */
.list {
  margin-top: 24rpx;
  padding: 0 24rpx;
  background: var(--cm-surface);
  border-radius: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 118, 110, 0.05);
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 0;
  border-bottom: 1rpx solid var(--cm-border);
  gap: 16rpx;
}

.list-item__main {
  flex: 1;
  min-width: 0;
}

.list-item__top {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.list-item__name {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--cm-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__badge {
  flex-shrink: 0;
  padding: 4rpx 14rpx;
  background: rgba(15, 118, 110, 0.08);
  border-radius: 8rpx;
}

.list-item__badge-text {
  font-size: 22rpx;
  color: var(--cm-primary);
  font-weight: 600;
}

.list-item__sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--cm-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__arrow {
  flex-shrink: 0;
  font-size: 36rpx;
  color: var(--cm-border);
  line-height: 1;
}
</style>
