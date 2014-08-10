var util = require('util');

/**
 * Debug logger solution from webdriverjs/lib/request
 */
module.exports = function debug() {
	if (/\bwebfiber\b/.test(process.env.NODE_DEBUG)) {
		console.error('WEBFIBER %s', util.format.apply(util, arguments))
	}
};
