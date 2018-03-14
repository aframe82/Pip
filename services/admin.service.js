var mongoose = require('mongoose');
var Admin = mongoose.model('admin');
var bcrypt = require('bcrypt-nodejs');
var _ = require('lodash');

mongoose.Promise = global.Promise;

var service = {};

service.create = create;

module.exports = service;

function create(userParam) {
	var promise = new Promise(function(resolve, reject) {

		if (!userParam.firstName || !userParam.lastName || !userParam.username || !userParam.password) {
			return reject('Please make sure all fields are filled in.');
		}

		console.log("param:", userParam);
		Admin.findOne({
			username: userParam.username
		})
		.then(function(user) {
			if (user) {
				console.warn(_.omit(user, 'password'));
				reject('Username ' + userParam.username + ' is already an admin');
			} else {
				console.log("no existing admin user found. continuing...");
				createUser();
			}
		})
		.catch(function(err) {
			console.error("create:", err);
			reject(err);
		});
	
		function createUser() {
			var user = new Admin(userParam);
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