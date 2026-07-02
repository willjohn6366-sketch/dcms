<template>
  <view class="page">
    <view class="topbar">
      <view class="topbar__left">
        <text class="topbar__title">组网拓扑</text>
        <text class="topbar__sub">{{ topologies.length }} 条记录</text>
      </view>
      <view class="btn-add" @tap="goCustomers">客户</view>
    </view>

    <view v-if="loading" class="empty-tip">
      <text class="empty-tip__text">正在加载...</text>
    </view>

    <view v-else-if="topologies.length === 0" class="empty-tip">
      <text class="empty-tip__text">暂无拓扑</text>
    </view>

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
        </view>
        <text class="list-item__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { fetchTopologies } from '@/api/topology';
import type { Topology } from '@/types/topology';

const loading = ref(false);
const topologies = ref<Topology[]>([]);

function goCustomers() {
  uni.switchTab({ url: '/pages/customer/list/index' });
}

function openTopology(id: number) {
  uni.navigateTo({ url: `/pages/topology/detail/index?id=${id}` });
}

async function loadTopologies() {
  loading.value = true;
  try {
    topologies.value = await fetchTopologies();
  } catch (error) {
    const msg = error instanceof Error ? error.message : '加载失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  loadTopologies();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-bg);
  padding-bottom: 48rpx;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 48rpx 32rpx 32rpx;
}

.topbar__left {
  flex: 1;
}

.topbar__title {
  display: block;
  color: var(--cm-text);
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.2;
}

.topbar__sub {
  display: block;
  margin-top: 8rpx;
  color: var(--cm-muted);
  font-size: 24rpx;
  line-height: 1.2;
}

.btn-add {
  flex-shrink: 0;
  padding: 12rpx 28rpx;
  border-radius: 16rpx;
  background: var(--cm-primary);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
}

.empty-tip {
  padding: 96rpx 32rpx;
  text-align: center;
}

.empty-tip__text {
  display: block;
  color: var(--cm-muted);
  font-size: 30rpx;
}

.list {
  overflow: hidden;
  margin: 0 32rpx;
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
  color: var(--cm-text);
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__meta-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 10rpx;
}

.list-item__stat,
.list-item__dot {
  color: var(--cm-muted);
  font-size: 24rpx;
  line-height: 1.2;
}

.list-item__arrow {
  margin-left: 16rpx;
  color: var(--cm-border);
  font-size: 36rpx;
}
</style>
