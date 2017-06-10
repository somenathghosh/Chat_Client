'use strict';

const redis = require('redis');
const config = require('../config');
const Q = require('q');
const EventEmitter = require('events').EventEmitter;
const assert = require('assert');

let DB  = (function(){

	let redisClient;  // private variable

	class DB extends EventEmitter {

		constructor() {
			super();
			this.on('error', this.printStack);
		}
		printStack(error) {
      console.log(error.stack);
    }

		ConnectToRedis(callback) {
			redisClient = redis.createClient({
																				port: config.redis_port,
																				host: config.redis_hostname,
																				password: config.redis_password
																				});

			redisClient.on('ready', function() {
				console.log('Connected to Redis');
				 // startApp(true);
				 callback(true);
			});

			redisClient.on('error', function(err) {
				console.log('Failed to connect to Redis');
				assert(err instanceof Error);
		    assert(err instanceof redis.AbortError);
		    assert(err instanceof redis.AggregateError);
		    assert.strictEqual(err.errors.length, 2); // The set and get got aggregated in here
		    assert.strictEqual(err.code, 'NR_CLOSED');
				console.log(err.stack);
				 // startApp(false);
				 callback(false);
			});
		}

		deleteRoom(roomID){

			// redisClient.del(roomID);

		}

		getMessages(roomID, startPos, endPos) {
			console.log(roomID, startPos, endPos);
			if (endPos == undefined) {
				if (startPos > -10 && startPos < 0)
					endPos = -1;
				else
					endPos = startPos + 9
			}
			var deffered = Q.defer();
			redisClient.lrange(roomID, startPos, endPos, function(err, res) {
				if (!err) {
					var result = [];
					// Loop through the list, parsing each item into an object
					for (var msg in res){
						console.log(msg);
						result.push(JSON.parse(res[msg]));
					}
					result.push(roomID);
					deffered.resolve(result)
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}

		pushMessage (data) {
			redisClient.lpush(data.roomID, JSON.stringify({
				who: data.isAdmin,
				what: data.msg,
				when: data.timestamp
			}));
		}

		setDetails (data) {
			redisClient.hmset(data.roomID + "-details", {
				'Name': data.Name,
				'Email': data.Email,
				'Phone': data.Phone
			});
		}

		getDetails (roomID) {
			var deffered = Q.defer();
			redisClient.hmget(roomID + "-details", ["Name", "Email", "Phone"], function(err, result) {
				if (!err) {
					deffered.resolve(result)
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}

		getMsgLength (roomID) {
			var deffered = Q.defer();
			redisClient.llen(roomID, function(err, len) {
				if (!err) {
					deffered.resolve(len);
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}



	}

	return DB;



})();


module.exports = (() => {
	console.log('creating Singleton');

	let db;
	return {
		new: () =>{
			if(!db) {
		    console.log('creating new DB');
				db = new DB();
		  }
		  else {
		    console.log('returning already created DB');
		  }
			return db;
		}
	}


})();

// exports.ConnectToRedis = function(callback) {
// 	redisClient = redis.createClient({
// 																		port: config.redis_port,
// 																		host: config.redis_hostname,
// 																		password: config.redis_password
// 																		});
//
// 	redisClient.on('ready', function() {
// 		console.log('Connected to Redis');
// 		 // startApp(true);
// 		 callback(true);
// 	});
//
// 	redisClient.on('error', function() {
// 		console.log('Failed to connect to Redis');
// 		 // startApp(false);
// 		 callback(false);
// 	});
// }
//
// exports.deleteRoom = function(roomID){
//
// 	redisClient.del(roomID);
//
// }
//
// exports.getMessages = function(roomID, startPos, endPos) {
// 	console.log(roomID, startPos, endPos);
// 	if (endPos == undefined) {
// 		if (startPos > -10 && startPos < 0)
// 			endPos = -1;
// 		else
// 			endPos = startPos + 9
// 	}
// 	var deffered = Q.defer();
// 	redisClient.lrange(roomID, startPos, endPos, function(err, res) {
// 		if (!err) {
// 			var result = [];
// 			// Loop through the list, parsing each item into an object
// 			for (var msg in res){
// 				console.log(msg);
// 				result.push(JSON.parse(res[msg]));
// 			}
// 			result.push(roomID);
// 			deffered.resolve(result)
// 		} else {
// 			deffered.reject(err);
// 		}
// 	});
// 	return deffered.promise;
// }
//
// exports.pushMessage = function(data) {
// 	redisClient.lpush(data.roomID, JSON.stringify({
// 		who: data.isAdmin,
// 		what: data.msg,
// 		when: data.timestamp
// 	}));
// }
//
// exports.setDetails = function(data) {
// 	redisClient.hmset(data.roomID + "-details", {
// 		'Name': data.Name,
// 		'Email': data.Email,
// 		'Phone': data.Phone
// 	});
// }
//
// exports.getDetails = function(roomID) {
// 	var deffered = Q.defer();
// 	redisClient.hmget(roomID + "-details", ["Name", "Email", "Phone"], function(err, result) {
// 		if (!err) {
// 			deffered.resolve(result)
// 		} else {
// 			deffered.reject(err);
// 		}
// 	});
// 	return deffered.promise;
// }
//
// exports.getMsgLength = function(roomID) {
// 	var deffered = Q.defer();
// 	redisClient.llen(roomID, function(err, len) {
// 		if (!err) {
// 			deffered.resolve(len);
// 		} else {
// 			deffered.reject(err);
// 		}
// 	});
// 	return deffered.promise;
// }
