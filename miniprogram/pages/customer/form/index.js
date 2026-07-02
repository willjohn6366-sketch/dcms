import { createCustomer } from '../../../api/customer-api';
import { CACHE_KEYS, clearCache } from '../../../utils/storage';

Page({
  data: {
    name: '',
    contact_person: '',
    contact_phone: ''
  },

  onFieldChange(e) {
    const { name } = e.currentTarget.dataset;
    this.setData({
      [name]: e.detail
    });
  },

  async onSubmit() {
    if (!this.data.name) {
      wx.showToast({ title: '请输入单位名称', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '提交中' });
      const res = await createCustomer({
        name: this.data.name,
        contact_person: this.data.contact_person,
        contact_phone: this.data.contact_phone
      });

      if (res.success) {
        // 清除客户列表缓存
        clearCache(CACHE_KEYS.CUSTOMERS);
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('提交客户信息失败', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
