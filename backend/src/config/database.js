const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dialect = process.env.DB_DIALECT || 'sqlite';
const storage = process.env.DB_STORAGE || './data/database/circuit_management.sqlite';

const commonOptions = {
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
};

let sequelize;

if (dialect === 'sqlite') {
  const storagePath = path.isAbsolute(storage)
    ? storage
    : path.join(__dirname, '../..', storage);

  fs.mkdirSync(path.dirname(storagePath), { recursive: true });

  sequelize = new Sequelize({
    ...commonOptions,
    storage: storagePath,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      ...commonOptions,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
    },
  );
}

module.exports = sequelize;
