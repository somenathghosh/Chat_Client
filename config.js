/* eslint-disable new-cap, max-len, no-var, key-spacing */
'use strict';

const config = {
	parentDomain: 'p2p-chatapp.herokuapp.com', 			// Host Domain
	web_port : process.env.PORT || 3000,				// Port where app will be hosted
	// admin_url : '/admin',							// Choose a URL where admin panel can be accessed
	redis_port : process.env.REDIS_PORT,				// Redis Port
	redis_hostname : process.env.REDIS_HOST, 			// Redis Hostname
	redis_password : process.env.REDIS_PASSWORD,
	key : process.env.ADMIN_PAS || 'cGFzc3dvcmQ=',		// Admin Password btoa hashed (Default = 'password')
	env : process.env.NODE_ENV || 'development',
	sessionSecret: process.env.SESSION_SECRET || 'hds092384023j54351421&^$#@hvsvsd--t8153c-076][]',
	//mongo:  process.env.MONGODB_URI,
	//redis: process.env.REDIS_URL,
	mongo: 'mongodb://heroku_l2sh3rqr:kh61lmnt0g4fp1gq8dvhects85@ds151941.mlab.com:51941/heroku_l2sh3rqr',
	redis: 'redis://h:p22fad4700c45fa29f34c04f1101c818cd68c835161a09da4beb6cf4a33334cfb@ec2-34-206-77-235.compute-1.amazonaws.com:41999',
	passwordRegex: '^.{8,64}$',
	wait_q: 'client-wait-list',
	active_q: 'client-active-list',
	admin_q: 'admin-active-list',
	client_q: 'client-logged-list',
	login_active_q: 'login-active-list',
};

module.exports = config;
