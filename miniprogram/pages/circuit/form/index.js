import { getCustomers } from '../../../api/customer-api';
import { createCircuit } from '../../../api/circuit-api';

Page({
  data: {
    circuit_number: '',
    circuit_name: '',
    customer_id: '',
    customer_name: '',
    circuit_type: '',
    bandwidth: '',
    business_type: '',
    ip_address: '',

    customers: [],
    typeColumns: ['IPRAN', 'STN', '互联网专线', '裸纤', 'SDH', 'MSTP', 'OTN', '语音中继', 'FTTH', '其他'],
    showCustomerPicker: false,
    showTypePicker: false
  },

  onLoad() {
    this.loadCustomers();
  },

  async loadCustomers() {
    try {
      const res = await getCustomers();
      if (res.success) {
        this.setData({ customers: res.data });
      }
    } catch (error) {
      console.error('加载客户列表失败', error);
    }
  },

  onFieldChange(e) {
    const { name } = e.currentTarget.dataset;
    this.setData({ [name]: e.detail });
  },

  onShowCustomerPicker() {
    this.setData({ showCustomerPicker: true });
  },

  onHideCustomerPicker() {
    this.setData({ showCustomerPicker: false });
  },

  onConfirmCustomer(e) {
    const { id, name } = e.detail.value;
    this.setData({
      customer_id: id,
      customer_name: name,
      showCustomerPicker: false
    });
  },

  onShowTypePicker() {
    this.setData({ showTypePicker: true });
  },

  onHideTypePicker() {
    this.setData({ showTypePicker: false });
  },

  onConfirmType(e) {
    this.setData({
      circuit_type: e.detail.value,
      showTypePicker: false
    });
  },

  async onSubmit() {
    const { circuit_number, customer_id, circuit_type } = this.data;
    if (!circuit_number) {
      wx.showToast({ title: '请输入电路编号', icon: 'none' });
      return;
    }
    if (!customer_id) {
      wx.showToast({ title: '请选择关联客户', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '提交中' });
      const res = await createCircuit({
        circuit_number: this.data.circuit_number,
        circuit_name: this.data.circuit_name,
        customer_id: this.data.customer_id,
        circuit_type: this.data.circuit_type,
        bandwidth: this.data.bandwidth,
        business_type: this.data.business_type,
        ip_address: this.data.ip_address
      });

      if (res.success) {
        wx.showToast({ title: '录入成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('录入电路失败', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
