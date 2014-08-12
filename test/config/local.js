var h = require('./host');
module.exports = [{
	host: h({
		desiredCapabilities: {
			"browserName": "chrome"
		}
	})
}, {
	host: h({
		desiredCapabilities: {
			"browserName": "firefox"
		}
	})
}];