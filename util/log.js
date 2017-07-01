'use strict'; // use function form for better control
const winston = require('winston')
const tsFormat = () => (new Date()).toLocaleTimeString();

const winstonLogger = new (winston.Logger)({
    levels: {
        trace: 0,
        input: 1,
        verbose: 2,
        prompt: 3,
        debug: 4,
        info: 5,
        data: 6,
        help: 7,
        warn: 8,
        error: 9,
      },
      colors: {
        trace: 'magenta',
        input: 'grey',
        verbose: 'cyan',
        prompt: 'grey',
        debug: 'blue',
        info: 'green',
        data: 'grey',
        help: 'cyan',
        warn: 'yellow',
        error: 'red',
    },
    transports: [
        // new (winston.transports.File) ({
        //     filename: 'MyLogs.txt',
        //     handleExceptions: true,
        //     humanReadableUnhandledException: true,
        //     level: 'info',
        //     timestamp: true,
        //     json: false
        // }),
        new (winston.transports.Console) ({
            level: 'info',
            prettyPrint: function(object) {
                return JSON.stringify(object);
            },
            silent: false,
            colorize: true,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            timestamp: tsFormat,
        }),
    ],
});

module.exports = function(fileName) {
    let myLogger = {
        error: function(text, options) {
            winstonLogger.error(fileName + ': ' + text + (options ? options : ''));
        },
        info: function(text, options) {
            winstonLogger.info(fileName + ': ' + text + (options ? options : ''));
        },
    };
    return myLogger;
};
