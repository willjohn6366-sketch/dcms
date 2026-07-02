<template>
  <view class="page" v-if="customer">

    <!-- 顶部客户名称 + 编辑按钮 -->
    <view class="header">
      <text class="header__name">{{ customer.name }}</text>
      <view class="header__actions">
        <text class="header__check-btn" @tap="verifyCustomer">{{ checking ? '核查中' : '核查' }}</text>
        <text class="header__edit" @tap="editCustomer">编辑</text>
      </view>
    </view>
    <text class="header__check">最近核查：{{ customer.latest_check_date || '未核查' }}</text>

    <view class="divider" />

    <!-- 联系信息 -->
    <view class="section">
      <text class="section__title">联系信息</text>
      <view class="info-row">
        <text class="info-row__label">联系人</text>
        <text class="info-row__value">{{ customer.contact_person || '未填写' }}</text>
      </view>
      <view class="info-row">
        <text class="info-row__label">联系电话</text>
        <text class="info-row__value">{{ customer.contact_phone || '未填写' }}</text>
      </view>
      <view class="info-row">
        <text class="info-row__label">客户经理</text>
        <text class="info-row__value">{{ customer.account_manager || '未填写' }}</text>
      </view>
      <view class="info-row info-row--last">
        <text class="info-row__label">经理电话</text>
        <text class="info-row__value">{{ customer.manager_phone || '未填写' }}</text>
      </view>
    </view>

    <view class="gap" />

    <!-- 组网拓扑 -->
    <view class="section">
      <view class="section__header">
        <text class="section__title">组网拓扑</text>
        <text class="section__action" @tap="goTopologies">+ 新增</text>
      </view>
      <view v-if="topologies.length === 0" class="section__empty">暂无拓扑</view>
      <view v-else>
        <view
          v-for="topo in topologies"
          :key="topo.id"
          class="circuit-item"
          @tap="openTopology(topo.id)"
        >
          <view class="circuit-item__main">
            <text class="circuit-item__name">{{ topo.topology_name }}</text>
            <text class="circuit-item__meta">
              {{ topo.Devices?.length || 0 }} 台设备 · {{ topo.Connections?.length || 0 }} 条连接
            </text>
          </view>
          <text class="circuit-item__arrow">›</text>
        </view>
      </view>
    </view>

    <view class="gap" />

    <!-- 电路概览 -->
    <view class="section">
      <view class="section__header">
        <text class="section__title">电路概览</text>
        <text class="section__action" @tap="addCircuit">+ 新增电路</text>
      </view>

      <view v-if="(customer.Circuits || []).length === 0" class="section__empty">
        暂无电路
      </view>
      <view v-else>
        <view
          v-for="circuit in customer.Circuits"
          :key="circuit.id"
          class="circuit-item"
          @tap="openCircuit(circuit.id)"
        >
          <view class="circuit-item__main">
            <text class="circuit-item__name">{{ circuit.circuit_name }}</text>
            <text class="circuit-item__meta">{{ circuit.circuit_type || '未分类' }} · {{ circuit.bandwidth || '未填带宽' }}</text>
          </view>
          <text class="circuit-item__arrow">›</text>
        </view>
      </view>
    </view>

  </view>

  <view v-else class="state">
    <text class="state__text">{{ loading ? '正在加载客户详情...' : '未找到客户信息' }}</text>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { checkCustomer, fetchCustomerDetail } from '@/api/customer';
import { fetchTopologies } from '@/api/topology';
import type { Customer } from '@/types/customer';
import type { Topology } from '@/types/topology';

const loading = ref(false);
const customer = ref<Customer | null>(null);
const customerId = ref(0);
const topologies = ref<Topology[]>([]);
const checking = ref(false);

function editCustomer() {
  uni.navigateTo({ url: `/pages/customer/form/index?id=${customerId.value}` });
}

function goTopologies() {
  uni.navigateTo({ url: `/pages/topology/list/index?customer_id=${customerId.value}&customer_name=${encodeURIComponent(customer.value?.name || '')}` });
}

function addCircuit() {
  uni.navigateTo({ url: `/pages/circuit/form/index?customer_id=${customerId.value}` });
}

function openCircuit(id: number) {
  uni.navigateTo({ url: `/pages/circuit/detail/index?id=${id}` });
}

function openTopology(id: number) {
  uni.navigateTo({ url: `/pages/topology/detail/index?id=${id}` });
}

async function verifyCustomer() {
  if (!customerId.value || checking.value) return;

  checking.value = true;
  try {
    const updated = await checkCustomer(customerId.value);
    if (customer.value) {
      customer.value = {
        ...customer.value,
        latest_check_date: updated.latest_check_date,
        updated_at: updated.updated_at
      };
    }
    uni.showToast({ title: '已同步核查时间', icon: 'none' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '核查失败';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    checking.value = false;
  }
}

async function loadCustomer(id: number) {
  loading.value = true;
  try {
    const [c, topos] = await Promise.all([
      fetchCustomerDetail(id),
      fetchTopologies(id)
    ]);
    customer.value = c;
    topologies.value = topos;
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载失败';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  const id = Number(query?.id);
  if (id) {
    customerId.value = id;
    loadCustomer(id);
  }
});

onShow(() => {
  if (customerId.value) loadCustomer(customerId.value);
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  box-sizing: border-box;
  background: var(--cm-bg);
  padding: 28rpx 28rpx 96rpx;
}

/* 顶部标题 */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding: 30rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 26rpx 26rpx 0 0;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
  border-bottom: 0;
}

.header + .header__check {
  border-radius: 0 0 26rpx 26rpx;
  border-top: 0;
}

.header__name {
  flex: 1;
  min-width: 0;
  font-size: 38rpx;
  font-weight: 800;
  color: var(--cm-text);
  line-height: 1.28;
  word-break: break-all;
}

.header__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.header__check-btn,
.header__edit {
  flex-shrink: 0;
  min-width: 88rpx;
  height: 54rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.16);
  border-radius: 18rpx;
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 54rpx;
  text-align: center;
}

.header__check-btn {
  border-color: rgba(22, 32, 51, 0.08);
  background: #f8fbff;
  color: var(--cm-text);
}

.header__check {
  display: block;
  padding: 0 30rpx 28rpx;
  border: 1rpx solid var(--cm-border);
  background: var(--cm-surface);
  color: var(--cm-muted);
  font-size: 24rpx;
  line-height: 1.35;
  box-shadow: var(--cm-shadow);
}

.divider {
  display: none;
}

/* section */
.section {
  margin-top: 24rpx;
  padding: 26rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 26rpx;
  background: var(--cm-surface);
  box-shadow: var(--cm-shadow);
  box-sizing: border-box;
}

.section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.section__title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--cm-text);
  line-height: 1.25;
}

.section > .section__title {
  margin-bottom: 18rpx;
}

.section__action {
  flex-shrink: 0;
  height: 52rpx;
  padding: 0 18rpx;
  border: 1rpx solid rgba(37, 99, 235, 0.16);
  border-radius: 16rpx;
  background: var(--cm-primary-soft);
  color: var(--cm-primary);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 52rpx;
}

.section__empty {
  display: block;
  padding: 42rpx 24rpx;
  border: 1rpx solid #edf1f7;
  border-radius: 18rpx;
  background: #f8fbff;
  font-size: 26rpx;
  color: var(--cm-muted);
  text-align: center;
}

/* 信息行 */
.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 20rpx;
  border: 1rpx solid #edf1f7;
  border-radius: 18rpx;
  background: #f8fbff;
  box-sizing: border-box;
}

.info-row + .info-row {
  margin-top: 14rpx;
}

.info-row--last {
  border-bottom: 1rpx solid #edf1f7;
}

.info-row__label {
  width: 148rpx;
  flex-shrink: 0;
  font-size: 24rpx;
  color: var(--cm-muted);
  line-height: 1.45;
}

.info-row__value {
  flex: 1;
  font-size: 26rpx;
  color: var(--cm-text);
  text-align: right;
  font-weight: 600;
  line-height: 1.45;
  word-break: break-all;
}

/* 间距块 */
.gap {
  display: none;
}

/* 电路列表项 */
.circuit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #edf1f7;
  gap: 16rpx;
}

.circuit-item:last-child {
  border-bottom: 0;
}

.circuit-item__main {
  flex: 1;
  min-width: 0;
}

.circuit-item__name {
  display: block;
  overflow: hidden;
  color: var(--cm-text);
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-item__meta {
  display: block;
  overflow: hidden;
  margin-top: 8rpx;
  color: var(--cm-muted);
  font-size: 24rpx;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.circuit-item__arrow {
  flex-shrink: 0;
  color: #98a2b3;
  font-size: 40rpx;
  line-height: 1;
}

/* 加载/错误状态 */
.state {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 120rpx 32rpx;
  background: var(--cm-bg);
  text-align: center;
}

.state__text {
  font-size: 28rpx;
  color: var(--cm-muted);
}
</style>
