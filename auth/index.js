'use strict';

// const config 		= require('../config');
const passport 	= require('passport');
// var logger 		= require('../logger');
const LocalStrategy 		= require('passport-local').Strategy;
// var FacebookStrategy  	= require('passport-facebook').Strategy;
// var TwitterStrategy  	= require('passport-twitter').Strategy;

const User = require('../models/user');

/**
 * Encapsulates all code for authentication
 * Either by using username and password, or by using social accounts
 *
 */
const init = function(){

	// Serialize and Deserialize user instances to and from the session.
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	// Plug-in Local Strategy
	passport.use(new LocalStrategy(
	  function(username, password, done) {
			console.log(username);
	    User.findOne({$or: [ {username: username.toLowerCase()},{email: username.toLowerCase()}] }, function(err, user) {
	      if (err) { return done(err); }

	      if (!user) {
	        return done(null, false, { message: 'Incorrect username or password.' });
	      }
				console.log('from passport', user.toJSON());
	      user.validatePassword(password, function(err, isMatch) {
	        	if (err) {
							return done(err);
						}
	        	if (!isMatch) {
	        		return done(null, false, { message: 'Incorrect username or password.' });
	        	}
	        	return done(null, user.toJSON());
	      });
	    });
	  }
	));

	// In case of Facebook, tokenA is the access token, while tokenB is the refersh token.
	// In case of Twitter, tokenA is the token, whilet tokenB is the tokenSecret.
	// var verifySocialAccount = function(tokenA, tokenB, data, done) {
	// 	User.findOrCreate(data, function (err, user) {
	//       	if (err) { return done(err); }
	// 		return done(err, user);
	// 	});
	// };
	//
	// // Plug-in Facebook & Twitter Strategies
	// passport.use(new FacebookStrategy(config.facebook, verifySocialAccount));
	// passport.use(new TwitterStrategy(config.twitter, verifySocialAccount));

	return passport;
}

module.exports = init();
