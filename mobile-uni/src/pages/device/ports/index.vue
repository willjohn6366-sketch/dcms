<template>
  <view class="page">
    <!-- 顶栏 -->
    <view class="topbar">
      <text class="topbar__title">{{ deviceName }} 的端口</text>
      <view class="btn-add" @tap="addPort">+ 新增端口</view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="empty-tip">
      <text class="empty-tip__text">正在加载...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="ports.length === 0 && !showForm" class="empty-tip">
      <text class="empty-tip__text">暂无端口</text>
      <text class="empty-tip__sub">点击右上角「+ 新增端口」添加</text>
    </view>

    <!-- 端口列表 -->
    <view v-else-if="ports.length > 0" class="list">
      <view
        v-for="(port, index) in ports"
        :key="port.id"
        class="list-item"
        :class="{ 'list-item--last': index === ports.length - 1 }"
      >
        <view class="list-item__main">
          <text class="list-item__name">{{ port.port_name }}</text>
          <text class="list-item__meta">
            {{ port.port_type || 'other' }}
            <text v-if="port.port_speed"> · {{ port.port_speed }}</text>
          </text>
        </view>
        <view class="tag-btn tag-btn--red" @tap="confirmDelete(port.id)">删除</view>
      </view>
    </view>

    <!-- 新增端口内联表单 -->
    <view v-if="showForm" class="inline-form">
      <view class="inline-form__header">
        <text class="inline-form__title">新增端口</text>
      </view>

      <view class="field">
        <text class="field__label">端口名称 <text class="required">*</text></text>
        <input class="field__input" v-model="newPort.port_name" placeholder="如：GE0/0/1" placeholder-class="field__placeholder" />
      </view>
      <view class="field">
        <text class="field__label">端口类型</text>
        <view class="picker-row" @tap="showTypePicker">
          <text class="picker-value">{{ portTypeLabel }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
      <view class="field field--last">
        <text class="field__label">速率</text>
        <input class="field__input" v-model="newPort.port_speed" placeholder="如：1G、10G" placeholder-class="field__placeholder" />
      </view>

      <view class="inline-form__actions">
        <view class="btn btn--ghost" @tap="showForm = false">取消</view>
        <view
          class="btn btn--primary"
          :class="{ 'btn--disabled': saving }"
          @tap="savePort"
        >{{ saving ? '保存中...' : '确认添加' }}</view>
      </view>
    </view>

    <SelectSheet
      :visible="typePickerVisible"
      title="选择端口类型"
      :options="portTypeOptions"
      :selected-value="newPort.port_type"
      @close="typePickerVisible = false"
      @select="onTypeSelect"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
import SelectSheet from '@/components/SelectSheet.vue';
import { fetchDevicePorts } from '@/api/device';
import { request } from '@/utils/request';
import type { TopologyPort } from '@/types/circuit';

interface SelectOption {
  label: string;
  value: string | number;
}

const deviceId = ref(0);
const deviceName = ref('');
const loading = ref(false);
const ports = ref<TopologyPort[]>([]);
const showForm = ref(false);
const saving = ref(false);
const typePickerVisible = ref(false);

const PORT_TYPES = [
  { label: '光口', value: 'optical' },
  { label: '电口', value: 'electrical' },
  { label: '其他', value: 'other' },
];

const newPort = ref({ port_name: '', port_type: 'other', port_speed: '' });

const portTypeLabel = computed(() => {
  return PORT_TYPES.find(t => t.value === newPort.value.port_type)?.label || '其他';
});

const portTypeOptions = computed<SelectOption[]>(() =>
  PORT_TYPES.map(t => ({ label: t.label, value: t.value }))
);

function addPort() { showForm.value = true; }

function showTypePicker() {
  typePickerVisible.value = true;
}

function onTypeSelect(option: SelectOption) {
  newPort.value.port_type = String(option.value);
}

function confirmDelete(id: number) {
  uni.showModal({
    title: '确认删除',
    content: '确认删除该端口？',
    confirmColor: '#d9534f',
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await request({ url: `/ports/${id}`, method: 'DELETE' });
        uni.showToast({ title: '已删除', icon: 'success' });
        loadPorts();
      } catch (e) {
        uni.showToast({ title: e instanceof Error ? e.message : '删除失败', icon: 'none' });
      }
    }
  });
}

async function savePort() {
  if (!newPort.value.port_name.trim()) {
    uni.showToast({ title: '端口名称不能为空', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    await request({ url: '/ports', method: 'POST', data: { device_id: deviceId.value, ...newPort.value } });
    uni.showToast({ title: '端口已添加', icon: 'success' });
    newPort.value = { port_name: '', port_type: 'other', port_speed: '' };
    showForm.value = false;
    loadPorts();
  } catch (e) {
    uni.showToast({ title: e instanceof Error ? e.message : '保存失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function loadPorts() {
  loading.value = true;
  try {
    ports.value = await fetchDevicePorts(deviceId.value);
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  deviceId.value = Number(query?.device_id) || 0;
  deviceName.value = decodeURIComponent(query?.device_name || '设备');
});

onShow(() => { if (deviceId.value) loadPorts(); });
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-surface);
  padding-bottom: 48rpx;
}

/* 顶栏 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 48rpx 32rpx 32rpx;
  border-bottom: 1rpx solid var(--cm-border);
}

.topbar__title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.btn-add {
  padding: 12rpx 28rpx;
  border-radius: 16rpx;
  background: var(--cm-primary);
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
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

/* 端口列表 */
.list {
  margin: 0 32rpx;
  border-top: 1rpx solid var(--cm-border);
}

.list-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--cm-border);
}

.list-item--last {
  border-bottom: none;
}

.list-item__main {
  flex: 1;
}

.list-item__name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--cm-text);
  margin-bottom: 6rpx;
}

.list-item__meta {
  display: block;
  font-size: 24rpx;
  color: var(--cm-muted);
}

/* 操作标签按钮 */
.tag-btn {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.tag-btn--red {
  background: rgba(255, 59, 48, 0.08);
  color: var(--cm-danger);
}

/* 内联表单 */
.inline-form {
  margin: 32rpx 32rpx 0;
  border-top: 2rpx solid var(--cm-primary);
  padding-top: 24rpx;
}

.inline-form__header {
  margin-bottom: 8rpx;
}

.inline-form__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.field {
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--cm-border);
}

.field--last {
  border-bottom: none;
}

.field__label {
  display: block;
  font-size: 24rpx;
  color: var(--cm-muted);
  margin-bottom: 10rpx;
}

.required {
  color: var(--cm-danger);
}

.field__input {
  width: 100%;
  height: 64rpx;
  font-size: 28rpx;
  color: var(--cm-text);
}

.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64rpx;
}

.picker-value {
  font-size: 28rpx;
  color: var(--cm-text);
}

.picker-arrow {
  font-size: 40rpx;
  color: var(--cm-border);
}

.inline-form__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
}

.btn--primary {
  background: var(--cm-primary);
  color: #fff;
}

.btn--ghost {
  background: var(--cm-surface-soft);
  color: var(--cm-muted);
}

.btn--disabled {
  opacity: 0.5;
}
</style>
