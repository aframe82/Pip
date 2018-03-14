/********************************
 ** Refactor this into individual
 ** models.
 ********************************/

var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Customer = new Schema({
	customer_telephone: String,
	customer_id: String,
	has_calendar: Boolean,
	calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
	email: String,
	fullName: String,
	firstName: String,
	lastName: String,
	gender: String,
	DOB: { type: Date, default: new Date() },
	country_code: String,
	createdAt: { type: Date, default: new Date() },
	access_token: String,
	refresh_token: String
});

var CronofyAuth = new Schema({
	"access_token": String,
	"token_type": String,
	"expires_in": Number,
	"refresh_token": String,
	"scope": String,
	"account_id": String,
	"linking_profile": {
		"provider_name": String,
		"profile_id": String,
		"profile_name": String
	},
	"expires_at": Date,
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
})

var Conversation = new Schema({
	customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
	customer_telephone: String,
	body: String,
	date: { type: Date, default: new Date() },
	messageSID: String,
	isPip: { type: Boolean, default: false }
});

var Calendar = new Schema({
	provider_name: String,
	profile_id: String,
	profile_name: String,
	calendar_id: String,
	calendar_name: String,
	calendar_readonly: Boolean,
	calendar_deleted: Boolean,
	calendar_primary: Boolean,
	customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
	createdAt: { type: Date, default: Date.now() },
	updatedAt: { type: Date, default: Date.now() }
	// kind: String,
	// etag: String,
	// id: String,
	// summary: String,
	// description: String,
	// location: String,
	// timeZone: String,
	// // notifications: [{ type: String, method: String }],
	// deleted: { type: Boolean, default: false },
	// createdat: { type: Date, default: new Date() },
	// link: String
});

var CalendarEvent = new Schema({
	calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
	calendar_id: String,
	event_uid: String,
	summary: String,
	description: String,
	start: Date,
	end: Date,
	deleted: Boolean,
	location: {
		description: String
	},
	participation_status: String,
	transparency: String,
	event_status: String,
	categories: [Array],
	attendees: [{
		email: String,
		display_name: String,
		status: String
	}],
	created: Date,
	updated: Date,
	status: String,
	recordUpdated: { type: Date, default: new Date },
	updatedAt: Date
});

var Preference = new Schema({
	customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
	relationship: { type: String, default: "Friends" },
	likes: { type: [String], lowercase: true },
	birthday: { type: Date, default: new Date() },
	cost: Number
});

var Event = new Schema({
	customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
	customer_telephone: String,
	first_name: String,
	last_name: String,
	full_name: String,
	gender: String,
	birthday: { type: Date, default: new Date() },
	likes: { type: [String], lowercase: true },
	max_spend: Number,
	event_type: { type: String, default: "birthday" }
});

mongoose.model('customers', Customer);
mongoose.model('conversations', Conversation);
mongoose.model('preferences', Preference);
mongoose.model('events', Event);
mongoose.model('calendarEvents', CalendarEvent);
mongoose.model('calendars', Calendar);
mongoose.model('cronofyAuths', CronofyAuth);

mongoose.connect("mongodb://localhost/pip_db");