const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize } = require('./models');
const { errorHandler } = require('./middlewares/error-handler');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Circuit Management API is running' });
});

// 路由汇总
app.use('/api', require('./routes'));

// 404 处理
app.use((req, res, next) => {
  const err = new Error('Resource Not Found');
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
});

// 统一错误处理
app.use(errorHandler);

// 数据库连接测试
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.sync();
      console.log('SQLite tables are ready.');
    }
    
    const PORT = process.env.PORT || 6100;
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
