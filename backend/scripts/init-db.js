const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

process.env.DB_DIALECT = process.env.DB_DIALECT || 'sqlite';
process.env.DB_STORAGE = process.env.DB_STORAGE || './data/database/circuit_management.sqlite';

const { sequelize } = require('../src/models');

async function initDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('SQLite database initialized successfully.');
  } catch (error) {
    console.error('Error during SQLite initialization:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

initDB();
