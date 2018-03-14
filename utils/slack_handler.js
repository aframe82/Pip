var config = require('../config/config');
var Slack = require('slack-node');
var slack = new Slack(config.slack.token);
var mongoose = require('mongoose');
var Conversation = mongoose.model('conversations');

function listAllChannels(callback) {

	slack.api('channels.list', function(err, response) {

		if (err) {
			console.log("errororooeroerd");
			callback(err, null);
		}

		var channelList = [];
		var channels = response.channels;

		for (var i in channels) {
			var channel = channels[i];
			channelList.push({
				name: channel.name,
				id: channel.id
			});
		}
		callback(null, channelList);
	});
};

function findOrCreateChannel(customerChannel, callback) {

		console.log("I'm here and I'm looking for", customerChannel);
		currentChannel = customerChannel;

		listAllChannels(function(err, channelList) {

			var foundChannel = false;

			channelList.forEach(function(channel) {
				if (channel.name.indexOf(customerChannel) > -1) {
					console.log("We already have this channel:", channel);
					currentChannelId = channel.id;
					foundChannel = true;
					callback(null, channel);
				} 
			});

			if (foundChannel === false) {
				// we don't have that channel, create it
				slack.api('channels.create', {
					name: customerChannel
				}, function(err, response) {
					if (err) {
						console.log("create channel error:", err);
						callback(err, null);
					} else {
						console.log(response);
						currentChannelId = response.channel.id;

						slack.api('channels.invite', {
							channel: currentChannelId,
							user: "U0MU9PBU2"
						}, function(inviteErr, inviteRes) {
							if (inviteErr) {
								console.log("Problem creating channel:", inviteErr);
							} else {
								console.log("Invited @mark to channel", customerChannel);
								callback(null, response.channel);
							}
						});

						// callback(null, response.channel);
						console.log("create channel:", response);
					}
				});
			}

		});
	};

module.exports = {

	postMessageToChannel: function(message, channel) {
		console.log("200");
		findOrCreateChannel(channel, function(err, newChannel) {

			if (err) {
				console.log('findOrCreateChannel err:', err);
			} else {
				console.log("got or created a channel");
				slack.api('chat.postMessage', {
					text: message,
					channel: "#" + channel,
					username: channel,
					icon_emoji: ":iphone:"
				}, function(err, response) {
					console.log('post message:', response);
					if (err) {
						console.log("Error sending", message, "to channel", channel + ":", err);
					} else {
						return;
					}
				});
			}
		});
	},
	postMessageAsPip: function(channel, message) {
		findOrCreateChannel(channel, function(err, newChannel) {

			if (err) {
				console.log("findOrCreateChannel err:", err);
			} else {
				console.log("got or created a channel as Pip");
				slack.api('chat.postMessage', {
					text: message,
					channel: "#" + channel,
					username: "Pip"
				}, function(err, response) {
					console.log("post message as Pip:", response);
					if (err) {
						console.log("Error sending", message, "to channel", channel + ":", err);
					} else {

						return;
					}
				});
			}
		});
	},
	postEventMessage: function(options, channelName) {
		// findOrCreateChannel(options.channel, function(err, newChannel) {

			// if (err) {
				// console.log("findOrCreateChannel err:", err);
			// } else {
				console.log(options);
				slack.api('chat.postMessage', {
					channel: '#' + channelName,
					username: "Pip Calendar Notifier",
					"icon_emoji": ":calendar:",
					"text": ":calendar: *Calendar event*",
					"attachments": options
				}, function(err, response) {
					console.log("post message with params:", response);
					if (err) {
						console.log("Error sending event update", err);
					} else {
						return;
					}
				});
			// }
		// });
	}
}





