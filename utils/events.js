var request = require('request');
var config = require('../config/config');
var mongoose = require('mongoose');
var Event = mongoose.model('calendarEvents');
var helpers = require('../utils/helpers');

mongoose.Promise = global.Promise;

var eventObject = {
	user: 'Pip User ID',
	calendar: 'Pip Calendar ID',
	calendar_id: 'Cronofy Calendar ID',
	event_uid: 'Event ID',
	summary: 'Event summary',
	description: 'Event description',
	start: 'Event starts',
	end:  'Event ends',
	deleted: 'Event deleted',
	created: 'Event created',
	updated: 'Event updated',
	location: {
		description: 'Location'
	},
	participation_status: 'Participation Status',
	attendees: [
		{
			_id: 'Cronofy Attendee ID',
			email: 'Attendee email address',
			display_name: 'Attendee display name',
			status: 'Attendee status'
		}
	],
	transparency: 'Transparency',
	status: 'Status',
	categories: 'Categories',
	url: 'URL'
}

module.exports.saveEvent = function(event, calendar) {

	var promise = new Promise(function(resolve, reject) {

		var query = {
			event_uid: event.event_uid
		}

		var options = {
			new: true,
			upsert: true,
			setDefaultsOnInsert: true
		}

		var location = event.location || { description: "" };

		Event.findOneAndUpdate(query, {
			'user': calendar.user,
			'calendar': calendar._id,
			calendar_id: event.calendar_id,
			event_uid: event.event_uid,
			summary: event.summary,
			description: event.description || "",
			start: event.start,
			end:  event.end,
			deleted: event.deleted,
			created: event.created,
			updated: event.updated,
			'location': location,
			participation_status: event.participation_status,
			attendees: event.attendees || "",
			transparency: event.transparency,
			status: event.status,
			categories: event.categories,
			// recordUpdated: new Date(),
			updatedAt: Date.now()
		}, options)
		.then(function(updatedEvent) {
			resolve(updatedEvent);
		})
		.catch(function(error) {
			reject(error);
		});
	});

	return promise;
}

module.exports.findChangesInEvent = function(event, calendar, callback) {

	function getPrettyName(name) {

		var prettyName = new String;
		Object.keys(eventObject).forEach(function(lookupKey) {

			// console.log("name:", name, "lookupKey:", lookupKey);

			if (name == lookupKey) {
				console.log("pretty str:", eventObject[lookupKey]);
				prettyName = eventObject[lookupKey];
				// return;
				// return eventObject[lookupKey];
			// } else {
				if (eventObject[lookupKey] instanceof Array) {
					Object.keys(eventObject[lookupKey][0])
					.forEach(function(innerObjectKey) {
						console.log("innerArrayObjectKey:", innerObjectKey);
						if (name == innerObjectKey) {
							console.log("pretty arr:", eventObject[lookupKey][0][innerObjectKey]);
							prettyName = eventObject[lookupKey][0][innerObjectKey];
							// return;
						}
						// console.log(lookupKey, "array object keys:", innerObjectKey);
					});
				} else if (eventObject[lookupKey] instanceof Object) {
					if (name == "location") {
						prettyName = "Location Description";
					} else {
						console.log("getPrettyName: lookupKey was", lookupKey, "but I couldn't find the pretty name.");
					}
				}			
			}

		});

		return prettyName;
	}

	Event.findOne({
		event_uid: event.event_uid
	})
	.select(Object.keys(eventObject).join(' '))
	.lean()
	.then(function(existingEvent) {

		if (existingEvent) {

			helpers.detectChangesInEvents(event, existingEvent, function(results) {

				var prettyChanges = [results[0]];
				var updateText = new String;
				// var prettyChanges = new Array;
				// for (var i = 1; i < results.length; i++) {

				results.shift();
				for (var i in results) {
					Object.keys(results[i]).forEach(function(key) {
						var prettyName = getPrettyName([key]);
						// console.log("prettyName is", getPrettyName([key]), "for", key);
						var resultValue = results[i][key];
						// console.log("resultValue:", results[i][key]);
						// console.log("key:", key, "prettyName:", getPrettyName(key), "result:", results[i][key]);
						// prettyChanges.push({ [getPrettyName(key)]: results[i][key] });
						updateText += prettyName + ": " + resultValue + ". ";
					});
				}
				prettyChanges.push(updateText);
				callback(null, prettyChanges);
			});
		} else {
			callback(null, []);
		}
	})
	.catch(function(error) {
		console.log("error finding existing event", error);
		callback(error, null);
	});

	function reportChange(value, key) {

	}
}

module.exports.saveNewEvent = function(event, calendar, callback) {
// function saveNewEvent(event, calendar, callback) {

	console.log("saving event");

	var location = event.location || { description: "" };

	var event = new Event({
		user: calendar.user,
		'calendar': calendar._id,
		calendar_id: event.calendar_id,
		event_uid: event.event_uid,
		summary: event.summary,
		description: event.description || "",
		start: event.start,
		end:  event.end,
		deleted: event.deleted,
		created: event.created,
		updated: event.updated,
		'location': location,
		participation_status: event.participation_status,
		attendees: event.attendees || "",
		transparency: event.transparency,
		status: event.status,
		categories: event.categories,
		url: event.url || ""
		// recordUpdated: new Date()
	})
	.save(function(error, doc) {
		callback(error, doc);
	});
}
