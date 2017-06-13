/* eslint-disable quotes, new-cap, max-len, no-var */

'use strict';

const Mongoose 	= require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const validate = require('mongoose-validate');
const settings = require('../../config');
const md5 = require('md5');
// const hash = require('node_hash');
const uuid = require('uuid/v4');

const SALT_WORK_FACTOR = 10;
const DEFAULT_USER_PICTURE = "/img/user.jpg";

/**
 * Every user has a username, password, socialId, and a picture.
 * If the user registered via username and password(i.e. LocalStrategy),
 *      then socialId should be null.
 * If the user registered via social authenticaton,
 *      then password should be null, and socialId should be assigned to a value.
 * 2. Hash user's password
 *
 */
var UserSchema = new Mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        match: /^[\w][\w\-\.]*[\w]$/i,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true, // Only required if local
        trim: true,
        match: new RegExp(settings.passwordRegex),
    },
    socialId: {type: String, default: null},
    picture:  {type: String, default: DEFAULT_USER_PICTURE, },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate: [validate.email, 'invalid email address' ]
    },
    phone: {
        type: String,
        trim: true,
        default: '+1 999-999-9999'
    },
    joined: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        trim: true,
        default: true
    },
    role: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'agent',
        match: /^(?:agent|admin|customer)$/i
    },
    uid: {
        type: String,
        default: uuid(),
        required: true,
        trim: true
    }
},
{
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});


UserSchema.virtual('avatar').get(function() {
    if (!this.email) {
      return null;
    }
    return md5(this.email);
});
/**
 * Before save a user document, Make sure:
 * 1. User's picture is assigned, if not, assign it to default one.
 * 2. Hash user's password
 *
 */
UserSchema.pre('save', function(next) {
    var user = this;

    // ensure user picture is set
    if(!user.picture){
        user.picture = DEFAULT_USER_PICTURE;
    }

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, null, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

/**
 * Create an Instance method to validate user's password
 * This method will be used to compare the given password with the passwoed stored in the database
 *
 */
UserSchema.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};

// EXPOSE ONLY CERTAIN FIELDS
// It's really important that we keep
// stuff like password private!
UserSchema.method('toJSON', function() {
    return {
        id: this._id,
        username: this.username,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        phone: this.phone,
        avatar: this.avatar,
        uuid: this.uid,
        picture: this.picture,
        socialId:this.socialId
    };
});

// Create a user model
module.exports = Mongoose.model('user', UserSchema);
