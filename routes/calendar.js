var express = require('express');
var router = express.Router();
var config = require('../config/config');
var cronofy = require('cronofy');
var request = require('request');
var _ = require('lodash');

// db
var mongoose = require('mongoose');
var Calendar = mongoose.model('calendars');
var User = mongoose.model('users');
var Auth = mongoose.model('cronofyAuths');

mongoose.Promise = global.Promise;

/* GET calendar listing. */
router.get('/', function(req, res, next) {

	var accessToken = req.query.accessToken;

	Auth.findOne({ access_token: accessToken })
	.populate('user')
	.exec(function(err, auth) {
		if (err) {
			return res.json({ error_message: error });
		}

		sendCalendars(auth.user.profile_name);
	});

	function sendCalendars(username) {
		var options = {
			access_token: accessToken,
			tzid: 'Europe/London'
		}

		cronofy.listCalendars(options)
		.then(function(response) {
			var calendars = response.calendars;
			var userCalendars = [];
			calendars.forEach(function(calendar) {
				if (calendar.profile_name == username && calendar.calendar_deleted == false) {
					userCalendars.push(calendar);
				}
			});
			res.json({ calendars: userCalendars });
		})
		.catch(function(error) {
			return res.json({ error_message: error });
		});
	}

});

router.post('/register', function(req, res, next) {

	// get calendar_id's from request body / params
	// set up notification channels for each, then
	// redirect to the success page:
	var body = req.body;
	var bodyKeys = Object.keys(body);
	var calendar_ids = new Array();

	console.log(body);

	bodyKeys.forEach(function(key) {
		if (key.indexOf("calendar") > -1) {
			calendar_ids.push(body[key]);
		}
	});

	var accessToken = req.body.accessToken;

	Auth.findOne({ access_token: accessToken })
	.populate('user')
	.exec()
	.then(function(auth) {
		getAuthTokenForUser(auth.user)
		.then(function(access_token) {
			findUsersCalendar(auth.user, access_token)
			.then(function(calendars) {
				calendars.forEach(function(calendar) {
					saveCalendar(calendar, auth.user)
					.then(function() {
						createNotificationChannel(access_token, calendar.calendar_id)
						.then(function(channelId) {
							console.log(channelId);
						})
						.catch(function(err) {
							return res.json({ error_message: err });
							console.error("createNotificationChannel err:", err);
						});
					})
					.catch(function(err) {
						return res.json({ error_message: err });
						console.error("saveCalendar err:", err);
					});
				});

				console.log("redirect to success page");
				// res.render('success', {
				// 	firstName: auth.user.firstName,
				// 	lastName: auth.user.lastName,
				// 	'calendars': _.map(calendars, 'calendar_name')
				// });
				res.json({
					body: body,
					firstName: auth.user.firstName,
					lastName: auth.user.lastName,
					'calendars': _.map(calendars, 'calendar_name')
				})

			})
			.catch(function(err) {
				return res.json({ error_message: err });
				console.error("findUsersCalendar err:", err);
			});
		})
		.catch(function(err) {
			return res.json({ error_message: err });
			console.error("getAuthTokenForUser err:", err);
		});
	});

	// var username = body.username;

	// User.findOne({
	// 	session: req.session.id
	// 	// 'username': username
	// }, function(err, user) {
	// 	if (err || !user) {
	// 		console.error("/register err", err || "couldn't find that user");
	// 		return res.sendStatus(400);
	// 	}

	// 	getAuthTokenForUser(user)
	// 	.then(function(access_token) {
	// 		findUsersCalendar(user, access_token)
	// 		.then(function(calendars) {
	// 			calendars.forEach(function(calendar) {
	// 				saveCalendar(calendar, user)
	// 				.then(function() {
	// 					createNotificationChannel(access_token, calendar.calendar_id)
	// 					.then(function(channelId) {
	// 						console.log(channelId);
	// 					})
	// 					.catch(function(err) {
	// 						console.error("createNotificationChannel err:", err);
	// 					});
	// 				})
	// 				.catch(function(err) {
	// 					console.error("saveCalendar err:", err);
	// 				});
	// 			});

	// 			console.log("redirect to success page");
	// 			res.render('success', {
	// 				firstName: user.firstName,
	// 				lastName: user.lastName,
	// 				'calendars': _.map(calendars, 'calendar_name')
	// 			});

	// 		})
	// 		.catch(function(err) {
	// 			console.error("findUsersCalendar err:", err);
	// 		});
		// })
		// .catch(function(err) {
		// 	console.error("getAuthTokenForUser err:", err);
		// });

	// });

	function findUsersCalendar(user, access_token) {

		console.log("findUsersCalendar (user, access_token)", user, access_token);
		var promise = new Promise(function(resolve, reject) {

			cronofy.listCalendars({
				access_token: access_token
			})
			.then(function(results) {
				
				var calendars = new Array;

				for (var i in results.calendars) {
					var calendar = results.calendars[i];
					if (calendar.profile_name == user.profile_name) {
						calendar_ids.forEach(function(calendar_id) {
							if (calendar.calendar_id == calendar_id && calendar.calendar_deleted == false) {
								calendars.push(calendar);
							}
						});
					}
				}
				resolve(calendars);
			})
			.catch(function(err) {
				console.error("there was an error", err);
				reject(err);
			});

		});

		return promise;
	}
});

function getAuthTokenForUser(user) {

	console.info("getAuthTokenForUser (user)", user);

	var promise = new Promise(function(resolve, reject) {

		Auth.findOne({
			'user': user._id
		}, function(err, auth) {
			if (err && !auth) {
				console.error("couldn't find the user's auth:", err || "No user");
				return reject(err || "No user");
			}

			resolve(auth.access_token);
		});
	});

	return promise;
}

// function findUsersCalendar(user, access_token) {

// 	console.info("findUsersCalendar (user, access_token)", user, access_token);

// 	var promise = new Promise(function(resolve, reject) {

// 		cronofy.listCalendars({
// 			access_token: access_token
// 			// tzid: 'Etc/UTC'
// 		})
// 		.then(function(results) {
			
// 			var calendars = new Array;

// 			for (var i in results.calendars) {
// 				var calendar = results.calendars[i];
// 				if (calendar.profile_name == user.username) {
// 					calendar_ids.forEach(function(calendar_id) {
// 						if (calendar.calendar_id == calendar_id) {
// 							calendars.push(calendar);
// 						}
// 					});
// 				}
// 			}
// 			resolve(calendars);
// 		})
// 		.catch(function(err) {
// 			console.error("there was an error", err);
// 			reject(err);
// 		});

// 	});

// 	return promise;
// }

function saveCalendar(calendar, user) {

	console.info("saveCalendar (calendar, user)", calendar, user);

	var promise = new Promise(function(resolve, reject) {
		Calendar.findOneAndUpdate({
			calendar_id: calendar.calendar_id
		}, {
			provider_name: calendar.provider_name,
			profile_id: calendar.profile_id,
			profile_name: calendar.profile_name,
			calendar_id: calendar.calendar_id,
			calendar_name: calendar.calendar_name,
			calendar_readonly: calendar.calendar_readonly,
			calendar_deleted: calendar.calendar_deleted,
			calendar_primary: calendar.calendar_primary,
			updatedAt: new Date(),
			user: user._id
		}, {
			new: true,
			upsert: true,
			setDefaultOnInsert: true,
			overwrite: true 
		}, function(err, calendarDoc) {
			if (err) {
				console.error("saveCalendar err", err);
				return reject(err);
			}

			console.log("Saved calendar:", calendarDoc);
			resolve();
		});
	});

	return promise;
}

function createNotificationChannel(accessToken, calendarId) {

	console.info("createNotificationChannel (accessToken, calendarId)", accessToken, calendarId);

	var promise = new Promise(function(resolve, reject) {
		var options = {
			method: 'POST',
			uri: 'https://api.cronofy.com/v1/channels',
			headers: {
				'Authorization': "Bearer " + accessToken,
				'Content-Type': 'application/json'
			}, 
			body: JSON.stringify({
				callback_url: config.cronofy_notification.callback_url,
				filters: {
					calendar_ids: calendarId
				}
			})
		}

		request(options, function(err, resp, body) {
			if (err) {
				reject(err);
			}
			var response = JSON.parse(body);
			resolve(response.channel.channel_id);
		});
	});
	return promise;
};

module.exports = router;
