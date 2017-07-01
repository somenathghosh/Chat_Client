/* eslint-disable new-cap, max-len, no-var, key-spacing */
'use strict';

const config = {
	parentDomain: 'p2p-chatapp.herokuapp.com', 	// Host Domain
	web_port : process.env.PORT,							// Port where app will be hosted
	// admin_url : '/admin',					// Choose a URL where admin panel can be accessed
	redis_port : process.env.REDIS_PORT,							// Redis Port
	redis_hostname : process.env.REDIS_HOST, 				// Redis Hostname
	redis_password : process.env.REDIS_PASSWORD,
	key : process.env.ADMIN_PASS,						// Admin Password btoa hashed (Default = 'password')
	env : process.env.NODE_ENV,
	sessionSecret: process.env.SESSION_SECRET,
	mongo:  process.env.MONGODB_URI,
	redis: process.env.REDIS_URL,
	passwordRegex: '^.{8,64}$',
	wait_q: 'client-wait-list',
	active_q: 'client-active-list',
	admin_q: 'admin-active-list',
	client_q: 'client-logged-list',
};

module.exports = config;
