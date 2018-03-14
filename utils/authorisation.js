var request = require('request');
var config = require('../config/config');
var mongoose = require('mongoose');
var Customer = mongoose.model('customers');
var Calendar = mongoose.model('calendars');
var User = require('../models/user');
var CronofyAuth = mongoose.model('cronofyAuths');
var cronofy = require('cronofy');

mongoose.Promise = global.Promise;

module.exports.findAndAuthoriseUserById = function(id) {

	var promise = new Promise(function(resolve, reject) {
		CronofyAuth.findOne({ user: id })
		.then(function(auth) {

			if (!auth) {
				var error = new Error("There isn't an auth doc for this customer");
				console.error(error);
				reject(error);
			}

			var oauth2 = require('simple-oauth2')(config.cronofy_credentials);
			var token = oauth2.accessToken.create(auth);

				var access_token = "";
				
				if (token.expired) {
					token.refresh()
					.then(function(result) {
						access_token = result.token.access_token;
						auth.access_token = access_token;
						auth.refresh_token = result.token.refresh_token;
						auth.save(function(err) {
							if (err) {
								console.log("error committing updated tokens to the auth record");
							}
						});
						resolve(access_token);
					})
					.catch(function(err) {
						console.error(err);
						reject(err);
					});
				} else {
					access_token = auth.access_token;
					resolve(access_token);
				}

		})
		.catch(function(error) {
			console.error(error);
			reject(error);
		});

	});

	return promise;
}