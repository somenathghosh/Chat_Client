'use strict';

const config = require('../config');
const redisClient = require('../dbStore/redconnection');
const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const Q = require('q');

let Kue  = (function(){

	// let redisClient;  // private variable
	let _name  = uuid(); // this is name of the queue.
	class Kue extends EventEmitter {

		constructor() {
			super();
			this.on('error', this.printStack);
			this.name = _name;
		}
		printStack(error) {
      console.log(error.stack);
    }

		qdel(){
			redisClient.del(this.name);
		}
		enqueue(data) {
			let deffered = Q.defer();
			redisClient.lpush(this.name,data, function(err, reply){
				if (!err) {
					deffered.resolve(reply);
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}
		dequeue() {

			let deffered = Q.defer();
			redisClient.rpop(this.name, function(err, message){
				if (!err) {
					deffered.resolve(message);
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}

		size() {
			let deffered = Q.defer();
			redisClient.llen(this.name, function(err, len) {
				if (!err) {
					deffered.resolve(len);
				} else {
					deffered.reject(err);
				}
			});
			return deffered.promise;
		}

		isEmpty() {
			let deffered = Q.defer();
			this.size()
			.then(function(len) {
			  if(len === 0) {
					deffered.resolve(true);
				} else {
					deffered.resolve(false);
				}
			})
			.catch(function(err){
			  deffered.reject(err);
			});
			return deffered.promise;
		}


	}
	return Kue;
})();

module.exports = new Kue();
