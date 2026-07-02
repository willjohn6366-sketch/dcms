<template>
  <view class="page">
    <view class="form-body">
      <view class="field">
        <text class="field__label">设备名称 <text class="required">*</text></text>
        <input class="field__input" v-model="form.device_name" placeholder="如：核心交换机-A" placeholder-class="field__placeholder" />
      </view>
      <view class="field">
        <text class="field__label">设备类型</text>
        <view class="picker-row" @tap="showTypePicker">
          <text class="picker-value">{{ deviceTypeLabel }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
      <view class="field">
        <text class="field__label">设备型号</text>
        <input class="field__input" v-model="form.device_model" placeholder="如：Cisco C9300" placeholder-class="field__placeholder" />
      </view>
      <view class="field field--last">
        <text class="field__label">位置</text>
        <input class="field__input" v-model="form.location" placeholder="如：机房一楼-A排" placeholder-class="field__placeholder" />
      </view>
    </view>

    <!-- 端口 section -->
    <view class="section-header">
      <text class="section-header__title">端口</text>
      <text class="section-header__hint">可选，新增后也可在设备详情中添加</text>
    </view>

    <view class="port-list">
      <view
        v-for="(port, i) in ports"
        :key="i"
        class="port-row"
        :class="{ 'port-row--last': i === ports.length - 1 && ports.length > 0 }"
      >
        <input
          class="port-row__input"
          v-model="port.port_name"
          :placeholder="`端口 ${i + 1} 名称，如 GE0/0/1`"
          placeholder-class="field__placeholder"
        />
        <view class="port-row__del" @tap="removePort(i)">×</view>
      </view>
      <view class="add-port-btn" @tap="addPort">+ 添加端口</view>
    </view>

    <view class="footer-actions">
      <view
        class="btn btn--primary"
        :class="{ 'btn--disabled': submitting }"
        @tap="submit"
      >{{ submitting ? '保存中...' : '保存设备' }}</view>
    </view>

    <SelectSheet
      :visible="typePickerVisible"
      title="选择设备类型"
      :options="deviceTypeOptions"
      :selected-value="form.device_type"
      @close="typePickerVisible = false"
      @select="onTypeSelect"
    />
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref, computed } from 'vue';
import SelectSheet from '@/components/SelectSheet.vue';
import { addDevice } from '@/api/device';
import { request } from '@/utils/request';

interface SelectOption {
  label: string;
  value: string | number;
}

const topologyId = ref(0);
const submitting = ref(false);
const typePickerVisible = ref(false);

const DEVICE_TYPES = [
  { label: '路由器', value: 'router' },
  { label: '交换机', value: 'switch' },
  { label: 'ODF', value: 'odf' },
  { label: '光设备', value: 'optical_device' },
  { label: '其他', value: 'other' },
];

const form = ref({
  device_name: '',
  device_type: 'other',
  device_model: '',
  location: '',
});

const ports = ref<{ port_name: string; port_type: string }[]>([]);

const deviceTypeLabel = computed(() => {
  return DEVICE_TYPES.find(t => t.value === form.value.device_type)?.label || '其他';
});

const deviceTypeOptions = computed<SelectOption[]>(() =>
  DEVICE_TYPES.map(t => ({ label: t.label, value: t.value }))
);

function showTypePicker() {
  typePickerVisible.value = true;
}

function onTypeSelect(option: SelectOption) {
  form.value.device_type = String(option.value);
}

function addPort() {
  ports.value.push({ port_name: '', port_type: 'other' });
}

function removePort(i: number) {
  ports.value.splice(i, 1);
}

async function submit() {
  if (!form.value.device_name.trim()) {
    uni.showToast({ title: '设备名称不能为空', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    const device = await addDevice({ topology_id: topologyId.value, ...form.value });
    const validPorts = ports.value.filter(p => p.port_name.trim());
    for (const p of validPorts) {
      await request({ url: '/ports', method: 'POST', data: { device_id: device.id, ...p } });
    }
    uni.showToast({ title: '设备已添加', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '保存失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

onLoad((query) => {
  topologyId.value = Number(query?.topology_id) || 0;
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-surface);
  padding-bottom: 160rpx;
}

.form-body {
  padding: 0 32rpx;
  border-bottom: 8rpx solid var(--cm-surface-soft);
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

.field__input {
  width: 100%;
  height: 72rpx;
  font-size: 30rpx;
  color: var(--cm-text);
}

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

.picker-arrow {
  font-size: 40rpx;
  color: var(--cm-border);
}

/* 端口 section */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding: 32rpx 32rpx 16rpx;
}

.section-header__title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--cm-text);
}

.section-header__hint {
  font-size: 22rpx;
  color: var(--cm-muted);
}

.port-list {
  padding: 0 32rpx;
  border-top: 1rpx solid var(--cm-border);
}

.port-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--cm-border);
}

.port-row--last {
  border-bottom: none;
}

.port-row__input {
  flex: 1;
  height: 64rpx;
  font-size: 28rpx;
  color: var(--cm-text);
}

.port-row__del {
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  border-radius: 24rpx;
  background: rgba(255, 59, 48, 0.08);
  color: var(--cm-danger);
  font-size: 32rpx;
  flex-shrink: 0;
}

.add-port-btn {
  padding: 28rpx 0;
  font-size: 28rpx;
  color: var(--cm-primary);
  font-weight: 600;
  text-align: center;
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
