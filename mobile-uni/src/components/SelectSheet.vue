<template>
  <view v-if="visible" class="select-sheet" @tap="close">
    <view class="select-sheet__panel" @tap.stop>
      <view class="select-sheet__header">
        <text class="select-sheet__title">{{ title }}</text>
        <view class="select-sheet__close" @tap="close">×</view>
      </view>

      <view class="select-sheet__list">
        <view
          v-for="option in options"
          :key="String(option.value)"
          class="select-sheet__item"
          :class="{ 'select-sheet__item--active': isSelected(option) }"
          @tap="select(option)"
        >
          <view class="select-sheet__item-main">
            <text class="select-sheet__label">{{ option.label }}</text>
            <text v-if="option.subtitle" class="select-sheet__subtitle">{{ option.subtitle }}</text>
          </view>
          <text v-if="isSelected(option)" class="select-sheet__check">✓</text>
        </view>
      </view>

      <view class="select-sheet__cancel" @tap="close">取消</view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface SelectSheetOption {
  label: string;
  value: string | number;
  subtitle?: string;
}

const props = defineProps<{
  visible: boolean;
  title: string;
  options: SelectSheetOption[];
  selectedValue?: string | number;
}>();

const emit = defineEmits<{
  close: [];
  select: [option: SelectSheetOption];
}>();

function close() {
  emit('close');
}

function select(option: SelectSheetOption) {
  emit('select', option);
  emit('close');
}

function isSelected(option: SelectSheetOption) {
  return props.selectedValue !== undefined && option.value === props.selectedValue;
}
</script>

<style scoped lang="scss">
.select-sheet {
  position: fixed;
  z-index: 9999;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(22, 32, 51, 0.36);
}

.select-sheet__panel {
  width: 100%;
  max-width: 520px;
  padding: 18rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background: var(--cm-surface);
  box-shadow: 0 -18rpx 54rpx rgba(25, 43, 78, 0.18);
  box-sizing: border-box;
}

.select-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 4rpx 18rpx;
}

.select-sheet__title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--cm-text);
  font-size: 30rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-sheet__close {
  width: 56rpx;
  height: 56rpx;
  line-height: 54rpx;
  border-radius: 18rpx;
  background: #f1f5fb;
  color: var(--cm-muted);
  font-size: 34rpx;
  text-align: center;
  flex-shrink: 0;
}

.select-sheet__list {
  max-height: 560rpx;
  overflow-y: auto;
  border: 1rpx solid var(--cm-border);
  border-radius: 20rpx;
  background: #f8fbff;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.select-sheet__item {
  display: flex;
  align-items: center;
  min-height: 92rpx;
  padding: 18rpx 22rpx;
  border-bottom: 1rpx solid var(--cm-border);
  box-sizing: border-box;
}

.select-sheet__item:last-child {
  border-bottom: 0;
}

.select-sheet__item--active {
  background: var(--cm-primary-soft);
}

.select-sheet__item-main {
  min-width: 0;
  flex: 1;
}

.select-sheet__label {
  display: block;
  overflow: hidden;
  color: var(--cm-text);
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-sheet__subtitle {
  display: block;
  margin-top: 6rpx;
  overflow: hidden;
  color: var(--cm-muted);
  font-size: 24rpx;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-sheet__check {
  margin-left: 16rpx;
  color: var(--cm-primary);
  font-size: 32rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.select-sheet__cancel {
  height: 88rpx;
  margin-top: 16rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: #f1f5fb;
  color: var(--cm-muted);
  font-size: 28rpx;
  font-weight: 700;
  text-align: center;
}
</style>
