var config = {
	parentDomain : 'http://localhost:8083', 	//Host Domain
	web_port : 8080,							//Port where app will be hosted
	admin_url : '/adminURL',					//Choose a URL where admin panel can be accessed
	redis_port : 41999,							//Redis Port
	redis_hostname : "ec2-34-206-77-235.compute-1.amazonaws.com", 				//Redis Hostname
	redis_password : "p22fad4700c45fa29f34c04f1101c818cd68c835161a09da4beb6cf4a33334cfb",
	admin_users : ['admin','admin2'], 					//Add usernames for different admins
	key : 'cGFzc3dvcmQ='						//Admin Password btoa hashed (Default = 'password')
};

module.exports = config;
