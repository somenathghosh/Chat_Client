'use strict';

const redis = require('redis');
const assert = require('assert');
const config = require('../config');
const EventEmitter = require('events').EventEmitter;

let CONN  = (function(){

  //
  //

  class CONN extends EventEmitter {

    constructor() {
			super();
			this.on('error', this.printStack);
		}

    printStack(error) {
      console.log(error.stack);
    }

    connectToRedis() {
      // let redisClient = redis.createClient({port: config.redis_port,host:config.redis_hostname,password:config.redis_password});
      let redisClient = redis.createClient({url: config.redis});
      redisClient.on('ready', function() {
        console.log('Connected to Redis');
      });

      redisClient.on('error', function(err) {
        console.log('Failed to connect to Redis');
        assert(err instanceof Error);
        assert(err instanceof redis.AbortError);
        assert(err instanceof redis.AggregateError);
        assert.strictEqual(err.errors.length, 2); // The set and get got aggregated in here
        assert.strictEqual(err.code, 'NR_CLOSED');
        console.log(err.stack);
      });

      return redisClient;
    }
  }
  return CONN;

})();

let client = new CONN();


module.exports = client.connectToRedis();
