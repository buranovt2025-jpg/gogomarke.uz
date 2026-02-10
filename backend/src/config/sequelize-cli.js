require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USER || 'gogomarket',
    password: process.env.DB_PASSWORD || 'gogomarket',
    database: process.env.DB_NAME || 'gogomarket',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};
