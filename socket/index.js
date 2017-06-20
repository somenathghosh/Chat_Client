/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes, no-invalid-this */
'use strict';
const io = require('socket.io')();
const uuid = require('uuid/v4');
const dbFunctions = require('../dbStore/dbFunctions').new();
const config = require('../config');
const btoa = require('btoa');
const _ = require('underscore');
// const _redq = require('../redq');
const kue = require('../qfifo');
// const mail = require('../mail');	//Configure mail.js and un-comment the mail code

// pull all admin users here
require('../models/user').findAdmin().then(function(users) {
	console.log(users);
	config.admin_users = users; // override the config admin users
}).catch(function(err) {
	console.log(err);
});

let admins = {};
let users = {};

io.on('connection', function(socket) {
	// Login Admin
	socket.on('login', function(data) {
		if (btoa(data.password) != config.key) {
			socket.emit('login', {
				login: false,
				err: "Invalid Login",
			});
		} else {
			if (_.find(config.admin_users, function(admin) {
					return (admin == data.admin);
				})) {
				if (admins[data.admin]) {
					socket.emit('login', {
						login: false,
						err: "Already Logged In",
					});
				} else {
					socket.emit('login', {
						login: true,
						clientsInQueue: kue.size()
					});
				}
			} else {
				socket.emit('login', {
					login: false,
					err: "Invalid Login",
				});
			}
		}
	});


	// Init admin
	socket.on('add admin', function(data) {
		this.isAdmin = data.isAdmin;
		socket.username = data.admin;

		_.each(admins, function(adminSocket) {
			adminSocket.emit("admin added", socket.username);
			socket.emit("admin added", adminSocket.username);
		});

		admins[socket.username] = socket;

		// If some user is already online on chat
		if (Object.keys(users).length > 0) {
			_.each(users, function(userSocket) {
				dbFunctions.getMessages(userSocket.roomID, 0)
					.then(function(history) {
						var len = history.length;
						var userSocket = users[history[len - 1]];
						history.splice(-1, 1);
						socket.join(userSocket.roomID);
						socket.emit("New Client", {
							roomID: userSocket.roomID,
							history: history,
							details: userSocket.userDetails,
							justJoined: true,
						});
					});
			});
		}
	});

	// Init user
	socket.on('add user', function(data) {
		socket.isAdmin = false;
		console.log(data);
		if (data.isNewUser) {
			// data.roomID = uuid(); because you will be getting it from client
			if (!data.roomID) { // this should not get executed, else you can't track who has logged in.
				console.log('roomID not provided when new user');
				data.roomID = uuid();
			}
			dbFunctions.setDetails(data);
			socket.userDetails = [data.Name, data.Email, data.Phone, data.Company];
			socket.emit("roomID", data.roomID);
		}

		socket.roomID = data.roomID;
		// Fetch user details
		if (!data.isNewUser) {
			dbFunctions.getDetails(socket.roomID)
				.then(function(details) {
					console.log('dbFunctions.getDetails ==>', details);
					socket.userDetails = details;
				})
				.catch(function(error) {
					console.log("Line 95 : ", error);
				})
				.done();
		}
		socket.join(socket.roomID);
		var newUser = false;
		if (!users[socket.roomID]) { // Check if different instance of same user. (ie. Multiple tabs)
			users[socket.roomID] = socket;
			newUser = true;
			// console.log(users[socket.roomID]);
			// add new users to the Q
			kue.enqueue(socket);
		}
		// Fetch message history
		dbFunctions.getMessages(socket.roomID, 0)
			.then(function(history) {
				history.splice(-1, 1);
				socket.emit('chat history', {
					history: history,
					getMore: false,
				});
				if (Object.keys(admins).length == 0) {
					// Tell user he will be contacted asap and send admin email
					socket.emit('log message', "Thank you for reaching us." +
						" Please leave your message here and we will get back to you shortly.");
					/* mail.alertMail(); */
				} else {
					if (newUser) {
						socket.emit('log message', "Hello " + socket.userDetails[0] + ", How can I help you?");
						// Make all available admins join this users room.

						//console.log(kue.isEmpty());
						//console.log(kue.size());
						// console.log(kue.dequeue());
						//console.log(kue.isEmpty());

						socket.history = history;
						socket.justJoined = false;

						_.each(admins, function(adminSocket) {
							//adminSocket.join(socket.roomID);
							//TODO: Should this 
							/*adminSocket.emit("New Client", {
								roomID: socket.roomID,
								history: history,
								details: socket.userDetails,
								justJoined: false,
							});*/
							_.each(admins, function(adminSocket) {
								adminSocket.emit('queue update', {clientsInQueue: kue.size()});
							});
						});
					}

					else {
						console.log("RECONNECTED");
						socket.broadcast.to(socket.roomID).emit("User Reconnected", socket.roomID);
					}
				}
			})
			.catch(function(error) {
				console.log("Line 132 : ", error);
			})
			.done();
		dbFunctions.getMsgLength(socket.roomID)
			.then(function(len) {
				socket.MsgHistoryLen = (len * -1) + 10;
				socket.TotalMsgLen = (len * -1);
			})
			.catch(function(error) {
				console.log("Line 140 : ", error);
			})
			.done();
	});

	socket.on('accept client', function(data) {
		if(!kue.isEmpty()) {
			let newSocket = kue.dequeue();

			socket.join(newSocket.roomID);
			//console.log('socket ID: ' + newSocket.roomID);
			socket.emit("New Client", {
				roomID: newSocket.roomID,
				history: newSocket.history,
				details: newSocket.userDetails,
				justJoined: false,
				clientsInQueue: kue.size(),
				MsgHistoryLen: newSocket.MsgHistoryLen,
				TotalMsgLen: newSocket.TotalMsgLen
			});

			_.each(admins, function(adminSocket) {
				socket.emit("queue update", {
					clientsInQueue: kue.size()
				});
			});

			//console.log('client accpted');
			//console.log(kue.size());
		}
		
	});

	socket.on('chat message', function(data) {
		if (data.roomID === "null") {
			data.roomID = socket.roomID;
		}
		data.isAdmin = socket.isAdmin;
		dbFunctions.pushMessage(data);

		socket.broadcast.to(data.roomID).emit('chat message', data);
		console.log(data);
	});

	socket.on("typing", function(data) {
		socket.broadcast.to(data.roomID).emit("typing", {
			isTyping: data.isTyping,
			person: data.person,
			roomID: data.roomID,
		});
	});

	socket.on('disconnect', function() {
		if (socket.isAdmin) {
			delete admins[socket.username];
			_.each(admins, function(adminSocket) {
				adminSocket.emit("admin removed", socket.username);
			});
		} else {
			if (io.sockets.adapter.rooms[socket.roomID]) {
				var total = io.sockets.adapter.rooms[socket.roomID]["length"];
				var totAdmins = Object.keys(admins).length;
				var clients = total - totAdmins;
				if (clients == 0) {
					// check if user reconnects in 40 seconds
					socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
					setTimeout(function() {
						if (io.sockets.adapter.rooms[socket.roomID]) {
							total = io.sockets.adapter.rooms[socket.roomID]["length"];
						}
						totAdmins = Object.keys(admins).length;
						if (total <= totAdmins) {
							/* mail.sendMail({
								roomID: socket.roomID,
								MsgLen: socket.TotalMsgLen,
								email: socket.userDetails
							}); */
							delete users[socket.roomID];
							// dbFunctions.deleteRoom(socket.roomID);
							socket.broadcast.to(socket.roomID).emit("User Terminated", socket.roomID);
							_.each(admins, function(adminSocket) {
								adminSocket.leave(socket.roomID);
							});
						}
					}, 40000);
				}
			} else {
				if (socket.userDetails) {
					// Remove user socket with no admin
					delete users[socket.roomID];

					// Remove user socket from queue
					for(let x = 0; x < kue.size(); x++) {
						let nextSocket = kue.dequeue();
						if(socket.roomID !== nextSocket.roomID) {
							kue.enqueue(nextSocket);
						}
					}

					_.each(admins, function(adminSocket) {
						adminSocket.emit("queue update", {
							clientsInQueue: kue.size()
						});
					});
				}
				/* mail.sendMail({
					roomID: socket.roomID,
					MsgLen: socket.TotalMsgLen,
					email: socket.userDetails
				});*/

				// dbFunctions.deleteRoom(socket.roomID);
			}
		}
	});

	socket.on('leave', function(data) {
		if (socket.isAdmin) {
			admins[socket.username].leave(data.roomID);
			data.isAdmin = socket.isAdmin;
			socket.broadcast.to(data.roomID).emit('admin disconnected', data);
		} else {
			if (io.sockets.adapter.rooms[socket.roomID]) {
				var total = io.sockets.adapter.rooms[socket.roomID]["length"];
				var totAdmins = Object.keys(admins).length;
				var clients = total - totAdmins;
				if (clients == 0) {
					//check if user reconnects in 4 seconds
					setTimeout(function() {
						if (io.sockets.adapter.rooms[socket.roomID])
							total = io.sockets.adapter.rooms[socket.roomID]["length"];
						totAdmins = Object.keys(admins).length;
						if (total <= totAdmins) {
							/*mail.sendMail({
								roomID: socket.roomID,
								MsgLen: socket.TotalMsgLen,
								email: socket.userDetails
							});*/
							delete users[socket.roomID];
							// dbFunctions.deleteRoom(socket.roomID);
							socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
							_.each(admins, function(adminSocket) {
								adminSocket.leave(socket.roomID)
							});
						}
					}, 4000);
				}
			} else {
				if (socket.userDetails)
				/*mail.sendMail({
					roomID: socket.roomID,
					MsgLen: socket.TotalMsgLen,
					email: socket.userDetails
				});*/
					delete users[socket.roomID];
				// dbFunctions.deleteRoom(socket.roomID);
			}
		}
	});

	socket.on('poke admin', function(targetAdmin) {
		admins[targetAdmin].emit("poke admin", {});
	});

	socket.on('client ack', function() {
		var adminSocket;
		for (adminSocket in admins) {
			if (!admins.hasOwnProperty(adminSocket)) {
				continue;
			}
			admins[adminSocket].emit("client ack", {});
		}
	});

	socket.on('req client', function(arg) {
		console.log(arg);
	});


	socket.on("more messages", function(data) {
		let roomID = (data.roomID ? data.roomID : socket.roomID);
		let MsgHistoryLen = (data.MsgHistoryLen ? data.MsgHistoryLen : socket.MsgHistoryLen);

		if (MsgHistoryLen < 0) {
			dbFunctions.getMessages(roomID, MsgHistoryLen)
				.then(function(history) {
					MsgHistoryLen += 10
					history.splice(-1, 1);
					socket.emit('more chat history', {
						history: history,
						roomID: roomID,
						MsgHistoryLen: MsgHistoryLen
					});
				});
		}
	});
});

module.exports = io;
