<template>
  <view class="page">
    <view class="form-body">
      <view class="field">
        <text class="field__label">拓扑名称 <text class="required">*</text></text>
        <input class="field__input" v-model="form.topology_name" placeholder="请输入拓扑名称" placeholder-class="field__placeholder" />
      </view>
      <view class="field field--last">
        <text class="field__label">描述</text>
        <textarea class="field__textarea" v-model="form.description" placeholder="可选，简要描述组网用途" placeholder-class="field__placeholder" />
      </view>
    </view>

    <view class="footer-actions">
      <view
        class="btn btn--primary"
        :class="{ 'btn--disabled': submitting }"
        @tap="submit"
      >{{ submitting ? '保存中...' : '保存' }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { createTopology } from '@/api/topology';

const customerId = ref(0);
const submitting = ref(false);
const form = ref({ topology_name: '', description: '' });

async function submit() {
  if (!form.value.topology_name.trim()) {
    uni.showToast({ title: '拓扑名称不能为空', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    await createTopology({ customer_id: customerId.value, ...form.value });
    uni.showToast({ title: '创建成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '创建失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

onLoad((query) => {
  customerId.value = Number(query?.customer_id) || 0;
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

.field__textarea {
  width: 100%;
  min-height: 120rpx;
  font-size: 30rpx;
  color: var(--cm-text);
  line-height: 1.6;
}

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
