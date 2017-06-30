'use strict';

const config = require('../config');
const redisClient = require('../dbStore/redconnection');
const EventEmitter = require('events').EventEmitter;
const uuid = require('uuid/v4');
const Promise = require('bluebird');
const client = Promise.promisifyAll(redisClient);

let Kue  = (function(){

	// let _name  = uuid(); // this is name of the queue.
	let _qname;

	class Kue extends EventEmitter {

		constructor(name) {
			super();
			this.on('error', this.printStack);
			this.qname = name;
		}

		printStack(error) {
			console.log(error.stack);
		}

		async del() {
			console.log('Q name ==>', this.qname);
			let success = await client.delAsync(this.qname);
			return success;
		}

		async enqueue(data){
			let success = await client.lpushAsync(this.qname, data);
			return success;
		}

		async dequeue(data) {
			let success;
			if(!data) {
				success = await client.rpopAsync(this.qname);
			} else {
				success = await client.lremAsync(this.qname,data,0);
			}
			return success;
		}

		async size() {
			try {
				let success = await client.llenAsync(this.qname);
				return success;
			} catch(err) {
				console.error('redkue/index: Error in size function ==>', err);
			}
		}

		async isEmpty() {
			try {
				let len = await this.size();
				if (len === 0) return true;
				else return false;
			} catch(err) {
				console.error('redkue/index: Error in isEmpty function ==>', err);
			}
		}

		async list() {
			try {
				let len = await this.size();
				let success = await client.lrangeAsync(this.qname,0,len);
				let result = await success;
				return result;
			} catch(err) {
				console.error('redkue/index: Error in list function ==>', err);
			}

		}
		// End of Public methods
	}
	return Kue;
})();

module.exports = Kue;
