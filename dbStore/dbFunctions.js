'use strict';

const redis = require('redis');
const config = require('../config');
const Q = require('q');
const EventEmitter = require('events').EventEmitter;
const assert = require('assert');
const redisClient = require('./redconnection');

let DB  = (function(){

	// let redisClient;  // private variable

	class DB extends EventEmitter {

		constructor() {
			super();
			this.on('error', this.printStack);
			// this.ConnectToRedis();
			// this.on('ECONNRESET', function(error){
			// 	console.log(error.stack);
			// })
		}
		printStack(error) {
      console.log(error.stack);
    }


		deleteRoom(roomID) {

			console.log('executing del');
			redisClient.del(roomID);
			redisClient.del(roomID+"-details");
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
			// check if roomID exists or not
			this.getDetails(data.roomID)
			.then(function(detail) {
				console.log('dbFunctions/setDetails ==>', detail);
				if (detail[0] === null && detail[1] === null && detail[2] === null){
					redisClient.hmset(data.roomID + "-details", {
						'Name': data.Name,
						'Email': data.Email,
						'Phone': data.Phone,
						'Company': data.Company,
					});
				}
			})
			.catch(function(err){
				console.log('Error from setDetails', err);
			})
			.done();

		}

		getDetails (roomID) {
			let deffered = Q.defer();
			redisClient.hmget(roomID + "-details", ["Name", "Email", "Phone","Company"], function(err, result) {
				if (!err) {
					deffered.resolve(result)
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}

		getMsgLength (roomID) {
			let deffered = Q.defer();
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
		},
	}


})();
