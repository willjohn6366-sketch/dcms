const fs = require('fs/promises');
const path = require('path');
const { sequelize, Customer, Topology, Device, Port, Connection, Circuit } = require('../models');

const TABLE_KEYS = ['customers', 'topologies', 'devices', 'ports', 'connections', 'circuits'];
const BACKUP_DIR = resolveRuntimePath(process.env.BACKUP_DIR || './data/backups');
const BACKUP_FILE_PATTERN = /^circuit-backup-\d{8}-\d{6}(?:-\d{3})?\.json$/;

class DataService {
  async exportAll() {
    const [customers, topologies, devices, ports, connections, circuits] = await Promise.all([
      Customer.findAll({ order: [['id', 'ASC']] }),
      Topology.findAll({ order: [['id', 'ASC']] }),
      Device.findAll({ order: [['id', 'ASC']] }),
      Port.findAll({ order: [['id', 'ASC']] }),
      Connection.findAll({ order: [['id', 'ASC']] }),
      Circuit.findAll({ order: [['id', 'ASC']] })
    ]);

    return {
      version: 1,
      exported_at: new Date().toISOString(),
      source: 'circuit-management',
      data: {
        customers: customers.map(toPlain),
        topologies: topologies.map(toPlain),
        devices: devices.map(toPlain),
        ports: ports.map(toPlain),
        connections: connections.map(toPlain),
        circuits: circuits.map(toPlain)
      }
    };
  }

  async importOverwrite(payload) {
    const backup = normalizeBackup(payload);

    return await sequelize.transaction(async (transaction) => {
      await clearTables(transaction);

      await Customer.bulkCreate(backup.customers.map((item) => pick(item, [
        'id',
        'name',
        'contact_person',
        'contact_phone',
        'account_manager',
        'manager_phone',
        'latest_check_date',
        'createdAt',
        'updatedAt'
      ])), { transaction });

      await Topology.bulkCreate(backup.topologies.map((item) => pick(item, [
        'id',
        'customer_id',
        'topology_name',
        'description',
        'layout_data',
        'createdAt',
        'updatedAt'
      ])), { transaction });

      await Device.bulkCreate(backup.devices.map((item) => pick(item, [
        'id',
        'topology_id',
        'device_name',
        'device_type',
        'device_model',
        'location',
        'position_x',
        'position_y',
        'createdAt',
        'updatedAt'
      ])), { transaction });

      await Port.bulkCreate(backup.ports.map((item) => pick(item, [
        'id',
        'device_id',
        'port_name',
        'port_type',
        'port_speed',
        'createdAt',
        'updatedAt'
      ])), { transaction });

      await Connection.bulkCreate(backup.connections.map((item) => pick(item, [
        'id',
        'topology_id',
        'source_port_id',
        'target_port_id',
        'connection_type',
        'fiber_info',
        'createdAt',
        'updatedAt'
      ])), { transaction });

      await Circuit.bulkCreate(backup.circuits.map((item) => pick(item, [
        'id',
        'customer_id',
        'topology_id',
        'connection_id',
        'circuit_name',
        'circuit_number',
        'circuit_type',
        'bandwidth',
        'open_date',
        'local_ip',
        'remote_ip',
        'remark',
        'createdAt',
        'updatedAt'
      ])), { transaction });

      return summarize(backup);
    });
  }

  async createBackup() {
    await ensureBackupDir();
    const backup = await this.exportAll();
    const filename = `circuit-backup-${formatFileStamp(new Date(backup.exported_at))}.json`;
    const filePath = getBackupPath(filename);

    await fs.writeFile(filePath, JSON.stringify(backup, null, 2), 'utf8');
    const stat = await fs.stat(filePath);

    return {
      filename,
      created_at: backup.exported_at,
      size: stat.size,
      summary: summarize(normalizeBackup(backup))
    };
  }

  async listBackups() {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const backups = await Promise.all(
      files
        .filter((filename) => BACKUP_FILE_PATTERN.test(filename))
        .map(async (filename) => {
          const filePath = getBackupPath(filename);
          const stat = await fs.stat(filePath);
          const backup = await readBackupFile(filename).catch(() => null);
          return {
            filename,
            created_at: backup?.exported_at || stat.birthtime.toISOString(),
            size: stat.size,
            summary: backup ? summarize(normalizeBackup(backup)) : null
          };
        })
    );

    return backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getBackup(filename) {
    return await readBackupFile(filename);
  }

  async restoreBackup(filename) {
    const backup = await readBackupFile(filename);
    return await this.importOverwrite(backup);
  }

  async clearAll() {
    return await sequelize.transaction(async (transaction) => {
      const summary = {
        circuits: await Circuit.count({ transaction }),
        connections: await Connection.count({ transaction }),
        ports: await Port.count({ transaction }),
        devices: await Device.count({ transaction }),
        topologies: await Topology.count({ transaction }),
        customers: await Customer.count({ transaction })
      };

      await clearTables(transaction);
      return summary;
    });
  }
}

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

async function readBackupFile(filename) {
  const filePath = getBackupPath(filename);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

function getBackupPath(filename) {
  if (!BACKUP_FILE_PATTERN.test(filename)) {
    const error = new Error('备份文件名不合法');
    error.statusCode = 400;
    error.code = 'INVALID_BACKUP_FILE';
    throw error;
  }

  const filePath = path.join(BACKUP_DIR, filename);
  if (path.basename(filePath) !== filename) {
    const error = new Error('备份文件名不合法');
    error.statusCode = 400;
    error.code = 'INVALID_BACKUP_FILE';
    throw error;
  }
  return filePath;
}

function resolveRuntimePath(targetPath) {
  return path.isAbsolute(targetPath)
    ? targetPath
    : path.join(__dirname, '../..', targetPath);
}

async function clearTables(transaction) {
  await Circuit.destroy({ where: {}, transaction });
  await Connection.destroy({ where: {}, transaction });
  await Port.destroy({ where: {}, transaction });
  await Device.destroy({ where: {}, transaction });
  await Topology.destroy({ where: {}, transaction });
  await Customer.destroy({ where: {}, transaction });
}

function normalizeBackup(payload) {
  const data = payload?.success && payload?.data?.data
    ? payload.data.data
    : payload?.data || payload;
  if (!data || typeof data !== 'object') {
    const error = new Error('导入文件格式不正确');
    error.statusCode = 400;
    error.code = 'INVALID_BACKUP';
    throw error;
  }

  const normalized = {};
  for (const key of TABLE_KEYS) {
    normalized[key] = Array.isArray(data[key]) ? data[key] : [];
  }

  return normalized;
}

function summarize(data) {
  return {
    customers: data.customers.length,
    topologies: data.topologies.length,
    devices: data.devices.length,
    ports: data.ports.length,
    connections: data.connections.length,
    circuits: data.circuits.length
  };
}

function formatFileStamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  const millis = String(date.getMilliseconds()).padStart(3, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}-${millis}`;
}

function pick(source, keys) {
  const result = {};
  keys.forEach((key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  });
  return result;
}

function toPlain(model) {
  return model.get({ plain: true });
}

module.exports = new DataService();
