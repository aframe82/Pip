var express = require('express');
var router = express.Router();
var request =require('request');
var config = require('../config/config');

router.get('/', function(req, res) {
	res.render('register');
});

router.post('/', function(req, res) {

	var session = req.session.id;
	req.body.session = session;
	//register using a service to maintain cleaner separation
	request.post({
		url: config.api.url + '/users/register',
		form: req.body,
		json: true
	}, function(error, response, body) {
		if (error) {
			console.error(error);
			return res.json({
				error: error,
				statusCode: response.statusCode
			});
			// return res.render('register', { error: 'An error occurred' });
		}

		if (response.statusCode != 200) {
			return res.json({
				error: 'An error occurred',
				body: response.body,
				statusCode: response.statusCode
			});
			// return res.render('register', {
			// 	error: response.body,
			// 	firstName: req.body.firstName,
			// 	lastName: req.body.lastName,
			// 	username: req.body.username,
			// 	mobileNumber: req.body.mobileNumber
			// });
		}

		var options = config.cronofy_auth_uri;
		options.state = session;

		var oauth2 = require('simple-oauth2')(config.cronofy_credentials);
		var authorization_uri = oauth2.authCode.authorizeURL(options);
		return res.json({
			redirect_url: authorization_uri
		});
		// return res.redirect(authorization_uri);

		// return res.redirect(config.api.url + '/auth');
	})
});

router.get('/admin', function(req, res) {
	res.render('register_admin');
});

router.post('/admin', function(req, res) {

	// var session = req.session.id;
	// req.body.session = session;
	//register using a service to maintain cleaner separation
	request.post({
		url: config.api.url + '/users/register/admin',
		form: req.body,
		json: true
	}, function(error, response, body) {
		if (error) {
			console.error(error);
			return res.json({
				error: error,
				statusCode: response.statusCode
			});
			// return res.render('register', { error: 'An error occurred' });
		}

		if (response.statusCode != 200) {
			return res.json({
				error: 'An error occurred',
				body: response.body,
				statusCode: response.statusCode
			});
			// return res.render('register', {
			// 	error: response.body,
			// 	firstName: req.body.firstName,
			// 	lastName: req.body.lastName,
			// 	username: req.body.username,
			// 	mobileNumber: req.body.mobileNumber
			// });
		}

		res.status(200).send("<h2>Registered successfully</h2>");

		// var options = config.cronofy_auth_uri;
		// options.state = session;

		// var oauth2 = require('simple-oauth2')(config.cronofy_credentials);
		// var authorization_uri = oauth2.authCode.authorizeURL(options);
		// return res.json({
		// 	redirect_url: authorization_uri
		// });
		// return res.redirect(authorization_uri);

		// return res.redirect(config.api.url + '/auth');
	})
});

module.exports = router;