var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var libphonenumber = require('google-libphonenumber');

var AdminSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	firstName: {
		type: String,
		required: true
	},
	lastName: {
		type: String,
		required: true
	},
	verified: {
		type: Boolean,
		default: false
	}
});

AdminSchema.pre('save', function(callback) {

	var user = this;

	// Break out if the password hasn't changed
	if (!user.isModified('password')) {
		return callback();
	}

	// Password changed so we need to hash it
	bcrypt.genSalt(10, function(err, salt) {
		if (err) {
			return callback(err);
		} 

		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) {
				return callback(err);
			}
			user.password = hash;
			callback();
		});
	});
});

AdminSchema.methods.comparePass = function(providedPassword, callback) {
	var user = this;

	bcrypt.compare(providedPassword, user.password, function(err, match) {
		if (err) {
			return callback(err);
		}

		return callback(null, match);
	});
}

module.exports = mongoose.model('admin', AdminSchema);