'use strict';

var Mongoose  = require('mongoose');

/**
 * Each connection object represents a user connected through a unique socket.
 * Each connection object composed of {userId + socketId}. Both of them together are unique.
 *
 */
var FileSchema = new Mongoose.Schema({
    filepath: { type: String, required: true },
    room: { type: String, required: true }
});

var roomModel = Mongoose.model('file', FileSchema);

module.exports = roomModel;