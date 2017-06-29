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
	//mongo:  process.env.MONGODB_URI,
	//redis: process.env.REDIS_URL,
	mongo: "mongodb://test_user:test_pass@ds151941.mlab.com:51941/heroku_l2sh3rqr",
	redis: "redis://h:p22fad4700c45fa29f34c04f1101c818cd68c835161a09da4beb6cf4a33334cfb@ec2-34-206-77-235.compute-1.amazonaws.com:41999",
	passwordRegex: '^.{8,64}$'
};

module.exports = config;
