import config from '../config/config';

/**
 * 封装微信请求
 * @param {Object} options - 请求选项
 * @returns {Promise} 返回请求结果
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, header = {} } = options;

    // 显示加载中
    if (!options.hideLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    wx.request({
      url: `${config.apiBaseUrl}${url}`,
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const { success, data, message, error } = res.data;
          if (success) {
            resolve(res.data);
          } else {
            const errorMsg = error?.message || message || '请求失败';
            if (!options.hideToast) {
              wx.showToast({
                title: errorMsg,
                icon: 'none',
                duration: 2000
              });
            }
            reject(res.data);
          }
        } else {
          const errorMsg = `服务器错误(${res.statusCode})`;
          if (!options.hideToast) {
            wx.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            });
          }
          reject(res);
        }
      },
      fail: (err) => {
        const errorMsg = '网络请求失败，请检查网络连接';
        if (!options.hideToast) {
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
        reject(err);
      },
      complete: () => {
        if (!options.hideLoading) {
          wx.hideLoading();
        }
      }
    });
  });
};

export default request;
