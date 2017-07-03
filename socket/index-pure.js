/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes, no-invalid-this, no-multiple-empty-lines */
'use strict'; // use function form for better control

/**
 * Main module for Socket - Middlewares. This is how it works
 * Scenario-1: Client logs in & no admin is in.
 * --> Client should get message like 'Thanks for reaching out to us...etc.'
 * =============================================================================
 * Scenario-2: Client logs in & admin/(s) is/are online.
 * --> User's roomID will be put into Redis based Wait Kue. (Rememeber it is not Q as in datastructure, but called Kue (~Q as Queue))
 * --> Kue size should get broadcasted to all admins.
 * --> Any one of Admin accepts the client, that admin socket gets attached to Client's roomID. Client can start chatting.
 * Scenario-2.1: client's connection interupted. So is Socket.
 * --> Wait for 40 secs(?), before deleting the Client from Active Kue.
 * If client does not get back in 40 sec {
 * Delete him from Active Kue
 * }
 * else {
 * attach Client back to same admin(Techically the admin has to be attached)
 * }
 * Scenario-2.2: Admin's connection interupted. So is Socket.
 * --> Wait for 40 secs(?), before deleting admin from Active Kue.
 * If {
 * admin joins back, put him back to Chat room.
 * } Else {
 * Put the client back to Waiting Kue, with a priority 1. Front end should distinguish the client clearly.
 * }
 *Scenario-2.3: Admin Logs off.
 *If active connection ON {
 *Impossible scenario. Stop Admin going off if any active conversion is on.
 *} Else {
 * Remove him from Admin Kue(available Kue).
 *}
 *Scenario-2.4: Client Logs off and Logs back in.
 *--> Same as 2.1 (40 secs rule apply here too)
 *=============================================================================
 *Wait Kue: Client RoomIDs waiting for admin socket to be attached.
 *Active Kue: Active Chat sessions(active ind-> true, false).
 */

const io = require('socket.io')();
const dbFunctions = require('../dbStore/db');
const config = require('../config');
const btoa = require('btoa');
const _ = require('underscore');
const Kue = require('../redkue');
const User = require('../models/user');
const winston = require('../util/log')('socket/index-pure');

const clientKue = new Kue(config.wait_q);
// const activeKue = new Kue(config.active_q);
const adminsKue = new Kue(config.admin_q); // item : [{username: _username}]

//override console object with winston
winston.info = console.log;
winston.error = console.error;

let admin_users = [];
winston.level = process.env.LOG_LEVEL;
// Get all admin from database
User.findAdmin().then(function (users) {
	// winston.info(users);
	admin_users = users; // override the config admin users
	winston.info('Socket List of admins ', admin_users);
}).catch(function (err) {
	winston.info('Socket/findAdmin ==>', err);
	throw new Error('Error in getting Admin list, shuting down app instance');
});



io.on('connection', function (socket) {
	// Login Admin
	socket.on('login', function (data) {
		let _socket = socket; // making sure scope does not create issue.
		let _this = this;
		async function run(_data) {
			if (btoa(data.password) != config.key) {
				socket.emit('login', {
					login: false,
					err: "Invalid Login",
				});
			} else {
				if (admin_users.indexOf(_data.admin) >= 0) {
					let admins;
					try {
						admins = await adminsKue.list();
						admins.splice(-1,1);
					} catch (err) {
						winston.info('login/admin Error in getting admins in list', err);
					}
					winston.info('admin login ==>', admins, admins.indexOf(_data.admin));

					if (admins.indexOf(_data.admin) >= 0) { // check if admin already logged in
						socket.emit('login', {
							login: false,
							err: "Already Logged In",
						});
					} else {
						let size = await clientKue.size();
						size--;
						winston.info(`New Admin joined, sending size of list, size: ${size}`);
						socket.emit('login', {
							login: true,
							clientsInQueue: size,
						});
					}
				} else {
					socket.emit('login', {
						login: false,
						err: "Invalid Login",
					});
				}
			}
			return 'YES';
		}
		run(data).then(x => winston.info(`login admin successfully run: ${x}`)).catch(err => winston.error(`login admin Error: ${err}`));
	});

	// Init admin
	socket.on('add admin', function (data) {
		this.isAdmin = data.isAdmin;
		socket.username = data.admin;
		let _socket = socket; // making sure scope does not create issue.
		let _this = this;
		async function run(_data) {
			let success;
			try {
				success = await adminsKue.enqueue(_data.admin);
				console.log('add admin already in rooms ==> ', _data.listOfClients);
				if(_data.listOfClients && _data.listOfClients > 1) {
					_.each(_data.listOfClients, x => {
						console.log('admin rejoins to room ==>', x);
							socket.join(x)
					});
				}
			} catch (err) {
				winston.info('add admin ==>', err);
			}
			return 'YES';
		}
		run(data).then(x => winston.info(`add admin successfully run: ${x}`)).catch(err => winston.error(`add admin Error: ${err}`));

	});


	// Init user
	socket.on('add user', function (data) {

		socket.isAdmin = false;
		socket.roomID = data.roomID;

		let _socket = socket; // making sure scope does not create issue.
		let _this = this;

		async function run(_data) {
			// _socket.isAdmin = false;
			let userDetails, history, newUser, users, success;
			winston.info(_data);
			if (_data.isNewUser) {
				if (!_data.roomID) { // this should not get executed, else you can't track who has logged in.
					winston.info('roomID not provided when new user');
					_data.roomID = uuid();
				}
				socket.userDetails = [_data.Name, _data.Email, _data.Phone, _data.Company];
				socket.isUser = true;
				socket.emit("roomID", _data.roomID); // fallback | does not need since roomID is coming from user's uuid
			}

			socket.roomID = _data.roomID;
			console.log('add user got roomID as ', socket.roomID);
			try {
				if(socket.userDetails) {
					userDetails = socket.userDetails;
					winston.info('add dbFunctions.getDetails user details from socket ==>', userDetails);
				} else {
					userDetails = await dbFunctions.getDetails(_data.roomID);
					socket.userDetails = userDetails;
					winston.info('add dbFunctions.getDetails user details==>', userDetails);
				}
			} catch (err) {
				winston.error('add user dbFunctions.getDetails ==>', err);
			}

			console.log('user ', socket.userDetails[0], ' joining room ', socket.roomID);

			socket.leave(socket.roomID);
			socket.join(socket.roomID); // joining chat room for user

			newUser = false;

			try {
				history = await dbFunctions.getMessages(socket.roomID, 0);
			} catch (err) {
				winston.error('add user dbFunctions.getMessages ==>', err);
			}

			let result = [];
			for (var msg in history) {
				try {
					result.push(JSON.parse(history[msg]));
				} catch (err) {
					winston.info('add user details JSON/history parse problem @ result.push(JSON.parse(history[msg]))');
				}
			}

			winston.info('add user history ==> ', result);

			try {
				users = await clientKue.list();
				users.splice(-1,1);
				winston.info('add user users in q==>', users);
			} catch (err) {
				winston.error('add user clientKue list ==>', err);
			}

			if (users.indexOf(socket.roomID) < 0 && _data.isNewUser) { // Check if different instance of same user. (ie. Multiple tabs)
				// let enqueueClient = await clientKue.enqueue(JSON.stringify(thisUser));
				let enqueueClient;
				try {
					enqueueClient = await clientKue.enqueue(socket.roomID);
					winston.info('add user clientKue.enqueue success ==> ', enqueueClient);
				} catch (err) {
					winston.error('add user clientKue.enqueue ==>', err);
				}

				if (enqueueClient) {
					newUser = true;
				} else {
					throw new Error('enqueue issue');
				}
			}
			socket.emit('chat history', {
				history: result,
				getMore: false,
			});

			let isNoAdmin;
			try {
				isNoAdmin = await adminsKue.isEmpty();
			} catch (err) {
				winston.error('add user adminsKue.isEmpty ==>', err);
			}
			let size;
			try {
				size = await clientKue.size();
				size--;
			} catch (err) {
				winston.error('add user clientKue.size ==>', err);
			}

			if (isNoAdmin) {
				socket.emit('log message', "Thank you for reaching us." +
					" Please leave your message here and we will get back to you shortly.");
			} else {
				if (newUser) {
					socket.emit('log message', "Hello " + userDetails[0] + ", how can I help you?");
					// _socket.history = history;
					// _socket.justJoined = false;

					socket.broadcast.emit('queue update', {
						clientsInQueue: size
					});
				} else {
					winston.info("RECONNECTED");
					socket.broadcast.to(socket.roomID).emit("User Reconnected", socket.roomID);
				}
			}

			return 'YES';
		}
		//async function...important, but no need to wait for anything
		dbFunctions.getMsgLength(socket.roomID).then(function(len) {
				socket.MsgHistoryLen = (len * -1) + 10;
				socket.TotalMsgLen = (len * -1);
		}).catch(function(error) {
				console.log("add user dbFunctions.getMsgLength Error: ", error);
		});
		run(data).then(x => winston.info(`add user successfully run: ${x}`)).catch(err => winston.error(`add user Error: ${err}`));

	});


	socket.on('accept client', function (data) {
		let _socket = socket; // making sure scope does not create issue.
		let _this = this;

		async function run(_data) {
			let isEmpty,
				roomID,
				userDetail,
				history,
				result,
				len,
				msgHistoryLen,
				totalMsgLen,
				size;

			try {
				isEmpty = await clientKue.isEmpty();
				winston.info('accept client', isEmpty);
			} catch (e) {
				winston.error('accept client clientKue.isEmpty ==>', err);
			}
			if (isEmpty === false) {
				try {
					roomID = await clientKue.dequeue();
					winston.info('accept client detail ==>', roomID);
				} catch (e) {
					winston.error('accept client clientKue.dequeue ==>', err);
				}

				try {
					userDetail = await dbFunctions.getDetails(roomID);
					winston.info('accept client userDetail ==>', userDetail);
				} catch (e) {
					winston.error('accept client dbFunctions.getDetails ==>', err);
				}

				try {
					history = await dbFunctions.getMessages(roomID, 0);
				} catch (e) {
					winston.error('accept client dbFunctions.getMessages ==>', err);
				}

				result = [];
				for (var msg in history) {
					try {
						result.push(JSON.parse(history[msg]));
					} catch (err) {
						winston.info('accept client details JSON/history parse problem');
					}
				}
				winston.info('accept client history ==> ', result);

				// no need to have so much info to store...but db call will increase
				try {
					len = await dbFunctions.getMsgLength(roomID);
					msgHistoryLen = (len * -1) + 10;
					totalMsgLen = (len * -1);
				} catch (e) {
					winston.error('accept client dbFunctions.getMsgLength ==>', err);
				}

				try {
					size = await clientKue.size();
					size--;
					winston.info('accept client size ==>', size);
				} catch (e) {
					winston.error('accept client clientKue.size ==>', err);
				}
				winston.info('accept cliet', socket.attached_rooms);
				if(!socket.attached_rooms){
					socket.attached_rooms = [];
				}
				socket.attached_rooms.push(roomID); // have track of all roooms admin connected with
				socket.join(roomID);
				// winston.info('socket ID: ' + newSocket.roomID);
				socket.emit("New Client", {
					roomID: roomID,
					history: result,
					details: userDetail,
					justJoined: false,
					clientsInQueue: size,
					MsgHistoryLen: msgHistoryLen,
					TotalMsgLen: totalMsgLen,
				});

				socket.broadcast.emit('queue update', {
					clientsInQueue: size
				});
			}
			return 'YES';
		}
		run(data).then(x => winston.info(`accept client successfully run: ${x}`)).catch(err => winston.error(`accept client Error: ${err}`));
	});

	socket.on('chat message', function (data) {
		if (data.roomID === "null" || data.roomID === undefined || data.roomID === null) {
			data.roomID = socket.roomID;
		}
		data.isAdmin = socket.isAdmin;
		dbFunctions.pushMessage(data);
		console.log('chat message roomID', data.roomID);
		socket.broadcast.to(data.roomID).emit('chat message', data);
		winston.info('chat message ==> ',data);
	});

	socket.on("typing", function (data) {
		socket.broadcast.to(data.roomID).emit("typing", {
			isTyping: data.isTyping,
			person: data.person,
			roomID: data.roomID,
		});
	});

	socket.on("more messages", function (data) {

		async function run(data) {
			let roomID,
				msgHistoryLen,
				result;

			roomID = (data.roomID ? data.roomID : socket.roomID);
			winston.info('more messages roomID ==>', roomID);
			msgHistoryLen = (data.MsgHistoryLen ? data.MsgHistoryLen : socket.MsgHistoryLen);
			winston.info('more messages msgHistoryLen ==>', msgHistoryLen, ' socket message len ==>', socket.MsgHistoryLen);

			if (msgHistoryLen < 0) {
				let history;

				try {
					history = await dbFunctions.getMessages(roomID, msgHistoryLen);
				} catch (e) {
					winston.error('more messages dbFunctions.getMessages ==>', err);
				}

				result = [];
				for (var i in history) {
					// winston.info('add user history messages==>',msg);
					try {
						result.push(JSON.parse(history[i]));
					} catch (err) {
						winston.info('more messages/history JSON Parse Error @ result.push(JSON.parse(history[i]))');
					}
				}
				msgHistoryLen += 10;
				socket.MsgHistoryLen += 10;
				winston.info('more messages history ==> ', result);
				socket.emit('more chat history', {
					history: result,
					roomID: roomID,
					MsgHistoryLen: msgHistoryLen,
				});

			}
			return 'YES';
		}

		run(data).then(x => winston.info(`more messages successfully run: ${x}`)).catch(err => winston.error(`more messages Error: ${err}`));

	});

	socket.on('client ack', function () {
		socket.broadcast.emit("client ack", {});
	});

	socket.on('leave', function (data) {

		async function run(_data) {
			if (socket.isAdmin) {
				socket.leave(_data.roomID);
				_data.isAdmin = socket.isAdmin;
				socket.broadcast.to(_data.roomID).emit('admin disconnected', _data);
			} else {
				if (socket.userDetails) {
					socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
					try {
						// let success = await clientKue.dequeue(socket.roomID);
						// winston.info('leave clientKue.dequeue ==>', success);
					} catch (err) {
						winston.info('leave Error in dequeue of users', err);
					}
					// delete users[socket.roomID];
				}
			}
			return 'YES';
		}
		run(data).then(x => winston.info(`leave successfully run: ${x}`)).catch(err => winston.error(`leave Error: ${err}`));
	});

	socket.on('disconnect', function () {

		async function run() {
			if (socket.isAdmin) {
				winston.info('admin disconnect', socket.username);
				_.each(socket.attached_rooms, x => {
						winston.info('admin disconnect', x);
						socket.broadcast.to(x).emit('admin disconnected', x);
				});
				// socket.leave(_data.roomID);
				// _data.isAdmin = socket.isAdmin;
				// socket.broadcast.to(_data.roomID).emit('admin disconnected', _data);
				// get all roomIDs admin was connected, send disconnect info to all of them
				// socket.broadcast.to(_data.roomID).emit('admin disconnected', _data);
				try {
					let success = await adminsKue.dequeue(socket.username);
					winston.info('disconnect adminsKue.dequeue ==>', success);
				} catch (err) {
					winston.info('disconnect Error in dequeue of admin', err);
				}

			} else {
				// remove client
				socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
				setTimeout(function () {
					socket.broadcast.to(socket.roomID).emit("User Terminated", socket.roomID);
					try {
						// clientKue.dequeue(socket.roomID);
						winston.info('disconnect clientKue.dequeue');
					} catch (e) {
						winston.info('disconnect Error in dequeue of client', err);
					}
				}, 4000);
			}
			return 'YES';
		}
		run().then(x => winston.info(`disconnect successfully run: ${x}`)).catch(err => winston.error(`disconnect Error: ${err}`));

	});

	socket.on('upload', function(data) {
		if (data.roomID === "null") {
			data.roomID = socket.roomID;
		}
		data.isAdmin = socket.isAdmin;

		//TODO: Save message

		socket.broadcast.to(data.roomID).emit('upload', data);
	});


});

module.exports = io;
