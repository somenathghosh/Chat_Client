'use strict';

const express	 	= require('express');
const router 		= express.Router();
const config = require('../config');
const passport 	= require('passport');
const User = require('../models/user');
const Room = require('../models/room');
const randomalpha = require('randomstring');
const redirectURI = {customer:'/client', admin:'/admin'  };

router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page

	if (req.isAuthenticated()) {
		// console.log(req.user);
		res.redirect(redirectURI[req.user.role]);
	}
	else {
		res.render('login', {
			success: req.flash('success')[0],
			errors: req.flash('error'),
			showRegisterForm: req.flash('showRegisterForm')[0],
			iya: 'http://dummyimage.com/250x250/000/fff&text='+randomalpha.generate({length:1, charset: 'SBPM'})
		});
	}
});
// 	res.render('client',{});
//
// });

// Login
// router.post('/login', function(req, res, next) {
// 	console.log(res); // <-- need to find user object
// 	console.log(next);
// 	passport.authenticate('local', {
// 		successRedirect: redirectURI['customer'],
// 		failureRedirect: '/',
// 		failureFlash: true
// 	})(req, res, next);
// });


// Login
router.post('/login', function(req, res, next) {
	// console.log(res); // <-- need to find user object
	// console.log(next);
	passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/'); }

    // req / res held in closure
    req.login(user, function(err) {

      if (err) {
				return next(err);
			}
			if(!err) {
				// req.session.user = user;
				// console.log(user);
	      res.redirect(redirectURI[user.role]);
			}

    });
	})(req, res, next);
});

// Register via username and password
router.post('/register', function(req, res, next) {

	let credentials = {	'username'		:req.body.username,
											'firstName'		:req.body.fname,
											'lastName'		:req.body.lname,
											'email' 			:req.body.email,
											'role'				:req.body.role,
											'password'		:req.body.password
										};

	if (credentials.username === '' || credentials.password === ''){
		req.flash('error', 'Missing credentials');
		req.flash('showRegisterForm', true);
		res.redirect('/');
	} else {

		// Check if the username already exists for non-social account
		User.findOne({'username': new RegExp('^' + req.body.username + '$', 'i'), 'email' :new RegExp('^' + req.body.email + '$', 'i'), 'socialId': null}, function(err, user){
			if (err) throw err;
			if (user) {
				req.flash('error', 'Username already exists.');
				req.flash('showRegisterForm', true);
				res.redirect('/');
			} else {
				User.create(credentials, function(err, newUser){
					if(err) throw err;
					req.flash('success', 'Your account has been created. Please log in.');
					res.redirect('/');
				});
			}
		});
	}
});

router.get('/admin-full', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page

	res.render('admin-full',{});

});

// Rooms
router.get('/client', [User.isAuthenticated, function(req, res, next) {
	// console.log(req.user);
	let user = req.user;
	res.render('client', {user});
	// User.find({username: {$ne: req.user.username}},function(err, users){
	// 	if(err) throw err;
	// 	res.render('rooms', { users });
	// });
}]);

router.get('/admin', [User.isAuthenticated, function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	let user = req.user;
	res.render('admin', {user: user});
}]);


router.get('/ping', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page
	res.setHeader('Access-Control-Allow-Origin', config.parentDomain);
	res.send("OK");
});


router.get('/logout', function(req, res, next) {
	// remove the req.user property and clear the login session
	req.logout();

	// destroy session data
	req.session = null;

	// redirect to homepage
	res.redirect('/');
});


module.exports = router;
