var mongoose = require('mongoose');
var User = mongoose.model('users');
var bcrypt = require('bcrypt-nodejs');
var _ = require('lodash');

mongoose.Promise = global.Promise;

var service = {};

service.create = create;

module.exports = service;

function create(userParam) {
	var promise = new Promise(function(resolve, reject) {

		if (!userParam.firstName || !userParam.lastName || !userParam.telephone || !userParam.username || !userParam.password) {
			return reject('Please make sure all fields are filled in.');
		}

		console.log("param:", userParam);
		User.findOne({
			username: userParam.username
		})
		.then(function(user) {
			if (user) {
				console.warn(_.omit(user, 'password'));
				reject('Username ' + userParam.username + ' is already taken');
			} else {
				console.log("no existing user found. continuing...");
				createUser();
			}
		})
		.catch(function(err) {
			console.error("create:", err);
			reject(err);
		});
	
		function createUser() {
			var user = new User(userParam);
			user.save(function(err) {
				if (err) {
					console.log(err);
					reject(err);
				} else {
					resolve();
				}
			});
		}
	});
	return promise;
}