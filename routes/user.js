var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/user');
var userService = require('../services/user.service');
var adminService = require('../services/admin.service');

router.post('/register', function(req, res) {

	userService.create(req.body)
	.then(function() {
		return res.sendStatus(200);
	})
	.catch(function(err) {
		// return res.json({ error_message: err });
		res.status(400).send(err);
	});
});

router.post('/register/admin', function(req, res) {

	adminService.create(req.body)
	.then(function() {
		return res.sendStatus(200);
	})
	.catch(function(err) {
		res.status(400).send(err);
	})
})

// router.post('/', function(req, res) {

// 	var user = new User({
// 		username: req.body.username,
// 		password: req.body.password,
// 		telephone: req.body.telephone
// 	});

// 	user.save(function(err) {
// 		if (err) {
// 			return res.send(err);
// 		}

// 		res.json({message: 'New user created'});
// 	});
// });

// router.get('/', function(req, res) {

// 	User.find()
// 	.then(function(users) {
// 		res.json(users);
// 	})
// 	.catch(function(err) {
// 		res.send(err);
// 	})
// });

module.exports = router;