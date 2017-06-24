'use strict';

const session 	= require('express-session');
const MongoStore	= require('connect-mongo')(session);
const db 		    = require('../database');
const config 		= require('../config');
// const uuid = require('uuid/v4');
// console.log(db);
/**
 * Initialize Session
 * Uses MongoDB-based session store
 *
 */
const init = function () {
	if (process.env.NODE_ENV === 'production') {
		return session({
			secret: config.sessionSecret,
			name: process.env.COOKIE_NAME,
			resave: false,
			saveUninitialized: false,
			rolling: true,
			cookie: {maxAge: 1800000, httpOnly: true},
			keys: [process.env.COOKIE_KEY1, process.env.COOKIE_KEY2],
			// maxAge: 360000,
			unset: 'destroy',
			store: new MongoStore({ mongooseConnection: db.Mongoose.connection,
				collection: 'session',
				autoRemove: 'native' }),
		});
	} else {
		return session({
			secret: config.sessionSecret,
			name: process.env.COOKIE_NAME,
			resave: false,
			unset: 'destroy',
			saveUninitialized: false,
			sameSite: true,
			rolling: true,
			cookie: {maxAge: 1800000, httpOnly: true},
		});
	}
};

module.exports = init();
