var express = require('express');
var router = express.Router();
var request = require('request');
var cronofy = require('cronofy');
var config = require('../config/config');
var mongoose = require('mongoose');
var CalendarEvent = mongoose.model('calendarEvents');
var Calendar = mongoose.model('calendars');
var CronofyAuth = mongoose.model('cronofyAuths');
var User = mongoose.model('users');
var authorisation = require('../utils/authorisation');
var eventsKit = require('../utils/events');
var slack = require('../utils/slack_handler');

/* GET home page. */
router.get('/', function(req, res) {

	res.sendStatus(200);
});

router.post('/', function(req, res) {
	console.log(req.body);

	var type = req.body.notification.type || "";
	if (type == "verification") {
		return res.sendStatus(200);
	}

	var changes_since = req.body.notification.changes_since;
	var calendar_id = req.body.channel.filters.calendar_ids[0];

	Calendar.findOne({ 'calendar_id': calendar_id })
	.then(function(calendar) {

		authorisation.findAndAuthoriseUserById(calendar.user)
		.then(function(accessToken) {

			// console.log("access_token:", accessToken);

			var opts = {
				'access_token': accessToken,
				tzid: 'Europe/London',
				last_modified: changes_since,
				include_deleted: true,
				calendar_ids: [calendar_id]
			}

			cronofy.readEvents(opts)
			.then(function(events) {

				for (var i = 0; i < events.events.length; i++) {

					eventsKit.findChangesInEvent(events.events[i], calendar, function(err, result) {
						if (err) {
							return console.log("Error finding Updates:", err);
						}

						results = result;
					});

					eventsKit.saveEvent(events.events[i], calendar)
					.then(function(newEvent) {
						// console.log("commited to db:", newEvent);

						User.findOne({ _id: newEvent.user })
						.then(function(user) {

							var pretext = "";
							var payload = "";
							var linkText = "\nLINK: " + config.api.url + "/events/" + newEvent._id;
							var titleForCustomer = user.firstName + " " + user.lastName + " (" + user.username + ")";

							if (results.length > 1) {
								// console.log(results);
								results.shift();
								pretext = 'Event updated';
								payload = newEvent.summary + "\nUPDATED: " + results + linkText ;
							} else if (results.length == 1) {
								console.log("no changes?", results);
								return;
							} else {
								pretext = "New event added";
								payload = newEvent.summary + "\nstart: " + newEvent.start + ", end: " + newEvent.end + linkText;
							}

							// var payload = newEvent.summary + " | start: " + newEvent.start + ", end: " + newEvent.end;
							var attachments = [
							       {
							          'pretext': pretext,
							          'color': '#269BC8',
							          'fields': [
							             {
							                'title': titleForCustomer,
							                'value': payload,
							                'short': 'false'
							             }
							          ]
							       }
							    ];
							var attachmentString = JSON.stringify(attachments);
							slack.postEventMessage(attachmentString, user.customerId);
							
						})
						.catch(function(error) {
							console.log("Error finding user in notification.js", error);
						});
					})
					.catch(function(error) {
						console.log("error saving event to db:", error);
					});
				}
				res.status(200).send(events);
			})
			.catch(function(err) {
				console.log("err getting events:", err);
				res.status(403).send(err);
			});
		})
		.catch(function(error) {
			console.log("hmm:", error);
			res.status(403).send(err);
		});
	})
	.catch(function(err) {
		console.log("Error finding calendar with notification");
		res.sendStatus(403);
	});
});

module.exports = router;
