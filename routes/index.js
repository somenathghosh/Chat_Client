'use strict';

var express	 	= require('express');
var router 		= express.Router();
var config = require('../config');

router.get('/', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page

	res.render('client',{});

});


router.get('/admin', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page

	res.render('admin',{});

});


router.get('/ping', function(req, res, next) {
	// If user is already logged in, then redirect to rooms page

	res.setHeader('Access-Control-Allow-Origin', config.parentDomain);
	res.send("OK");

});


module.exports = router;
