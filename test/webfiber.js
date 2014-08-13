var nodeunit = require('nodeunit'),
	webfiber = require('../src/webfiber'),
	h = require('./config/host'),
	suite = {
		opens: function(test, browser) {
			test.expect(2);
			try {
				browser.on('error', function(e) {
					test.ok(true, "Caught error event");
				});
				browser.url("http://about:blank");
			} catch (err) {
				test.ok(true, "Catches errors");
			}
			throw new Error("Uncaught errors get handled (Expect +1 failure)");
		},

		finds: function(test, browser) {
			test.expect(2);
			var result;
			browser.url("http://www.google.com");
			test.ok(true, "Found page");
			result = browser.getTitle();
			test.ok(!!result, "Method returned result");
		}

	};

module.exports = {

	"browser": function(test) {
		nodeunit.runModule('browser', webfiber({
			host: h(),
			browser: {
				"browserName": "chrome"
			}
		}, suite), {}, function(err, result) {
			test.equal(result.passes(), 4, "Executes 2 + 2 tests");
			test.equal(result.failures(), 1, "Registers 1 failure");
			test.done();
		});
	},

	"host.desiredCapabilities": function(test) {
		nodeunit.runModule('host.desiredCapabilities', webfiber({
			host: h({
				desiredCapabilities: {
					"browserName": "chrome"
				}
			}),
			browser: {
				"browserName": "super mega barfatron"
			}
		}, suite), {}, function(err, result) {
			test.equal(result.passes(), 4, "overrides browser");
			test.done();
		})
	}
};
