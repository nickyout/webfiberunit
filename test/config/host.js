var u = require('lodash');
module.exports = function h(config) {
	return u.merge(config, (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) ? {
		// Sauce connect settings
		host: 'ondemand.saucelabs.com',
		port: 80,
		user: process.env.SAUCE_USERNAME,
		key: process.env.SAUCE_ACCESS_KEY
	} : {
		// Default local settings
	});
};