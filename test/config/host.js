var u = require('lodash');
module.exports = function(config) {
	var sauceEnabled = !!(process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY);
	console.log("Using " + (sauceEnabled ? "Saucelabs" : "local selenium") + "...");
	return u.merge({}, config, sauceEnabled ? {
		// Sauce connect settings
		host: 'ondemand.saucelabs.com',
		port: 80,
		user: process.env.SAUCE_USERNAME,
		key: process.env.SAUCE_ACCESS_KEY
	} : {
		// Default local settings
	});
};