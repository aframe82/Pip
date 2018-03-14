var LocalStrategy = require('passport-local').Strategy;
var Admin = require('../models/admin');

module.exports = function(passport) {

	passport.serializeUser(function(user, done) {
		done(null, user.id)
	});

	passport.deserializeUser(function(id, done) {
		Admin.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use('local', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, username, password, done) {
		Admin.findOne({
			username: username,
			verified: true
		}, function(err, user) {
			if (err) {
				return done(err);
			}

			if (!user) {
				return done(null, false, {message: "User not found"}); 
			}

			user.comparePass(req.body.password, function(err, match) {
				console.log(match);
				if (err || !match) {
					return done(null, false, {message: "Bad password"}); 
				}

				return done(null, user)
			});
		});
	}));
}