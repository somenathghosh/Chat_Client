/* eslint-disable new-cap, max-len, no-var, key-spacing */
'use strict';

const config = {
	parentDomain: 'http://localhost:8083', 	// Host Domain
	web_port : process.env.PORT || 3000,							// Port where app will be hosted
	admin_url : '/admin',					// Choose a URL where admin panel can be accessed
	redis_port : process.env.REDIS_PORT,							// Redis Port
	redis_hostname : process.env.REDIS_HOST, 				// Redis Hostname
	redis_password : process.env.REDIS_PASSWORD,
	admin_users : ['admin', 'admin2', 'somenath.ghosh'], 					// Add usernames for different admins
	key : process.env.ADMIN_PASS || 'cGFzc3dvcmQ=',						// Admin Password btoa hashed (Default = 'password')
	env : process.env.NODE_ENV || 'development',
	sessionSecret: 'hds092384023j54351421&^$#@hvsvsd--t8153c-076][]',
	mongo:  process.env.MONGODB_URI,
	redis: process.env.REDIS_URL || 'redis://h:pb777f96dd8b4087a089188ac14d1e0e0736be88c73a7ad52749b4a7e85743301@ec2-34-204-146-206.compute-1.amazonaws.com:35869',
	passwordRegex: '^.{8,64}$',
	wait_q: 'client-wait-list',
	active_q: 'client-active-list',
	admin_q: 'admin-active-list',
	client_q: 'client-logged-list',
};

module.exports = config;
