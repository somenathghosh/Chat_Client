/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes */
'use strict';

const express	 	= require('express');
const router 		= express.Router();
const config = require('../config');
const passport 	= require('passport');
const User = require('../models/user');
// const Room = require('../models/room');
const randomalpha = require('randomstring');
const multer = require('../file');
const redirectURI = {customer:'/client', admin:'/admin-full'};
// accepting a file at a time. This is to stop DoS. At max, it will accept 9 files at time if used array.
const upload = multer.single('file');


router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page

	if (req.isAuthenticated()) {
		// console.log(req.user);
		res.redirect(redirectURI[req.user.role]);
	} else {
		res.render('login', {
			success: req.flash('success')[0],
			errors: req.flash('error'),
			showRegisterForm: req.flash('showRegisterForm')[0],
			iya: 'http://dummyimage.com/250x250/000/fff&text='+randomalpha.generate({length:1, charset: 'SBPM'}),
		});
	}
});

// Login
/**
 * [description]
 * @method
 * @param   {[type]}   req  [description]
 * @param   {[type]}   res  [description]
 * @param   {Function} next [description]
 * @return  {[type]}        [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-15
 */
router.post('/login', function(req, res, next) {
	// console.log(res); // <-- need to find user object
	// console.log(next);
	passport.authenticate('local', function(err, user, info) {
    if (err) {
			return next(err);
		}
		console.log('from login post', user);
    if (!user) {
			console.log('user does not exist');
			return res.render('login', {
				success: null,
				errors: [info.message],
				showRegisterForm: req.flash('showRegisterForm')[0],
				iya: 'http://dummyimage.com/250x250/000/fff&text='+randomalpha.generate({length:1, charset: 'SBPM'}),
			});
		}
    // req / res held in closure
    req.login(user, function(err) {
      if (err) {
				return next(err);
			}
			if (!err) {
				res.redirect(redirectURI[user.role]);
			}
    });
	})(req, res, next);
});

// Register via username and password
/**
 * [description]
 * @method
 * @param   {[type]}   req  [description]
 * @param   {[type]}   res  [description]
 * @param   {Function} next [description]
 * @return  {[type]}        [description]
 * This is a function
 * @author Somenath Ghosh
 * @version [version]
 * @date    2017-06-15
 */
router.post('/register', function(req, res, next) {
	let credentials = {'username'		:req.body.username,
										'firstName'		:req.body.fname,
										'lastName'		:req.body.lname,
										'email' 			:req.body.email,
										'role'				:req.body.role,
										'company'			:req.body.company,
										'password'		:req.body.password,
										};

	if (credentials.username === '' || credentials.password === '' || credentials.role === '' || credentials.comcompany === '') {
		req.flash('error', 'Missing credentials');
		req.flash('showRegisterForm', true);
		res.redirect('/');
	} else {
		// Check if the username already exists for non-social account
		User.findOne({'username': new RegExp('^' + req.body.username + '$', 'i'), 'email' :new RegExp('^' + req.body.email + '$', 'i'), 'socialId': null}, function(err, user) {
			if (err) throw err;
			if (user) {
				req.flash('error', 'Username already exists.');
				req.flash('showRegisterForm', true);
				res.redirect('/');
			} else {
				User.create(credentials, function(err, newUser) {
					if (err) throw err;
					req.flash('success', 'Your account has been created. Please log in.');
					res.redirect('/');
				});
			}
		});
	}
});


/**
 * @param  string '/upload'
 * @param  {} User.isAuthenticated
 * @param  {} User.isAuthorize
 * @param  {} function(req
 * @param  {} res
 * @param  {} next
 */
router.post('/upload', [User.isAuthenticated, User.isAuthorize, function(req, res, next) {
	console.log('At upload route');
	upload(req, res, function(err) {
		if (err) {
			res.status(400).send();
		} else {
			res.status(200).send(); // When front end is ready, send the file meta data in send(req.file);
		}
	});
}]);

// Client
router.get('/client', [User.isAuthenticated, User.isAuthorize, function(req, res, next) {
	// console.log(req.user);
	let user = req.user;
	let settings = {};
	settings.files = {};
	settings.giphy = {};
	settings.files.enable = true;
	settings.giphy.enable = true;
	res.render('client', {
		user,
		settings,
	});
	// User.find({username: {$ne: req.user.username}},function(err, users){
	// 	if(err) throw err;
	// 	res.render('rooms', { users });
	// });
}]);

// Admin - old route
router.get('/admin', [User.isAuthenticated, User.isAuthorize, function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	let user = req.user;
	// console.log(req.originalUrl);
	res.render('admin', {user: user});
}]);

// new admin route
router.get('/admin-full', [User.isAuthenticated, User.isAuthorize, function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	let user = req.user;
	res.render('admin-full', {user: user});
}]);

// external chat widget
router.get('/ping', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	res.setHeader('Access-Control-Allow-Origin', config.parentDomain);
	res.send('OK');
});

// logout
router.get('/logout', function(req, res, next) {
	// remove the req.user property and clear the login session
	req.logout();

	// destroy session data
	req.session = null;

	// redirect to homepage
	res.redirect('/');
});




module.exports = router;
