/* eslint-disable quotes */
'use strict';

// const cache = require('./app/util/cache'); // get cache object to flush and close it.
// const  mongoose = require('mongoose'); //if active mongoose connection, do gracefull close.
// Object to capture process exits and call app specific cleanup function

const client = require('./dbStore/redconnection');

let _cleanup = ()=>{
  console.log('cleaning up');
  console.log(process.memoryUsage());
  client.quit()
  // if(mongoose){
  //   //do graceful close.
  // }
  //
  //
};

module.exports = (function() {
  // attach user callback to the process event emitter
  // if no callback, it will still exit gracefully on Ctrl-C
  // callback = callback || noOp;
  return {
    watch: function() {
      process.on('cleanup', _cleanup);

      // do app specific cleaning before exiting
      process.on('exit', function() {
        process.emit('cleanup');
      });

      // Begin reading from stdin so the process does not exit.
      process.stdin.resume();
      // catch ctrl+c event and exit normally
      process.on('SIGINT', function() {
        console.log('Received SIGINT...');
        process.exit(2);
      });

      process.on('SIGTERM', function() {
        console.log('Received SIGTERM...');
        process.exit(1);
      });

      // catch uncaught exceptions, trace, then exit normally
      process.on('uncaughtException', function(e) {
        console.error('Uncaught Exception...');
        console.log(e.stack);
        process.exit(99);
        // process.exitCode = 99;
      });
    },
  };
})();
