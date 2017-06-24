'use strict';

const userModel = require('../database').models.user;
const Promise = require('bluebird');

const create = function(data, callback){
	let newUser = new userModel(data);
	newUser.save(callback);
};

const findOne = function (data, callback){
	userModel.findOne(data, callback);
}

const findById = function (id, callback){
	userModel.findById(id, callback);
}

const find = function (data, callback){
	userModel.find(data, callback);
}

const findAdmin = function() {
	return new Promise(function(resolve, reject) {
		userModel
			.find({'role':'admin'})
			.then(function(users){
				let admins = [];
				for (let i=0; i< users.length; i++) {
					admins.push(users[i].username);
				}
				resolve(admins);
			})
			.catch(function(err){
				reject(err);
			});
	});
};


/**
 * Find a user, and create one if doesn't exist already.
 * This method is used ONLY to find user accounts registered via Social Authentication.
 *
 */
var findOrCreate = function(data, callback){
	findOne({'username': data.id}, function(err, user){
		if(err) { return callback(err); }
		if(user){
			return callback(err, user);
		} else {
			var userData = {
				username: data.displayName,
				socialId: data.id,
				picture: data.photos[0].value || null
			};

			// // To avoid expired Facebook CDN URLs
			// // Request user's profile picture using user id
			// // @see http://stackoverflow.com/a/34593933/6649553
			// if(data.provider == "facebook" && userData.picture){
			// 	userData.picture = "http://graph.facebook.com/" + data.id + "/picture?type=large";
			// }

			create(userData, function(err, newUser){
				callback(err, newUser);
			});
		}
	});
}

/**
 * A middleware allows user to get access to pages ONLY if the user is already logged in.
 *
 */
var isAuthenticated = function (req, res, next) {
	if(req.isAuthenticated()){
		next();
	}else{
		res.redirect('/');
	}
}

var isAuthorize = function (req, res, next){
	// let user = req.user;
	let roleMatrix = {'admin': ['/admin', '/admin-full'], 
						'customer': ['/client', '/upload'], 
						};
	console.log(req.user.role, req.originalUrl);
	if (roleMatrix[req.user.role].indexOf(req.originalUrl) < 0) {
		res.redirect('/');
	} else {
		next();
	}
}

module.exports = {
	create,
	findOne,
	findById,
	find,
	findOrCreate,
	isAuthenticated,
	isAuthorize,
	findAdmin,
};
