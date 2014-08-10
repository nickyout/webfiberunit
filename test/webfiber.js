var webfiber = require('../src/webfiber'),
	suite = {
		opens: function(test, browser) {
			test.expect(2);
			try {
				browser.on('error', function(e) {
					test.ok(true, "Caught error event");
				});
				browser.url("http://about:blank");
				test.ok(false, "Browser throws");
			} catch (err) {
				test.ok(true, "Catches errors");
			}
			throw new Error("Uncaught errors get handled (Expect +1 failure)");
		},

		finds: function(test, browser) {
			test.expect(2);
			try {
				var result;
				browser.url("http://www.google.com");
				test.ok(true, "Found page");
				result = browser.getTitle();
				test.ok(!!result, "Method returned result");
			} catch (err) {
				console.log(err);
				test.ok(false, "No errors");
			}
		}

	};

module.exports = {

	"browser": webfiber({
		browser: {
			"browserName": "chrome"
		}
	}, suite),

	"host.desiredCapabilities": webfiber({
		host: {
			desiredCapabilities: {
				"browserName": "chrome"
			}
		},
		browser: {
			"browserName": "super mega barfatron"
		}
	}, suite)
};
