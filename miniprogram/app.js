App({
  onLaunch: function () {
    // 启动初始化逻辑
    console.log('小程序启动成功');
  },
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://localhost:3000'
  }
})
