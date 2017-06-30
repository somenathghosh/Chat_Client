/* eslint-disable new-cap, max-len, no-var, key-spacing, quotes, no-invalid-this, no-multiple-empty-lines */
'use strict';
const Q = require('q');
const EventEmitter = require('events').EventEmitter;
const redisClient = require('./redconnection');
const Promise = require('bluebird');
const client = Promise.promisifyAll(redisClient);

let DB  = (function(){
	class DB extends EventEmitter {

		constructor() {
			super();
			this.on('error', this.printStack);
		}
		printStack(error) {
      console.log(error.stack);
    }

		async deleteRoom(roomID) {
			try {
				console.log('DB/deleteRoom: executing del');
				let success = await client.delAsync(roomID);
				return success;
			} catch(err) {
				console.error('db/index: Error in deleteRoom function ==>', err);
			}
		}

		async getMessages(roomID, startPos, endPos) {
			try {
				// console.log(roomID, startPos, endPos);
				if (endPos == undefined) {
					if (startPos > -10 && startPos < 0)
						endPos = -1;
					else
						endPos = startPos + 9
				}
				let success = await client.lrangeAsync(roomID, startPos, endPos)
				return success;
			} catch(err) {
				console.error('db/index: Error in getMessages function ==>', err);
			}
		}

		async pushMessage(data) {
			try {
				let success = client.lpushAsync(data.roomID, JSON.stringify({
					who: data.isAdmin,
					what: data.msg,
					when: data.timestamp
				}));
				return success;

			} catch (err) {
				console.error('db/index: Error in pushMessage function ==>', err);
			}
		}

		async setDetails (data) {
			// check if roomID exists or not
			//
			let success = await this.getDetails(data.roomID);
			let detail = await success;

			if (detail[0] === null && detail[1] === null && detail[2] === null) {
				console.log('not available');
				try {
					let success = await client.hmsetAsync(data.roomID + "-details", {
						'Name': data.Name,
						'Email': data.Email,
						'Phone': data.Phone,
						'Company': data.Company,
					});
					return success;
				} catch(err) {
					console.error('db/index: Error in getDetails/inside Promise function ==>', err);
				}
			}
			else {
				console.log('Available');
			}
		}

		async getDetails (roomID) {
			try {
				let success = client.hmgetAsync(roomID + "-details", ["Name", "Email", "Phone","Company"]);
				return success;
			} catch(err) {
				console.error('db/getDetails: Error in getDetails/inside Promise function ==>', err);
			}

		}

		async getMsgLength (roomID) {
			try {
				let success = client.llenAsync(roomID);
				return success;
			} catch(err) {
				console.error('db/getMsgLength: Error in getMsgLength/inside Promise function ==>', err);
			}

		}
	}
	return DB;
})();


module.exports = new DB();
