const knex = require('knex');
const config = require('../config/database');

// Initialize knex connection
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

module.exports = db;