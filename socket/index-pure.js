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

// const waitKue = new Kue(config.wait_q);
const clientKue = new Kue(config.client_q);
// const activeKue = new Kue(config.active_q);
const adminsKue = new Kue(config.admin_q); // item : [{username: _username}]
let admin_users = [];
// Get all admin from database
User.findAdmin().then(function (users) {
	// console.log(users);
	admin_users = users; // override the config admin users
	console.log('Socket List of admins ', admin_users);
}).catch(function (err) {
	console.log('Socket/findAdmin ==>', err);
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
					} catch (err) {
						console.log('login/admin Error in getting admins in list', err);
					}
					console.log('admin login ==>', admins, admins.indexOf(_data.admin));
					
					if (admins.indexOf(_data.admin) >= 0) { // check if admin already logged in
						socket.emit('login', {
							login: false,
							err: "Already Logged In",
						});
					} else {
						let size = await clientKue.size();
						console.log(`New Admin joined, sending size of list, size: ${size}`);
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
		run(data).then(x => console.log(`login admin successfully run: ${x}`)).catch(err => console.error(`login admin Error: ${err}`));
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
				success = await adminsKue.enqueue(socket.username);
				// let other admin know this admin joined. Assess is this needed or now?
				if (success) {
					let list = await adminsKue.list();
					socket.broadcast.emit("admin added", list);
				} else {
					// TODO handle error
				}
			} catch (err) {
				console.log('add admin ==>', err);
			}
			return 'YES';
		}
		run(data).then(x => console.log(`add admin successfully run: ${x}`)).catch(err => console.error(`add admin Error: ${err}`));

	});


	// Init user
	socket.on('add user', function (data) {

		socket.isAdmin = false;

		let _socket = socket; // making sure scope does not create issue.
		let _this = this;

		async function run(_data) {
			// _socket.isAdmin = false;
			let userDetails, history, newUser, users, success;
			console.log(_data);
			if (_data.isNewUser) {
				if (!_data.roomID) { // this should not get executed, else you can't track who has logged in.
					console.log('roomID not provided when new user');
					_data.roomID = uuid();
				}
				try {
					success = await dbFunctions.setDetails(_data);
					console.log('add user dbFunctions.setDetails success ==>', success);
				} catch (err) {
					console.error('add user dbFunctions.setDetails error ==>', err);
				}
				socket.userDetails = [_data.Name, _data.Email, _data.Phone, _data.Company];
				socket.isUser = true;
				socket.emit("roomID", _data.roomID); // fallback | does not need since roomID is coming from user's uuid
			}

			socket.roomID = _data.roomID;
			try {
				userDetails = await dbFunctions.getDetails(_data.roomID);
				console.log('add dbFunctions.getDetails user details==>', userDetails);
			} catch (err) {
				console.error('add user dbFunctions.getDetails ==>', err);
			}

			socket.join(socket.roomID); // joining chat room for user

			newUser = false;

			try {
				history = await dbFunctions.getMessages(socket.roomID, 0);
			} catch (err) {
				console.error('add user dbFunctions.getMessages ==>', err);
			}

			let result = [];
			for (var msg in history) {
				try {
					result.push(JSON.parse(history[msg]));
				} catch (err) {
					console.log('add user details JSON/history parse problem @ result.push(JSON.parse(history[msg]))');
				}
			}

			console.log('add user history ==> ', result);

			try {
				users = await clientKue.list();
				console.log('add user users in q==>', users);
			} catch (err) {
				console.error('add user clientKue.list ==>', err);
			}

			if (users.indexOf(socket.roomID) < 0) { // Check if different instance of same user. (ie. Multiple tabs)
				// let enqueueClient = await clientKue.enqueue(JSON.stringify(thisUser));
				let enqueueClient;
				try {
					enqueueClient = await clientKue.enqueue(socket.roomID);
					console.log('add user clientKue.enqueue success ==> ', enqueueClient);
				} catch (err) {
					console.error('add user clientKue.enqueue ==>', err);
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
				console.error('add user adminsKue.isEmpty ==>', err);
			}
			let size;
			try {
				size = await clientKue.size();
			} catch (err) {
				console.error('add user clientKue.size ==>', err);
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
					console.log("RECONNECTED");
					socket.broadcast.to(socket.roomID).emit("User Reconnected", socket.roomID);
				}
			}
			return 'YES';
		}

		run(data).then(x => console.log(`add user successfully run: ${x}`)).catch(err => console.error(`add user Error: ${err}`));

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
				console.log('accept client', isEmpty);
			} catch (e) {
				console.error('accept client clientKue.isEmpty ==>', err);
			}
			if (isEmpty === false) {
				try {
					roomID = await clientKue.dequeue();
					console.log('accept client detail ==>', roomID);
				} catch (e) {
					console.error('accept client clientKue.dequeue ==>', err);
				}

				try {
					userDetail = await dbFunctions.getDetails(roomID);
					console.log('accept client userDetail ==>', userDetail);
				} catch (e) {
					console.error('accept client dbFunctions.getDetails ==>', err);
				}

				try {
					history = await dbFunctions.getMessages(roomID, 0);
				} catch (e) {
					console.error('accept client dbFunctions.getMessages ==>', err);
				}

				result = [];
				for (var msg in history) {
					try {
						result.push(JSON.parse(history[msg]));
					} catch (err) {
						console.log('accept client details JSON/history parse problem');
					}
				}
				console.log('accept client history ==> ', result);

				// no need to have so much info to store...but db call will increase
				try {
					len = await dbFunctions.getMsgLength(roomID);
					msgHistoryLen = (len * -1) + 10;
					totalMsgLen = (len * -1);
				} catch (e) {
					console.error('accept client dbFunctions.getMsgLength ==>', err);
				}

				try {
					size = await clientKue.size();
					console.log('accept client size ==>', size);
				} catch (e) {
					console.error('accept client clientKue.size ==>', err);
				}

				socket.join(roomID);
				// console.log('socket ID: ' + newSocket.roomID);
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
		run(data).then(x => console.log(`accept client successfully run: ${x}`)).catch(err => console.error(`accept client Error: ${err}`));
	});

	socket.on('chat message', function (data) {
		if (data.roomID === "null") {
			data.roomID = socket.roomID;
		}
		data.isAdmin = socket.isAdmin;
		dbFunctions.pushMessage(data);

		socket.broadcast.to(data.roomID).emit('chat message', data);
		console.log(data);
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
			console.log('more messages roomID ==>', roomID);
			msgHistoryLen = (data.MsgHistoryLen ? data.MsgHistoryLen : socket.MsgHistoryLen);
			console.log('more messages msgHistoryLen ==>', msgHistoryLen);

			if (msgHistoryLen < 0) {
				let history;

				try {
					history = await dbFunctions.getMessages(roomID, msgHistoryLen);
				} catch (e) {
					console.error('more messages dbFunctions.getMessages ==>', err);
				}

				result = [];
				for (var i in history) {
					// console.log('add user history messages==>',msg);
					try {
						result.push(JSON.parse(history[i]));
					} catch (err) {
						console.log('more messages/history JSON Parse Error @ result.push(JSON.parse(history[i]))');
					}
				}
				msgHistoryLen += 10;
				console.log('more messages history ==> ', result);
				socket.emit('more chat history', {
					history: result,
					roomID: roomID,
					MsgHistoryLen: msgHistoryLen,
				});

			}
			return 'YES';
		}

		run(data).then(x => console.log(`more messages successfully run: ${x}`)).catch(err => console.error(`more messages Error: ${err}`));

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
						let success = await clientKue.dequeue(socket.roomID);
						console.log('leave clientKue.dequeue ==>', success);
					} catch (err) {
						console.log('leave Error in dequeue of users', err);
					}
					// delete users[socket.roomID];
				}
			}
			return 'YES';
		}
		run(data).then(x => console.log(`leave successfully run: ${x}`)).catch(err => console.error(`leave Error: ${err}`));
	});

	socket.on('disconnect', function () {

		async function run() {
			if (socket.isAdmin) {
				console.log('admin disconnect', socket.username);
				// get all roomIDs admin was connected, send disconnect info to all of them
				// socket.broadcast.to(_data.roomID).emit('admin disconnected', _data);
				try {
					let success = await adminsKue.dequeue(socket.username);
					console.log('disconnect adminsKue.dequeue ==>', success);
				} catch (err) {
					console.log('disconnect Error in dequeue of admin', err);
				}

			} else {
				// remove client
				socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
				setTimeout(function () {
					socket.broadcast.to(socket.roomID).emit("User Terminated", socket.roomID);
					try {
						clientKue.dequeue(socket.roomID);
						console.log('disconnect clientKue.dequeue');
					} catch (e) {
						console.log('disconnect Error in dequeue of client', err);
					}
				}, 4000);
			}
			return 'YES';
		}
		run().then(x => console.log(`disconnect successfully run: ${x}`)).catch(err => console.error(`disconnect Error: ${err}`));

	});


});

module.exports = io;
