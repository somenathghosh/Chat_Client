'use strict';

const redis 	= require('redis').createClient;
const adapter = require('socket.io-redis');
const config = require('../config');

const port = config.redis_port;
const host = config.redis_hostname;
const password = config.redis_password;
const pubClient = redis({url:config.redis});
const subClient = redis({url:config.redis,return_buffers: true });
// const pubClient = redis(port, host, { auth_pass: password });
// const subClient = redis(port, host, { auth_pass: password, return_buffers: true, });

module.exports = adapter({ pubClient, subClient });
