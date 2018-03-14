var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config/config');
var mongoose = require('mongoose');
var Customer = mongoose.model('customers');
var Calendar = mongoose.model('calendars');
var User = require('../models/user');
var CronofyAuth = mongoose.model('cronofyAuths');
var cronofy = require('cronofy');

var oauth2 = require('simple-oauth2')(config.cronofy_credentials);
var authorization_uri = oauth2.authCode.authorizeURL(config.cronofy_auth_uri);

mongoose.Promise = global.Promise;

router.get('/', function(req, res) {
	res.redirect(authorization_uri);
});

router.get('/callback', function(req, res) {

	var token;
	var tokenConfig = {
		code: req.query.code,
		redirect_uri: config.cronofy_auth_uri.redirect_uri
	}

	var session = req.query.state;

	oauth2.authCode.getToken(tokenConfig)
	.then(function saveToken(result) {
		console.log(result);
		token = oauth2.accessToken.create(result);

		var email = result.linking_profile.profile_name;
		console.log(email);
		// var authedUser;

		User.findOne({
			session: session
			// 'username': email
		}, function(err, user) {
			if (err) {
				return console.error(err);
			} 
			user.profile_name = email;
			// authedUser = user;
			console.log(user);
			// The user must exist in testing
			if (!user.auth) {
				var auth = new CronofyAuth();
				auth.access_token = result.access_token;
				auth.token_type = result.token_type;
				auth.expires_in = result.expires_in;
				auth.refresh_token = result.refresh_token;
				auth.scope = result.scope;
				auth.account_id = result.account_id;
				auth.linking_profile.provider_name = result.linking_profile.provider_name;
				auth.linking_profile.profile_id = result.linking_profile.profile_id;
				auth.linking_profile.profile_name = result.linking_profile.profile_name; 
				auth.expires_at = result.expires_at;
				auth.user = user._id;
				auth.save(function(err) {
					if (err) {
						console.log("save new error:", err);
					} else {
						console.log("saved new fine\n");
						user.auth = auth._id;
						user.save(function(err) { console.log(err) });
					}
				});
			} else {
				CronofyAuth.findOne({ '_id': user.auth })
				.then(function(authDoc) {
					user.save(function(err) { console.log(err) });
					authDoc.access_token = result.access_token;
					authDoc.refresh_token = result.refresh_token;
					authDoc.user = user._id;
					authDoc.save(function(err) {
						if (err) {
							console.log("update error:", err);
						} else {
							console.log("updated fine\n");
						}
					});
				});
			}
		});

		var encoded_token = encodeURIComponent(result.access_token);
		// res.redirect('https://calendar.getpip.com/register/?accessToken=' + encoded_token + '&username=' + email);
		res.redirect('https://dev.allowpip.com/step-2/?accessToken=' + encoded_token + '&username=' + email);

		// cronofy.listCalendars({
		// 	access_token: result.access_token,
		// 	tzid: 'Etc/UTC'
		// })
		// .then(function(results) {

		// 	var calendars = new Array;
		// 	for (var i in results.calendars) {
		// 		var calendar = results.calendars[i];
		// 		if (calendar.profile_name == email && calendar.calendar_deleted == false) {
		// 			calendars.push({ 'calendar_name': calendar.calendar_name, 'calendar_id': calendar.calendar_id });
		// 		}
		// 	}

		// 	res.render('calendars', {
		// 		 calendars: calendars,
		// 		 username: email
		// 	});
		// })
		// .catch(function(listerr) {
		// 	console.error("listerr:", listerr)
		// });

	})
	.catch(function logError(err) {
		console.error("accessToken error:", err.message);
		res.status(200).send(err.message);
	});

});

module.exports = router;
