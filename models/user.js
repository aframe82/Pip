var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var libphonenumber = require('google-libphonenumber');

var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: true
	},
	customerId: {
		type: String,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	telephone: {
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
	countryCode: {
		type: String
	},
	auth: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'CronofyAuth'
	},
	session: {
		type: String
	},
	profile_name: {
		type: String
	}
});

UserSchema.pre('save', function(callback) {

	var user = this;

	// Break out if the password hasn't changed
	if (!user.isModified('password')) {
		return callback();
	}

	if (user.isModified('telephone')) {
		var PNF = libphonenumber.PhoneNumberFormat;
		var phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
		var parsedNumber = phoneUtil.parse(user.telephone, "GB");
		user.telephone = phoneUtil.format(parsedNumber, PNF.E164);
	}

	if (user.isModified('username')) {
		user.customerId = "cust" + user.telephone.replace("+", "_");
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

UserSchema.methods.comparePass = function(providedPassword, callback) {
	var user = this;

	bcrypt.compare(providedPassword, user.password, function(err, match) {
		if (err) {
			return callback(err);
		}

		return callback(null, match);
	});
}

module.exports = mongoose.model('users', UserSchema);