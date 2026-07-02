const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const router = express.Router();

const customerRoutes = require('./customer-routes');
const topologyRoutes = require('./topology-routes');
const deviceRoutes = require('./device-routes');
const portRoutes = require('./port-routes');
const connectionRoutes = require('./connection-routes');
const circuitRoutes = require('./circuit-routes');
const dataRoutes = require('./data-routes');

/**
 * 路由汇总
 */

// 健康检查
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API Service is healthy' });
});

router.get('/version', async (req, res, next) => {
  try {
    const versionFile = await readVersionFile();
    res.json({ success: true, data: versionFile, message: '操作成功' });
  } catch (error) {
    next(error);
  }
});

router.get('/version/latest', async (req, res, next) => {
  try {
    const local = await readVersionFile();
    const latest = await fetchLatestVersion(local);

    res.json({
      success: true,
      data: {
        local,
        latest,
        hasUpdate: compareVersion(latest.version, local.version) > 0,
        updateUrl: latest.update?.url || local.update?.url || local.repository
      },
      message: '操作成功'
    });
  } catch (error) {
    next(error);
  }
});

async function readVersionFile() {
  const candidates = [
    process.env.VERSION_FILE,
    path.join(__dirname, '../../../version.json'),
    path.join(__dirname, '../../version.json')
  ].filter(Boolean);

  for (const filePath of candidates) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  const error = new Error('版本文件不存在');
  error.statusCode = 404;
  error.code = 'VERSION_FILE_NOT_FOUND';
  throw error;
}

async function fetchLatestVersion(localVersion) {
  const versionUrls = Array.isArray(localVersion.update?.versionUrls)
    ? localVersion.update.versionUrls
    : [];

  if (!versionUrls.length) {
    const error = new Error('未配置远程版本地址');
    error.statusCode = 500;
    error.code = 'VERSION_URL_NOT_CONFIGURED';
    throw error;
  }

  const failures = [];
  for (const url of versionUrls) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        failures.push(`${url}: HTTP ${response.status}`);
        continue;
      }

      const latest = await response.json();
      if (!latest?.version) {
        failures.push(`${url}: 版本格式不正确`);
        continue;
      }

      return latest;
    } catch (error) {
      failures.push(`${url}: ${error.message}`);
    }
  }

  const error = new Error(`远程版本检查失败：${failures.join('；')}`);
  error.statusCode = 502;
  error.code = 'REMOTE_VERSION_CHECK_FAILED';
  throw error;
}

function compareVersion(latest, current) {
  const left = String(latest || '').split('.').map((item) => Number(item) || 0);
  const right = String(current || '').split('.').map((item) => Number(item) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] || 0) - (right[index] || 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

// 客户管理
router.use('/customers', customerRoutes);

// 拓扑管理
router.use('/topologies', topologyRoutes);

// 设备管理
router.use('/devices', deviceRoutes);

// 端口管理
router.use('/ports', portRoutes);

// 连接管理
router.use('/connections', connectionRoutes);

// 电路管理
router.use('/circuits', circuitRoutes);

// 数据维护
router.use('/data', dataRoutes);

module.exports = router;
