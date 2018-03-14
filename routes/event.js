var express = require('express');
var router = express.Router();
var passport = require('passport');
var session = require('express-session');
var config = require('../config/config');

var mongoose = require('mongoose');
var Event = mongoose.model('calendarEvents');

mongoose.Promise = global.Promise;

router.get('/:id', isAuthenticated, function(req, res) {

	Event.findOne({
		_id: req.params.id
	})
	.populate('user')
	.exec()
	.then(function(event) {
		res.render('event', {
			event: event,
			user: event.user
		});
	})
	.catch(function(err) {
		console.log("error_message")
		res.json({
			error_message: "Event not found"
		});
	});
});

function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	console.log(req);
	req.session.returnTo = req.originalUrl;
	req.message = "Need to login to see that page";
	// res.redirect('/');
	res.render('login', {
		message: req.message
	});
}

module.exports = router;