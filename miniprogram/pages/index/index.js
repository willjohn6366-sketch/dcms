import request from '../../utils/request';

Page({
  data: {
    status: '正在连接服务器...',
    isConnected: false,
    searchKeyword: ''
  },

  onLoad: function() {
    this.checkHealth();
  },

  checkHealth: function() {
    request({
      url: '/health',
      hideLoading: true
    }).then(res => {
      this.setData({
        status: '服务运行中: ' + res.message,
        isConnected: true
      });
    }).catch(err => {
      this.setData({
        status: '离线模式 - 无法连接服务器',
        isConnected: false
      });
    });
  },

  /**
   * 快捷搜索
   */
  onQuickSearch(e) {
    const keyword = e.detail;
    if (!keyword) return;
    
    wx.navigateTo({
      url: `/pages/circuit/list/index?keyword=${encodeURIComponent(keyword)}`
    });
  }
})
