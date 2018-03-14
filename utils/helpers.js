module.exports = {
	detectChangesInEvents: function(newEvent, existingEvent, callback) {

		var updates = [{ event_uid: newEvent.event_uid }];

		Object.keys(newEvent)
		.forEach(function(key) {

			if (existingEvent[key] instanceof Date) {
			// if (key == 'created' || key == 'updated' || key == 'start' || key == 'end' && key != undefined) {
				var newDate = new Date(newEvent[key]).getTime();
				var existingDate = new Date(existingEvent[key]).getTime();

				if (newDate == existingDate) {
					return;
				} else {
					updates.push({ [key]: newEvent[key] });
				}

			} else if (key == 'attendees') {
				var existingAttendees = existingEvent.attendees;
				var newAttendees = newEvent.attendees;

				newAttendees.forEach(function(newAttendee) {
					existingAttendees.forEach(function(existingAttendee) {

						if (newAttendee.email == existingAttendee.email) {
							Object.keys(newAttendee)
							.forEach(function(attendeeKey) {
								if (newAttendee[attendeeKey] != existingAttendee[attendeeKey]) {
									updates.push({ [attendeeKey]: newAttendee[attendeeKey] });
									updates.push({ email: newAttendee.email });
								}
							});
						}
					});
				});
			} else if (key == 'location') {
				var existingLocationDesc = existingEvent.location.description || "";
				var newLocationDesc = newEvent.location.description || "";

				if (newLocationDesc != existingLocationDesc) {
					// updates.push({ [key]: newEvent[key] });
					updates.push({ [key]: newLocationDesc });
				}
			} else if (existingEvent[key] != newEvent[key] && newEvent[key] != undefined) {
				if (newEvent[key] instanceof Array) {
					if (newEvent[key].length == 0 && existingEvent[key].length == 0) {
						return;
					}
				}
				updates.push({ [key]: newEvent[key] });
			}
		});
		callback(updates);
		// } else {
		// 	callback(null, []);
		// }
	}
}