'use strict';
const RedisSMQ = require('rsmq');
const config = require('../config');
const assert = require('assert');
const redisClient = require('../dbStore/redconnection');
redisClient.on('ready', function() {
  console.log('Connected to RedisQ');
});

redisClient.on('error', function(err) {
  console.log('Failed to connect to RedisQ');
  assert(err instanceof Error);
  assert(err instanceof redis.AbortError);
  assert(err instanceof redis.AggregateError);
  assert.strictEqual(err.errors.length, 2); // The set and get got aggregated in here
  assert.strictEqual(err.code, 'NR_CLOSED');
  console.log(err.stack);
});

const rsmq = new RedisSMQ( {client: redisClient});

// rsmq.createQueue({qname:"myqueue"}, function (err, resp) {
//         console.log(err,resp);
//         if (resp===1) {
//             console.log("queue created")
//         }
//         setTimeout(function() {
//           rsmq.deleteQueue("rsmq:myqueue:Q", function(err) {
//               console.log('myqueue deleted');
//           });
//
//         }, 10000);
//
// });
// // Send a message
// rsmq.sendMessage({qname:"myqueue", message:"Hello World"}, function (err, resp) {
//     if (resp) {
//         console.log("Message sent. ID:", resp);
//     }
// });
// // Receive a message
// rsmq.receiveMessage({qname:"myqueue"}, function (err, resp) {
//     if (resp.id) {
//         console.log("Message received.", resp)
//     }
//     else {
//         console.log("No messages for me...")
//     }
// });
// // Delete a message
// rsmq.deleteMessage({qname:"myqueue", id:"dhoiwpiirm15ce77305a5c3a3b0f230c6e20f09b55"}, function (err, resp) {
//     if (resp===1) {
//         console.log("Message deleted.")
//     }
//     else {
//         console.log("Message not found.")
//     }
// });
// // List queues
// rsmq.listQueues( function (err, queues) {
//     if( err ){
//         console.error( err )
//         return
//     }
//     console.log("Active queues: " + queues.join( "," ) )
// });
//
// setTimeout(function(){
//   rsmq.deleteQueue("myqueue", function(err) {
//     console.log('myqueue deleted');
//   });
//
// }, 20000);


module.exports = rsmq;
