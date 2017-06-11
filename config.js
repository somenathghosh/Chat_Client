var config = {
	parentDomain : 'http://localhost:8083', 	//Host Domain
	web_port : process.env.PORT || 3000,							//Port where app will be hosted
	admin_url : '/admin',					//Choose a URL where admin panel can be accessed
	redis_port : process.env.REDIS_PORT,							//Redis Port
	redis_hostname : process.env.REDIS_HOST, 				//Redis Hostname
	redis_password : process.env.REDIS_PASSWORD,
	admin_users : ['admin','admin2'], 					//Add usernames for different admins
	key : process.env.ADMIN_PASS,						//Admin Password btoa hashed (Default = 'password')
	env : process.env.NODE_ENV || 'development',
	sessionSecret: 'hds092384023j54351421&^$#@hvsvsd--t8153c-076][]',
	mongo:  process.env.MONGODB_URI,
	redis: process.env.REDIS_URL
};

module.exports = config;
