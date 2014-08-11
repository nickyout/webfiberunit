var webdriver = require('webdriverjs'),
	commands = require('../src/commands'),
	u = require('lodash'),
	inst;

module.exports = {
	setUp: function(callback) {
		inst = webdriver.remote({ desiredCapabilities: { browserName: "chrome" }});
		for (var name in commands) {
			inst.addCommand(name, commands[name]);
		}
		inst.init(callback);
	},

	"jsError": function(test) {
		test.expect(5);
		inst.url('http://www.google.com')
			.jsErrorLog(function(err, result) {
				test.ok(err, "Logging before tracking should throw an error");
			})
			.jsErrorTrack()
			.execute("setTimeout(function() {throw new Error(\"fail!\")}, 0)")
			.pause(1000)
			// Request error log (with clear flag true)
			.jsErrorLog(true, function(err, result) {
				test.equal(result.length, 1, "Returned log of thrown error");
				test.ok(u.isDate(result[0][0]), "First arg is date object");
				test.ok(/fail/.test(result[0][1]), "Second arg is message");
			})
			// Error log should be truncated now
			.jsErrorLog(function(err, result) {
				test.equal(result.length, 0, "Error log cleared");
			})
			.call(test.done);
	},

	tearDown: function(callback) {
		inst.end(callback);
	}
};