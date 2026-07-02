<template>
  <view class="page">

    <!-- 编辑模式：顶部删除按钮 -->
    <view v-if="isEdit" class="danger-bar">
      <text class="danger-bar__btn" @tap="confirmDelete">删除客户</text>
    </view>

    <!-- 表单字段 -->
    <view class="form">
      <view class="field">
        <text class="field__label">单位名称 <text class="field__required">*</text></text>
        <input
          class="field__input"
          v-model="form.name"
          placeholder="请输入单位名称"
          placeholder-class="field__placeholder"
        />
      </view>
      <view class="divider" />

      <view class="field">
        <text class="field__label">联系人</text>
        <input
          class="field__input"
          v-model="form.contact_person"
          placeholder="请输入联系人姓名"
          placeholder-class="field__placeholder"
        />
      </view>
      <view class="divider" />

      <view class="field">
        <text class="field__label">联系电话</text>
        <input
          class="field__input"
          v-model="form.contact_phone"
          placeholder="请输入联系电话"
          placeholder-class="field__placeholder"
          type="number"
        />
      </view>
      <view class="divider" />

      <view class="field">
        <text class="field__label">客户经理</text>
        <input
          class="field__input"
          v-model="form.account_manager"
          placeholder="请输入客户经理姓名"
          placeholder-class="field__placeholder"
        />
      </view>
      <view class="divider" />

      <view class="field">
        <text class="field__label">经理电话</text>
        <input
          class="field__input"
          v-model="form.manager_phone"
          placeholder="请输入经理电话"
          placeholder-class="field__placeholder"
          type="number"
        />
      </view>
    </view>

    <!-- 底部固定保存按钮 -->
    <view class="footer">
      <view
        class="footer__btn"
        :class="{ 'footer__btn--disabled': submitting }"
        @tap="submit"
      >
        <text class="footer__btn-text">{{ submitting ? '保存中...' : '保存' }}</text>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { fetchCustomerDetail, createCustomer, updateCustomer, deleteCustomer } from '@/api/customer';

const isEdit = ref(false);
const customerId = ref(0);
const submitting = ref(false);

const form = ref({
  name: '',
  contact_person: '',
  contact_phone: '',
  account_manager: '',
  manager_phone: ''
});

async function submit() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '单位名称不能为空', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateCustomer(customerId.value, form.value);
      uni.showToast({ title: '保存成功', icon: 'success' });
    } else {
      await createCustomer(form.value);
      uni.showToast({ title: '新增成功', icon: 'success' });
    }
    setTimeout(() => uni.navigateBack(), 800);
  } catch (error) {
    const msg = error instanceof Error ? error.message : '操作失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function confirmDelete() {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确认继续？',
    confirmColor: '#d9534f',
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await deleteCustomer(customerId.value);
        uni.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => {
          uni.navigateBack({ delta: 2 });
        }, 800);
      } catch (error) {
        const msg = error instanceof Error ? error.message : '删除失败';
        uni.showToast({ title: msg, icon: 'none' });
      }
    }
  });
}

onLoad(async (query) => {
  const id = Number(query?.id);
  if (id) {
    isEdit.value = true;
    customerId.value = id;
    uni.setNavigationBarTitle({ title: '编辑客户' });
    try {
      const data = await fetchCustomerDetail(id);
      form.value.name = data.name || '';
      form.value.contact_person = data.contact_person || '';
      form.value.contact_phone = data.contact_phone || '';
      form.value.account_manager = data.account_manager || '';
      form.value.manager_phone = data.manager_phone || '';
    } catch {
      uni.showToast({ title: '加载失败', icon: 'none' });
    }
  } else {
    uni.setNavigationBarTitle({ title: '新增客户' });
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: var(--cm-surface);
  padding-bottom: 160rpx;
}

/* 编辑模式删除栏 */
.danger-bar {
  display: flex;
  justify-content: flex-end;
  padding: 24rpx 32rpx 0;
}

.danger-bar__btn {
  font-size: 26rpx;
  color: var(--cm-danger);
  font-weight: 500;
}

/* 表单 */
.form {
  padding: 16rpx 32rpx 0;
}

.field {
  padding: 24rpx 0 8rpx;
}

.field__label {
  display: block;
  font-size: 24rpx;
  color: var(--cm-muted);
  margin-bottom: 12rpx;
}

.field__required {
  color: var(--cm-danger);
}

.field__input {
  width: 100%;
  height: 72rpx;
  font-size: 30rpx;
  color: var(--cm-text);
  background: transparent;
}

.divider {
  height: 1rpx;
  background: var(--cm-border);
}

/* 底部固定按钮 */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx calc(env(safe-area-inset-bottom) + 20rpx);
  background: var(--cm-surface);
  border-top: 1rpx solid var(--cm-border);
}

.footer__btn {
  height: 96rpx;
  line-height: 96rpx;
  background: var(--cm-primary);
  border-radius: 16rpx;
  text-align: center;
}

.footer__btn--disabled {
  opacity: 0.6;
}

.footer__btn-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}
</style>
