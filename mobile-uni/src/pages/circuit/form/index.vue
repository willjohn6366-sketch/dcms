<template>
  <view class="page">
    <view class="form-body">
      <!-- 归属客户 -->
      <view class="field" v-if="showCustomerPicker">
        <text class="field__label">归属客户 <text class="required">*</text></text>
        <view class="picker-row" @tap="pickCustomer">
          <text class="picker-value" :class="{ 'picker-placeholder': !customerId }">
            {{ selectedCustomerName || '请选择客户' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </view>

      <!-- 电路名称 -->
      <view class="field">
        <text class="field__label">电路名称 <text class="required">*</text></text>
        <input class="field__input" v-model="form.circuit_name" placeholder="请输入电路名称" placeholder-class="field__placeholder" />
      </view>

      <!-- 电路编号 -->
      <view class="field">
        <text class="field__label">电路编号</text>
        <input class="field__input" v-model="form.circuit_number" placeholder="唯一编号，可选" placeholder-class="field__placeholder" />
      </view>

      <!-- 电路类型 -->
      <view class="field">
        <text class="field__label">电路类型</text>
        <view class="picker-row" @tap="showTypePicker">
          <text class="picker-value" :class="{ 'picker-placeholder': !form.circuit_type }">
            {{ form.circuit_type || '请选择类型' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </view>

      <!-- 带宽 -->
      <view class="field">
        <text class="field__label">带宽</text>
        <view class="input-suffix">
          <input class="field__input" v-model="form.bandwidth" placeholder="如：100" placeholder-class="field__placeholder" type="number" />
          <text class="suffix-text">M</text>
        </view>
      </view>

      <!-- 开通日期 -->
      <view class="field">
        <text class="field__label">开通日期</text>
        <picker mode="date" :value="form.open_date" @change="onDateChange">
          <view class="picker-row">
            <text class="picker-value" :class="{ 'picker-placeholder': !form.open_date }">
              {{ form.open_date || '请选择日期' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <!-- 本端 IP -->
      <view class="field">
        <text class="field__label">本端 IP</text>
        <input class="field__input" v-model="form.local_ip" placeholder="如：192.168.1.1/30" placeholder-class="field__placeholder" />
      </view>

      <!-- 对端 IP -->
      <view class="field">
        <text class="field__label">对端 IP</text>
        <input class="field__input" v-model="form.remote_ip" placeholder="如：192.168.1.2/30" placeholder-class="field__placeholder" />
      </view>

      <!-- 备注 -->
      <view class="field field--last">
        <text class="field__label">备注</text>
        <textarea class="field__textarea" v-model="form.remark" placeholder="可选备注信息" placeholder-class="field__placeholder" />
      </view>
    </view>

    <!-- 绑定连接 section -->
    <view class="section-header">绑定连接（可选）</view>
    <view class="form-body">
      <view class="field">
        <text class="field__label">选择拓扑</text>
        <view class="picker-row" @tap="pickTopology">
          <text class="picker-value" :class="{ 'picker-placeholder': !selectedTopologyId }">
            {{ selectedTopologyName || '请选择拓扑' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
      <view class="field" v-if="selectedTopologyId">
        <text class="field__label">选择连接</text>
        <text v-if="loadingConnections" class="hint-text">正在加载连接...</text>
        <text v-else-if="topologyConnections.length === 0" class="hint-text">该拓扑暂无连接</text>
        <view v-else class="picker-row" @tap="pickConnection">
          <text class="picker-value" :class="{ 'picker-placeholder': !form.connection_id }">
            {{ selectedConnectionLabel || '请选择连接' }}
          </text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
      <view class="field field--last" v-if="form.connection_id">
        <view class="clear-btn" @tap="clearConnection">× 清除绑定</view>
      </view>
    </view>

    <!-- 底部固定操作区 -->
    <view class="footer-actions">
      <view
        class="btn btn--primary"
        :class="{ 'btn--disabled': submitting }"
        @tap="submit"
      >{{ submitting ? '保存中...' : '保存电路' }}</view>
      <view v-if="isEdit" class="btn btn--danger" @tap="confirmDelete">删除电路</view>
    </view>

    <SelectSheet
      :visible="customerPickerVisible"
      title="选择客户"
      :options="customerOptions"
      :selected-value="customerId"
      @close="customerPickerVisible = false"
      @select="onCustomerSelect"
    />
    <SelectSheet
      :visible="typePickerVisible"
      title="选择电路类型"
      :options="circuitTypeOptions"
      :selected-value="form.circuit_type"
      @close="typePickerVisible = false"
      @select="onCircuitTypeSelect"
    />
    <SelectSheet
      :visible="topologyPickerVisible"
      title="选择拓扑"
      :options="topologyOptions"
      :selected-value="selectedTopologyId"
      @close="topologyPickerVisible = false"
      @select="onTopologySelect"
    />
    <SelectSheet
      :visible="connectionPickerVisible"
      title="选择连接"
      :options="connectionOptions"
      :selected-value="form.connection_id"
      @close="connectionPickerVisible = false"
      @select="onConnectionSelect"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
import SelectSheet from '@/components/SelectSheet.vue';
import { fetchCircuitDetail, createCircuit, updateCircuit, deleteCircuit } from '@/api/circuit';
import { fetchTopologies, fetchTopologyDetail } from '@/api/topology';
import { fetchCustomers } from '@/api/customer';
import type { Topology } from '@/types/topology';
import type { TopologyConnection } from '@/types/circuit';
import type { Customer } from '@/types/customer';

interface SelectOption {
  label: string;
  value: string | number;
  subtitle?: string;
}

const isEdit = ref(false);
const circuitId = ref(0);
const customerId = ref(0);
const submitting = ref(false);
const showCustomerPicker = ref(false);
const selectedCustomerName = ref('');
const allCustomers = ref<Customer[]>([]);
const customerPickerVisible = ref(false);
const typePickerVisible = ref(false);
const topologyPickerVisible = ref(false);
const connectionPickerVisible = ref(false);

const customerOptions = computed<SelectOption[]>(() =>
  allCustomers.value.map(c => ({ label: c.name, value: c.id }))
);

async function pickCustomer() {
  if (allCustomers.value.length === 0) {
    uni.showToast({ title: '加载客户列表中...', icon: 'none' });
    return;
  }
  customerPickerVisible.value = true;
}

async function onCustomerSelect(option: SelectOption) {
  const c = allCustomers.value.find(item => item.id === Number(option.value));
  if (!c) return;
  customerId.value = c.id;
  selectedCustomerName.value = c.name;
  form.value.topology_id = 0;
  form.value.connection_id = 0;
      selectedTopologyId.value = 0;
      selectedTopologyName.value = '';
      topologyConnections.value = [];
      topologyPortLabels.value = {};
      try {
        topologies.value = await fetchTopologies(c.id);
      } catch { topologies.value = []; }
}

const CIRCUIT_TYPES = ['IPRAN', 'OTN', '互联网专线', 'FTTH', 'SDH', 'MSTP', '裸纤', 'STN', '语音中继', '其他'];
const circuitTypeOptions = computed<SelectOption[]>(() =>
  CIRCUIT_TYPES.map(t => ({ label: t, value: t }))
);

const form = ref({
  circuit_name: '',
  circuit_number: '',
  circuit_type: '' as string,
  bandwidth: '',
  open_date: '',
  local_ip: '',
  remote_ip: '',
  remark: '',
  connection_id: 0,
  topology_id: 0,
});

const topologies = ref<Topology[]>([]);
const selectedTopologyId = ref(0);
const selectedTopologyName = ref('');
const topologyConnections = ref<TopologyConnection[]>([]);
const topologyPortLabels = ref<Record<number, string>>({});
const loadingConnections = ref(false);

const selectedConnectionLabel = computed(() => {
  const conn = topologyConnections.value.find(c => c.id === form.value.connection_id);
  if (!conn) return '';
  return formatConnectionLabel(conn);
});

const topologyOptions = computed<SelectOption[]>(() =>
  topologies.value.map(t => ({ label: t.topology_name, value: t.id }))
);

const connectionOptions = computed<SelectOption[]>(() =>
  topologyConnections.value.map(c => ({
    label: formatConnectionLabel(c),
    value: c.id,
    subtitle: c.fiber_info || undefined,
  }))
);

function formatConnectionLabel(conn: TopologyConnection) {
  const source = conn.source_port_id ? topologyPortLabels.value[conn.source_port_id] : '';
  const target = conn.target_port_id ? topologyPortLabels.value[conn.target_port_id] : '';
  return `连接 #${conn.id}（${source || `端口 ${conn.source_port_id || '?'}`} ↔ ${target || `端口 ${conn.target_port_id || '?'}`}）`;
}

function showTypePicker() {
  typePickerVisible.value = true;
}

function onCircuitTypeSelect(option: SelectOption) {
  form.value.circuit_type = String(option.value);
}

function onDateChange(e: any) {
  form.value.open_date = e.detail.value;
}

async function pickTopology() {
  if (topologies.value.length === 0) {
    uni.showToast({ title: '该客户暂无拓扑', icon: 'none' });
    return;
  }
  topologyPickerVisible.value = true;
}

function onTopologySelect(option: SelectOption) {
  const topo = topologies.value.find(t => t.id === Number(option.value));
  if (!topo) return;
  selectedTopologyId.value = topo.id;
  selectedTopologyName.value = topo.topology_name;
  form.value.topology_id = topo.id;
  form.value.connection_id = 0;
  loadConnections(topo.id);
}

async function loadConnections(topoId: number) {
  loadingConnections.value = true;
  try {
    const detail = await fetchTopologyDetail(topoId);
    topologyConnections.value = detail.Connections || [];
    const labels: Record<number, string> = {};
    for (const device of detail.Devices || []) {
      for (const port of device.Ports || []) {
        labels[port.id] = `${device.device_name}:${port.port_name}`;
      }
    }
    topologyPortLabels.value = labels;
  } catch {
    topologyConnections.value = [];
    topologyPortLabels.value = {};
  } finally {
    loadingConnections.value = false;
  }
}

function pickConnection() {
  connectionPickerVisible.value = true;
}

function onConnectionSelect(option: SelectOption) {
  form.value.connection_id = Number(option.value);
}

function clearConnection() {
  form.value.connection_id = 0;
  selectedTopologyId.value = 0;
  selectedTopologyName.value = '';
  form.value.topology_id = 0;
  topologyConnections.value = [];
  topologyPortLabels.value = {};
}

async function submit() {
  if (!form.value.circuit_name.trim()) {
    uni.showToast({ title: '电路名称不能为空', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    const payload: Record<string, unknown> = {
      circuit_name: form.value.circuit_name,
      circuit_number: form.value.circuit_number || undefined,
      circuit_type: form.value.circuit_type || undefined,
      bandwidth: form.value.bandwidth || undefined,
      open_date: form.value.open_date || undefined,
      local_ip: form.value.local_ip || undefined,
      remote_ip: form.value.remote_ip || undefined,
      remark: form.value.remark || undefined,
      connection_id: form.value.connection_id || null,
      topology_id: form.value.topology_id || null,
      customer_id: customerId.value || undefined,
    };

    if (isEdit.value) {
      await updateCircuit(circuitId.value, payload);
      uni.showToast({ title: '保存成功', icon: 'success' });
    } else {
      await createCircuit(payload);
      uni.showToast({ title: '电路已新增', icon: 'success' });
    }
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function confirmDelete() {
  uni.showModal({
    title: '确认删除',
    content: '确认删除该电路？',
    confirmColor: '#d9534f',
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await deleteCircuit(circuitId.value);
        uni.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => uni.navigateBack({ delta: 2 }), 800);
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' });
      }
    }
  });
}

onLoad(async (query) => {
  customerId.value = Number(query?.customer_id) || 0;
  const id = Number(query?.id);

  if (!customerId.value && !id) {
    showCustomerPicker.value = true;
    try {
      allCustomers.value = await fetchCustomers();
    } catch { /* 忽略 */ }
  }

  if (customerId.value) {
    try {
      topologies.value = await fetchTopologies(customerId.value);
    } catch { /* 忽略 */ }
  }

  if (id) {
    isEdit.value = true;
    circuitId.value = id;
    uni.setNavigationBarTitle({ title: '编辑电路' });
    try {
      const data = await fetchCircuitDetail(id);
      form.value.circuit_name = data.circuit_name || '';
      form.value.circuit_number = data.circuit_number || '';
      form.value.circuit_type = data.circuit_type || '';
      form.value.bandwidth = data.bandwidth || '';
      form.value.open_date = data.open_date || '';
      form.value.local_ip = data.local_ip || '';
      form.value.remote_ip = data.remote_ip || '';
      form.value.remark = (data as any).remark || '';
      form.value.connection_id = data.connection_id || 0;
      form.value.topology_id = data.topology_id || 0;
      if (!customerId.value && data.customer_id) {
        customerId.value = data.customer_id;
        try { topologies.value = await fetchTopologies(data.customer_id); } catch { /* 忽略 */ }
      }
      if (data.topology_id) {
        selectedTopologyId.value = data.topology_id;
        const topo = topologies.value.find(t => t.id === data.topology_id);
        selectedTopologyName.value = topo?.topology_name || `拓扑 #${data.topology_id}`;
        loadConnections(data.topology_id);
      }
    } catch {
      uni.showToast({ title: '加载电路数据失败', icon: 'none' });
    }
  } else {
    uni.setNavigationBarTitle({ title: '新增电路' });
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-bg);
  padding-bottom: 200rpx;
  padding-top: 20rpx;
}

/* 表单区块 */
.form-body {
  margin: 0 28rpx 24rpx;
  padding: 6rpx 24rpx;
  border: 1rpx solid var(--cm-border);
  border-radius: 28rpx;
  background: var(--cm-surface);
  box-shadow: 0 14rpx 34rpx rgba(25, 43, 78, 0.06);
}

/* section 标题 */
.section-header {
  padding: 8rpx 32rpx 18rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--cm-muted);
  letter-spacing: 0;
}

/* 字段行 */
.field {
  padding: 28rpx 0;
  border-bottom: 1rpx solid var(--cm-border);
}

.field--last {
  border-bottom: none;
}

.field__label {
  display: block;
  font-size: 24rpx;
  color: #5f6b7a;
  margin-bottom: 14rpx;
  font-weight: 700;
}

.required {
  color: var(--cm-danger);
}

.field__input {
  width: 100%;
  height: 80rpx;
  padding: 0 22rpx;
  border: 1rpx solid #dbe3ef;
  border-radius: 18rpx;
  background: #f8fbff;
  font-size: 30rpx;
  color: var(--cm-text);
  font-weight: 600;
}

.input-suffix {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.input-suffix .field__input {
  flex: 1;
  width: auto;
}

.suffix-text {
  font-size: 30rpx;
  color: #5f6b7a;
  flex-shrink: 0;
  font-weight: 700;
}

.field__textarea {
  width: 100%;
  min-height: 132rpx;
  padding: 18rpx 22rpx;
  border: 1rpx solid #dbe3ef;
  border-radius: 18rpx;
  background: #f8fbff;
  font-size: 28rpx;
  color: var(--cm-text);
  line-height: 1.6;
  font-weight: 600;
}

.field__placeholder {
  color: #98a2b3;
  font-weight: 400;
}

/* picker */
.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80rpx;
  padding: 0 20rpx 0 22rpx;
  border: 1rpx solid #dbe3ef;
  border-radius: 18rpx;
  background: #f8fbff;
  gap: 16rpx;
}

.picker-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 30rpx;
  color: var(--cm-text);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-placeholder {
  color: #98a2b3;
  font-weight: 400;
}

.picker-arrow {
  font-size: 40rpx;
  color: #98a2b3;
}

/* 提示文字 */
.hint-text {
  font-size: 28rpx;
  color: var(--cm-muted);
  line-height: 72rpx;
}

/* 清除按钮 */
.clear-btn {
  font-size: 26rpx;
  color: var(--cm-danger);
  font-weight: 600;
  line-height: 72rpx;
}

/* 底部固定操作区 */
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid var(--cm-border);
  box-shadow: 0 -12rpx 30rpx rgba(25, 43, 78, 0.08);
  backdrop-filter: blur(18rpx);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.btn {
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
}

.btn--primary {
  background: var(--cm-primary);
  color: #fff;
}

.btn--danger {
  background: var(--cm-surface);
  color: var(--cm-danger);
  border: 1rpx solid #FFE0DE;
}

.btn--disabled {
  opacity: 0.5;
}
</style>
