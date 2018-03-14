var config = require('../config/config');
var Slack = require('slack-node');
var slack = new Slack(config.slack.token);
var slackrtm = require('slack-client').RtmClient;
var RTM_EVENTS = require('slack-client').RTM_EVENTS;
var rtm = new slackrtm(config.slack.token);
// var twilio = require('./twilio_util');
var mongoose = require('mongoose');
var Conversation = mongoose.model('conversations');
var Customer = mongoose.model('customers');

rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function(message) {

	var channelId = message.channel,
		subType = message.subtype;	

	console.log(message);

	if (subType != "bot_message" && subType != "message_deleted" && message.text.indexOf("<@") < 0) {
		console.log("this is a customer channel, posted from Slack");

		slack.api('channels.info', {
			channel: channelId
		}, function(err, response) {
			if (err) {
				console.log("channels.list:", err);
			} else {
				var channelName = response.channel.name;

				if (channelName.indexOf("cust") > -1) {

					Customer.findOne({
						customer_id: channelName
					}, function(err, customer) {
						if (err) {
							console.log("Couldn't run the query to find customer:", channelName);
						} else {

							var fromNumber = config.fromUK;
							var country_code = customer.country_code || "GB";
							if (country_code == 'US' || country_code == 'CA') {
								fromNumber = config.fromUS;
							}
							
							var customerNumber = "+" + channelName.substring(channelName.indexOf("_") + 1);

							// twilio.sendSMS(fromNumber, customerNumber, message.text);

							// Commit to db
							new Conversation({
								'customer': customer._id,
								customer_telephone: customerNumber,
								body: message.text,
								isPip: true,
								date: new Date()
							})
							.save(function(err, conversation) {
								console.log(conversation);
							});
						}
					});
				}
			}
		});
	}
});

module.exports.rtm = rtm;