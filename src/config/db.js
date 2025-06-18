// src/config/db.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host:     process.env.MYSQL_HOST,
    port:     process.env.MYSQL_PORT || 3306,
    dialect:  'mysql',          // ← use mysql
    logging:  false,
    define: {
      underscored: true,        // if you want snake_case columns
    },
  }
);

module.exports = sequelize;
