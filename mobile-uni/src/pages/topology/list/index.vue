<template>
  <view class="page">
    <view class="header">
      <view class="header__main">
        <text class="header__count">{{ topologies.length }} 个拓扑</text>
        <text v-if="customerName" class="header__customer">{{ customerName }}</text>
      </view>
      <view class="header__add" @tap="addTopology" aria-label="新增拓扑">
        <text class="header__add-icon">＋</text>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="empty-tip">
      <text class="empty-tip__text">正在加载...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="topologies.length === 0" class="empty-tip">
      <text class="empty-tip__text">暂无拓扑</text>
      <text class="empty-tip__sub">点击右上角「+ 新增」创建第一个拓扑</text>
    </view>

    <!-- 列表 -->
    <view v-else class="list">
      <view
        v-for="(topo, index) in topologies"
        :key="topo.id"
        class="list-item"
        :class="{ 'list-item--last': index === topologies.length - 1 }"
        @tap="openTopology(topo.id)"
      >
        <view class="list-item__main">
          <text class="list-item__name">{{ topo.topology_name }}</text>
          <view class="list-item__meta-row">
            <text class="list-item__stat">{{ topo.Devices?.length || 0 }} 台设备</text>
            <text class="list-item__dot">·</text>
            <text class="list-item__stat">{{ topo.Connections?.length || 0 }} 条连接</text>
          </view>
          <text v-if="topo.description" class="list-item__desc">{{ topo.description }}</text>
        </view>
        <text class="list-item__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { fetchTopologies } from '@/api/topology';
import type { Topology } from '@/types/topology';

const loading = ref(false);
const topologies = ref<Topology[]>([]);
const customerId = ref(0);
const customerName = ref('');

function addTopology() {
  uni.navigateTo({ url: `/pages/topology/form/index?customer_id=${customerId.value}` });
}

function openTopology(id: number) {
  uni.navigateTo({ url: `/pages/topology/detail/index?id=${id}` });
}

async function loadTopologies() {
  if (!customerId.value) return;
  loading.value = true;
  try {
    topologies.value = await fetchTopologies(customerId.value);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '加载失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  customerId.value = Number(query?.customer_id) || 0;
  customerName.value = decodeURIComponent(query?.customer_name || '');
});

onShow(() => {
  loadTopologies();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-bg);
  padding: 28rpx 28rpx 96rpx;
  box-sizing: border-box;
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

.header__customer {
  display: block;
  overflow: hidden;
  color: var(--cm-text);
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 空状态 */
.empty-tip {
  padding: 96rpx 32rpx;
  text-align: center;
}

.empty-tip__text {
  display: block;
  font-size: 30rpx;
  color: var(--cm-muted);
}

.empty-tip__sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--cm-muted);
}

/* 列表 */
.list {
  overflow: hidden;
  padding: 0 24rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 24rpx;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
}

.list-item {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid var(--cm-border);
  gap: 16rpx;
}

.list-item--last {
  border-bottom: none;
}

.list-item__main {
  min-width: 0;
  flex: 1;
}

.list-item__name {
  display: block;
  overflow: hidden;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--cm-text);
  margin-bottom: 8rpx;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__meta-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.list-item__stat {
  font-size: 24rpx;
  color: var(--cm-muted);
}

.list-item__dot {
  font-size: 24rpx;
  color: var(--cm-border);
}

.list-item__desc {
  display: block;
  overflow: hidden;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: var(--cm-muted);
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__arrow {
  font-size: 36rpx;
  color: #98a2b3;
  flex-shrink: 0;
}
</style>
