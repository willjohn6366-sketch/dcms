import { searchCircuits } from '../../../api/circuit-api';
import { debounce } from '../../../utils/debounce';

Page({
  data: {
    circuits: [],
    searchKeyword: ''
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ searchKeyword: decodeURIComponent(options.keyword) });
    }
    // 创建防抖搜索函数
    this.debouncedSearch = debounce(this.loadCircuits.bind(this), 500);
  },

  onShow() {
    this.loadCircuits();
  },

  /**
   * 加载电路列表 (默认空搜索获取全部或基础列表)
   */
  async loadCircuits() {
    try {
      wx.showLoading({ title: '加载中' });
      const res = await searchCircuits(this.data.searchKeyword);
      if (res.success) {
        this.setData({
          circuits: res.data
        });
      }
    } catch (error) {
      console.error('加载电路列表失败', error);
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
    // 使用防抖搜索
    this.debouncedSearch();
  },

  /**
   * 执行搜索
   */
  async onSearch() {
    await this.loadCircuits();
  },

  /**
   * 跳转到新增页面
   */
  onAddCircuit() {
    wx.navigateTo({
      url: '/pages/circuit/form/index'
    });
  }
});
