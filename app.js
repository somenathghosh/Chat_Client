/* eslint-disable new-cap */
'use strict';

process.title = 'Chat_Client';

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('./socket/index-pure');
const config = require('./config');
const morgan = require('morgan');
const path 		= require('path');
const bodyParser 	= require('body-parser');
const session 	= require('./session');
const routes 		= require('./routes');
const watcher = require('./shutdown');
const adapter = require('./subpub');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const helmet = require('helmet');
const flash = require('connect-flash');
const passport = require('./auth');
const csrf = require('csurf');

// Get Environment
let env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env === 'development';
app.locals.ENV_PRODUCTION = env === 'production';

console.log('Starting App as ', env);

// const ninetyDaysInSeconds = 7776000;
// View engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));

// logger
app.use(morgan('dev')); // change this in PROD.

// session
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Set compression before any routes
app.use(compression({threshold: 512}));
app.use(cookieParser());


// Security protections
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
// This needs to in agreement with SSL certs in PROD
// app.use(helmet.hpkp({
//   maxAge: ninetyDaysInSeconds,
//   sha256s: ['cUPcTAZWKaASuYWhhneDttWpY3oBAkE3h2+soZS7sWs==', 'M8HztCzM3elUxkcjR2S5P4hhyBNf6lHkmjAHKhpGPWE=='],
//   reportUri: '/hpkp-report',
//   reportOnly: true,
// }));
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubdomains: true,
    preload: true,
}));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ['\'none\''],
    connectSrc: ['*'],
    scriptSrc: ['\'self\'', '\'unsafe-eval\'', '\'unsafe-inline\'', 'cdnjs.cloudflare.com'], // remove unsafe-line in prod
    styleSrc: ['\'self\'', 'fonts.googleapis.com', '\'unsafe-inline\'', 'cdnjs.cloudflare.com'], // remove unsafe-line in prod
    fontSrc: ['\'self\'', '* data:'],
    mediaSrc: ['\'self\''],
    objectSrc: ['\'self\''],
    imgSrc: ['* data:'],
    reportUri: '/report-violation',
  },
}));

// You need a JSON parser first.
app.use(bodyParser.json({
  type: ['json', 'application/csp-report'],
}));
app.post('/report-violation', function(req, res) {
  if (req.body) {
    console.log('CSP Violation: ', req.body);
  } else {
    console.log('CSP Violation: No data received!');
  }

  res.status(204).end();
});

app.use(csrf());
app.use(function(req, res, next) {
  // Expose variable to templates via locals
  let token = req.csrfToken();
  res.header('X-CSRFToken', token);
  res.locals.csrfToken = token;
  // console.log('sending this csrf ', token);
  next();
});

// static stuffs - assets fingureprinting is required for PROD >>>
// TODO
// let bundles = {};
// app.use(require('connect-assets')({
//     paths: [
//         'public/js',
//         'public/css',
//         'public/components/jquery/dist',
//         'public/components/bootstrap/dist/js',
//         'public/components/bootstrap/dist/css',
//         'node_modules/socket.io-client/dist',
//         'public/components/components-font-awesome/css'
//     ],
//     build: true,
//     fingerprinting: true,
//     servePath: 'public/dist',
//     sourceMaps: true,
//     compress: config.env === 'production', // make it true in prodcuton.
//     bundle: config.env === 'production'
// }));


// routes
app.use('/', routes);


/*
* Startup scripts
*/
/**
 * JS Doc
 */
function startApp() {
	console.log('Starting APP');

	server.listen(config.web_port, function() {
		console.log('Server started ' + config.web_port + ' at ' +
			(new Date().toLocaleString().substr(0, 24)));
	});
	let connectionOptions = {
    'force new connection': true,
    'reconnection': true,
    'reconnectionDelay': 2000,                  // starts with 2 secs delay, then 4, 6, 8, until 60 where it stays forever until it reconnects
    'reconnectionDelayMax': 60000,             // 1 minute maximum delay between connections
    'reconnectionAttempts': 'Infinity',         // to prevent dead clients, having the user to having to manually reconnect after a server restart.
    'timeout': 10000,                           // before connect_error and connect_timeout are emitted.
	};

	// Attach to the http server
	io.attach(server, connectionOptions);
	// Force Socket.io to ONLY use "websockets"; No Long Polling.
	io.set('transports', ['websocket']);
	// attaching redis subpub adapter
	io.adapter(adapter);
}

app.use(function(req, res, next) {
  if (config.env === 'development') {
    // console.log(err.stack);
  }
  res.status(404).render('404.ejs');
});

app.use(function(req, res, next) {
  if (config.env === 'development') {
    // console.log(err.stack);
  }
  res.status(500).render('500.ejs');
});

startApp();

watcher.watch(); // watching for unwanted exceptions, gracefully shutting down the server.


// /usr/local/src/redis-3.2.0
