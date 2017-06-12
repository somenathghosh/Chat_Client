'use strict';

const config 		= require('../config');
const Mongoose 	= require('mongoose');

// Connect to the database
// construct the database URI and encode username and password.
Mongoose.connect(config.mongo);

// Throw an error if the connection fails
Mongoose.connection.on('error', function(err) {
	if (err) throw err;
});


Mongoose.connection.on('connect', function() {
	console.log('connected');
});
// mpromise (mongoose's default promise library) is deprecated,
// Plug-in your own promise library instead.
// Use native promises
Mongoose.Promise = global.Promise;

module.exports = {Mongoose,
	models: {
		user: require('./schemas/user'),
		room: require('./schemas/room'),
	}};
