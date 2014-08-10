var utils = require('../src/utils');

module.exports = {
	"format": function(test) {
		var webdriverConfig,
			str;

		webdriverConfig = {
			host: {
				host: '127.0.0.1',
				port: 4444
			},
			browser: {
				browserName: 'firefox',
				version: '30.0'
			}
		};
		str = utils.format(webdriverConfig, "[%HOST%:%PORT%] %BROWSER% %BROWSER_VERSION%");
		test.equal(str, "[127.0.0.1:4444] Firefox 30.0", "Format as expected");

		webdriverConfig = {
			host: {
				desiredCapabilities: {
					browserName: "firefox",
					platform: "MAC"
				}
			},
			browser: {
				browserName: "chrome",
				os: "Windows"
			}
		};
		test.equal(utils.format(webdriverConfig, "%BROWSER%"), "Firefox", "host.desiredCapabilities over browser");
		test.equal(utils.format(webdriverConfig, "%OS%"), "Windows", "Property order dominant");

		webdriverConfig = {
			browser: {
				'browserName' : 'iPad',
				'platform' : 'MAC',
				'device' : 'iPad Mini'
			}
		};
		test.equal(utils.format(webdriverConfig, "%BROWSER%"), "iPad", "The iP* exception works");
		test.equal(utils.format(webdriverConfig, "%OS%"), "Mac", "Applying uppercase/lowercase");
		test.equal(utils.format(webdriverConfig, "%DEVICE%"), "iPad Mini", "Device is excluded from upper/lower");
		test.equal(utils.format(webdriverConfig, "(%BROWSER%) %s", "test case"), "(iPad) test case", "Also works like normal util.format");
		test.done();
	}
};