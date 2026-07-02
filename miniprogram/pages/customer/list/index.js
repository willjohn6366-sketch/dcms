import { getCustomers } from '../../../api/customer-api';
import { CACHE_KEYS, setCache, getCache } from '../../../utils/storage';

Page({
  data: {
    customers: [],
    allCustomers: [],
    searchKeyword: ''
  },

  onShow() {
    this.loadCustomers();
  },

  /**
   * 加载客户列表
   */
  async loadCustomers() {
    try {
      // 先尝试从缓存加载
      const cachedData = getCache(CACHE_KEYS.CUSTOMERS);
      if (cachedData) {
        this.setData({
          customers: cachedData,
          allCustomers: cachedData
        });
        return;
      }

      // 缓存不存在或已过期，从服务器加载
      wx.showLoading({ title: '加载中' });
      const res = await getCustomers();
      if (res.success) {
        this.setData({
          customers: res.data,
          allCustomers: res.data
        });
        // 保存到缓存
        setCache(CACHE_KEYS.CUSTOMERS, res.data);
      }
    } catch (error) {
      console.error('加载客户列表失败', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 搜索关键词变化
   */
  onSearchChange(e) {
    this.setData({ searchKeyword: e.detail });
    this.filterCustomers(e.detail);
  },

  /**
   * 执行搜索
   */
  onSearch() {
    this.filterCustomers(this.data.searchKeyword);
  },

  /**
   * 本地过滤客户
   */
  filterCustomers(keyword) {
    if (!keyword) {
      this.setData({ customers: this.data.allCustomers });
      return;
    }
    const filtered = this.data.allCustomers.filter(item => 
      item.name.toLowerCase().includes(keyword.toLowerCase())
    );
    this.setData({ customers: filtered });
  },

  /**
   * 跳转到新增页面
   */
  onAddCustomer() {
    wx.navigateTo({
      url: '/pages/customer/form/index'
    });
  }
});
