<template>
  <view class="page">
    <!-- 加载状态 -->
    <view v-if="loadingDevices" class="empty-tip">
      <text class="empty-tip__text">正在加载拓扑设备数据...</text>
    </view>

    <view v-else>
      <view class="form-body">
        <!-- 连接类型 -->
        <view class="field">
          <text class="field__label">连接类型</text>
          <view class="seg">
            <view
              v-for="t in CONN_TYPES"
              :key="t.value"
              class="seg__item"
              :class="{ 'seg__item--active': form.connection_type === t.value }"
              @tap="form.connection_type = t.value"
            >{{ t.label }}</view>
          </view>
        </view>

        <!-- 源端口 -->
        <view class="field">
          <text class="field__label">源端口 <text class="required">*</text></text>
          <view class="picker-row" @tap="pickPort('source')">
            <text class="picker-value" :class="{ 'picker-placeholder': !form.source_port_id }">
              {{ sourcePortLabel || '请选择源端口' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </view>

        <!-- 目标端口 -->
        <view class="field">
          <text class="field__label">目标端口 <text class="required">*</text></text>
          <view class="picker-row" @tap="pickPort('target')">
            <text class="picker-value" :class="{ 'picker-placeholder': !form.target_port_id }">
              {{ targetPortLabel || '请选择目标端口' }}
            </text>
            <text class="picker-arrow">›</text>
          </view>
        </view>

        <!-- 备注/线缆信息 -->
        <view class="field field--last">
          <text class="field__label">备注 / 线缆信息</text>
          <textarea
            class="field__textarea"
            v-model="form.fiber_info"
            placeholder="可选，填写线缆编号或备注"
            placeholder-class="field__placeholder"
          />
        </view>
      </view>

      <!-- 底部固定操作区 -->
      <view class="footer-actions">
        <view
          class="btn btn--primary"
          :class="{ 'btn--disabled': submitting }"
          @tap="submit"
        >{{ submitting ? '保存中...' : '保存连接' }}</view>
      </view>
    </view>

    <SelectSheet
      :visible="portPickerVisible"
      :title="portPickerSide === 'source' ? '选择源端口' : '选择目标端口'"
      :options="portOptions"
      :selected-value="portPickerSide === 'source' ? form.source_port_id : form.target_port_id"
      @close="portPickerVisible = false"
      @select="onPortSelect"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
import SelectSheet from '@/components/SelectSheet.vue';
import { fetchTopologyDetail } from '@/api/topology';
import { createConnection } from '@/api/connection';
import type { TopologyDevice, TopologyPort } from '@/types/circuit';

interface SelectOption {
  label: string;
  value: string | number;
}

const topologyId = ref(0);
const loadingDevices = ref(false);
const submitting = ref(false);
const portPickerVisible = ref(false);
const portPickerSide = ref<'source' | 'target'>('source');

type ConnectionType = 'fiber' | 'cable' | 'other';

const CONN_TYPES: { label: string; value: ConnectionType }[] = [
  { label: '光纤', value: 'fiber' },
  { label: '网线', value: 'cable' },
  { label: '其他', value: 'other' },
];

const form = ref({
  connection_type: 'fiber' as ConnectionType,
  source_port_id: 0,
  target_port_id: 0,
  fiber_info: '',
});

interface PortOption {
  id: number;
  label: string;
}
const allPorts = ref<PortOption[]>([]);

const sourcePortLabel = computed(() =>
  allPorts.value.find(p => p.id === form.value.source_port_id)?.label || ''
);
const targetPortLabel = computed(() =>
  allPorts.value.find(p => p.id === form.value.target_port_id)?.label || ''
);
const portOptions = computed<SelectOption[]>(() =>
  allPorts.value.map(p => ({ label: p.label, value: p.id }))
);

function pickPort(side: 'source' | 'target') {
  if (allPorts.value.length === 0) {
    uni.showToast({ title: '该拓扑暂无端口，请先添加设备和端口', icon: 'none' });
    return;
  }
  portPickerSide.value = side;
  portPickerVisible.value = true;
}

function onPortSelect(option: SelectOption) {
  if (portPickerSide.value === 'source') form.value.source_port_id = Number(option.value);
  else form.value.target_port_id = Number(option.value);
}

async function submit() {
  if (!form.value.source_port_id || !form.value.target_port_id) {
    uni.showToast({ title: '请选择源端口和目标端口', icon: 'none' });
    return;
  }
  if (form.value.source_port_id === form.value.target_port_id) {
    uni.showToast({ title: '源端口和目标端口不能相同', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await createConnection({
      topology_id: topologyId.value,
      source_port_id: form.value.source_port_id,
      target_port_id: form.value.target_port_id,
      connection_type: form.value.connection_type,
      fiber_info: form.value.fiber_info || undefined,
    });
    uni.showToast({ title: '连接已创建', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

async function loadTopologyPorts() {
  loadingDevices.value = true;
  try {
    const topo = await fetchTopologyDetail(topologyId.value);
    const options: PortOption[] = [];
    for (const dev of (topo.Devices || []) as TopologyDevice[]) {
      for (const port of (dev.Ports || []) as TopologyPort[]) {
        options.push({ id: port.id, label: `${formatLocation(dev.location)} · ${dev.device_name}:${port.port_name}` });
      }
    }
    allPorts.value = options;
  } catch (e) {
    uni.showToast({ title: '加载设备数据失败', icon: 'none' });
  } finally {
    loadingDevices.value = false;
  }
}

function formatLocation(value: string | null | undefined) {
  return (value || '').trim() || '未填机房';
}

onLoad((query) => {
  topologyId.value = Number(query?.topology_id) || 0;
  loadTopologyPorts();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-surface);
  padding-bottom: 160rpx;
}

/* 空/加载状态 */
.empty-tip {
  padding: 96rpx 32rpx;
  text-align: center;
}

.empty-tip__text {
  display: block;
  font-size: 30rpx;
  color: var(--cm-muted);
}

/* 表单区块 */
.form-body {
  padding: 0 32rpx;
}

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
  color: var(--cm-muted);
  margin-bottom: 12rpx;
}

.required {
  color: var(--cm-danger);
}

/* 类型切换分段 */
.seg {
  display: flex;
  gap: 12rpx;
}

.seg__item {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  border-radius: 16rpx;
  background: var(--cm-surface-soft);
  color: var(--cm-muted);
  font-size: 28rpx;
  font-weight: 600;
}

.seg__item--active {
  background: var(--cm-primary);
  color: #fff;
}

/* picker */
.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72rpx;
}

.picker-value {
  font-size: 30rpx;
  color: var(--cm-text);
}

.picker-placeholder {
  color: var(--cm-border);
}

.picker-arrow {
  font-size: 40rpx;
  color: var(--cm-border);
}

.field__textarea {
  width: 100%;
  min-height: 100rpx;
  font-size: 28rpx;
  color: var(--cm-text);
  line-height: 1.6;
  padding-top: 8rpx;
}

/* 底部固定操作区 */
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: var(--cm-surface);
  border-top: 1rpx solid var(--cm-border);
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

.btn--disabled {
  opacity: 0.5;
}
</style>
