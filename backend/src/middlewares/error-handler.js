const { error } = require('../utils/response');

/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[Error] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json(error(code, message));
};

module.exports = {
  AppError,
  errorHandler,
};
