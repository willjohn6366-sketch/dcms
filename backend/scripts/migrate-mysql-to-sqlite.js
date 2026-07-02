const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = process.env.DB_STORAGE || './data/database/circuit_management.sqlite';

const {
  sequelize,
  Customer,
  Topology,
  Device,
  Port,
  Connection,
  Circuit,
} = require('../src/models');

const TABLES = [
  { name: 'customers', model: Customer },
  { name: 'network_topologies', model: Topology },
  { name: 'network_devices', model: Device },
  { name: 'device_ports', model: Port },
  { name: 'device_connections', model: Connection },
  { name: 'circuits', model: Circuit },
];

function requireMysqlEnv(name) {
  if (!Object.prototype.hasOwnProperty.call(process.env, name)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
}

function normalizeRow(row) {
  const normalized = { ...row };

  if (Object.prototype.hasOwnProperty.call(normalized, 'created_at')) {
    normalized.createdAt = normalized.created_at;
    delete normalized.created_at;
  }

  if (Object.prototype.hasOwnProperty.call(normalized, 'updated_at')) {
    normalized.updatedAt = normalized.updated_at;
    delete normalized.updated_at;
  }

  if (typeof normalized.layout_data === 'string' && normalized.layout_data) {
    normalized.layout_data = JSON.parse(normalized.layout_data);
  }

  return normalized;
}

async function assertEmptySQLite() {
  const counts = await Promise.all(
    TABLES.map(async ({ name, model }) => ({ name, count: await model.count() })),
  );
  const populated = counts.filter(({ count }) => count > 0);

  if (populated.length) {
    const details = populated.map(({ name, count }) => `${name}: ${count}`).join(', ');
    throw new Error(`SQLite target already has data (${details}). Delete the SQLite file before migrating.`);
  }
}

async function migrate() {
  let source;

  try {
    source = await mysql.createConnection({
      host: requireMysqlEnv('MYSQL_HOST'),
      port: process.env.MYSQL_PORT || 3306,
      database: requireMysqlEnv('MYSQL_DATABASE'),
      user: requireMysqlEnv('MYSQL_USER'),
      password: requireMysqlEnv('MYSQL_PASSWORD'),
      dateStrings: true,
    });

    await sequelize.authenticate();
    await sequelize.sync();
    await assertEmptySQLite();

    const results = [];

    await sequelize.transaction(async (transaction) => {
      for (const { name, model } of TABLES) {
        const [rows] = await source.query(`SELECT * FROM ${name} ORDER BY id ASC`);
        const normalizedRows = rows.map(normalizeRow);

        if (normalizedRows.length) {
          await model.bulkCreate(normalizedRows, {
            transaction,
            validate: false,
            hooks: false,
          });
        }

        results.push({ name, count: normalizedRows.length });
      }
    });

    for (const { name, count } of results) {
      const sqliteCount = await TABLES.find(table => table.name === name).model.count();
      if (sqliteCount !== count) {
        throw new Error(`Row count mismatch for ${name}: MySQL=${count}, SQLite=${sqliteCount}`);
      }
      console.log(`${name}: migrated ${count} rows.`);
    }

    console.log('MySQL to SQLite migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    if (source) {
      await source.end();
    }
    await sequelize.close();
  }
}

migrate();
