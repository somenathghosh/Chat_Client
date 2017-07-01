'use strict';
const RedisSMQ = require('rsmq');
const config = require('../config');
const assert = require('assert');
const redisClient = require('../dbStore/redconnection');

const rsmq = new RedisSMQ( {client: redisClient});

module.exports = rsmq;
