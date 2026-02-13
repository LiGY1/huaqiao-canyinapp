const chalk = require('chalk');

const errorHandler = (err, req, res, next) => {
  console.error(chalk.red(`[错误] ${err.message}`));
  if (process.env.NODE_ENV === 'development') {
    console.error(chalk.gray(err.stack));
  }

  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') {
    const message = '资源未找到';
    error = { statusCode: 404, message };
  }

  if (err.code === 11000) {
    const message = '该数据已存在';
    error = { statusCode: 400, message };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    code: error.statusCode || 500,
    success: false,
    message: error.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

