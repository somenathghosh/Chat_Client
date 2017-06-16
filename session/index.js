'use strict';

var session 	= require('express-session');
var MongoStore	= require('connect-mongo')(session);
var db 		    = require('../database');
var config 		= require('../config');
// console.log(db);
/**
 * Initialize Session
 * Uses MongoDB-based session store
 *
 */
var init = function () {
	if(process.env.NODE_ENV === 'production') {
		return session({
			secret: config.sessionSecret,
			resave: false,
			saveUninitialized: false,
			rolling: true,
			maxAge: 360000,
			unset: 'destroy',
			store: new MongoStore({ mongooseConnection: db.Mongoose.connection,
				collection: 'session',
				autoRemove: 'native' })
		});
	} else {
		return session({
			secret: 'sfsdsjkdhfs97',
			resave: false,
			unset: 'destroy',
			saveUninitialized: true,
			sameSite: true,

		});
	}
}

module.exports = init();
