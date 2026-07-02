/**
 * 成功响应格式化
 * @param {any} data - 返回数据
 * @param {string} message - 成功信息
 * @returns {Object} 格式化后的响应对象
 */
const success = (data = null, message = '操作成功') => {
  return {
    success: true,
    data,
    message,
  };
};

/**
 * 错误响应格式化
 * @param {string} code - 错误代码
 * @param {string} message - 错误信息
 * @returns {Object} 格式化后的响应对象
 */
const error = (code = 'INTERNAL_ERROR', message = '服务器内部错误') => {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
};

module.exports = {
  success,
  error,
};
