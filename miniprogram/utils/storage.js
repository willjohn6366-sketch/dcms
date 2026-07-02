/**
 * 本地存储工具
 * 封装 wx.setStorage 和 wx.getStorage
 */

const CACHE_KEYS = {
  CUSTOMERS: 'cache_customers',
  CUSTOMER_TIMESTAMP: 'cache_customers_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} data - 缓存数据
 */
const setCache = (key, data) => {
  try {
    wx.setStorageSync(key, data);
    wx.setStorageSync(`${key}_timestamp`, Date.now());
  } catch (error) {
    console.error('设置缓存失败:', error);
  }
};

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @param {number} duration - 缓存有效期（毫秒）
 * @returns {any} 缓存数据，如果过期或不存在则返回 null
 */
const getCache = (key, duration = CACHE_DURATION) => {
  try {
    const timestamp = wx.getStorageSync(`${key}_timestamp`);
    if (!timestamp) return null;

    const now = Date.now();
    if (now - timestamp > duration) {
      // 缓存过期，清除
      clearCache(key);
      return null;
    }

    return wx.getStorageSync(key);
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
};

/**
 * 清除缓存
 * @param {string} key - 缓存键
 */
const clearCache = (key) => {
  try {
    wx.removeStorageSync(key);
    wx.removeStorageSync(`${key}_timestamp`);
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
};

/**
 * 清除所有缓存
 */
const clearAllCache = () => {
  try {
    wx.clearStorageSync();
  } catch (error) {
    console.error('清除所有缓存失败:', error);
  }
};

export {
  CACHE_KEYS,
  CACHE_DURATION,
  setCache,
  getCache,
  clearCache,
  clearAllCache
};
