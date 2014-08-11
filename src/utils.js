var util = require('util'),
	u = require('lodash'),
	n = function() {},
	muffle = function(fn) { try { fn() } catch (err){} };

function cap(str) {
	str || (str = '');
	var ret = '';
	if (/^iP/.test(str)) {
		ret += str[0];
		str = str.slice(1);
	}
	ret += (str[0] || '').toUpperCase() + (str.slice(1) || '').toLowerCase();
	return ret;
}

/**
 *
 * @module webfiberutil/src/utils
 */
module.exports = {
	/**
	 * Provides a standard way to create formatted strings using the properties of a webdriverConfig object.
	 * Available replace tokens are:
	 * <ul>
	 *     <li>%HOST%, derived from host.host</li>
	 *     <li>%PORT%, derived from host.port</li>
	 *     <li>%BROWSER%, first letter capitalized, derived from host.desiredCapabilities.browser or browser.browser or host.desiredCapabilities.browserName or browser.browserName</li>
	 *     <li>%BROWSER_VERSION%, derived from host.desiredCapabilities.browser_version or browser.browser_version or host.desiredCapabilities.version or browser.version</li>
	 *     <li>%OS%, first letter capitalized, derived from host.desiredCapabilities.os or browser.os or host.desiredCapabilities.platform or browser.platform</li>
	 *     <li>%OS_VERSION%, derived from host.desiredCapabilities.os_version or browser.os_version</li>
	 *     <li>%DEVICE%, derived from host.desiredCapabilities.device or browser.device</li>
	 * </ul>
	 *
	 * @param {WebdriverConfig} webdriverConfig
	 * @param {string} [format] if undefined, uses an adequate format based on the available properties in webdriverConfig.
	 * @returns {string} The formatted string.
	 * @example
	 * var webdriverConfig = {
	 *     host: {
	 *         host: '127.0.0.1',
	 *         port: 4444
	 *     },
	 *     browser: {
	 *         browserName: 'firefox',
	 *         version: '30.0'
	 *     }
	 * }
	 * util.format(webdriverConfig, "[%HOST%:%PORT%] %BROWSER% %BROWSER_VERSION%"); // [127.0.0.1:4444] Firefox 30.0
	 * @memberof module:webfiberutil/src/utils
	 */
	format: function(webdriverConfig, format) {
		var str = format,
			o = webdriverConfig || {},
			h = o.host || {},
			b = u.merge({}, o.browser, h.desiredCapabilities);
		var host = h.host || null,
			port = h.port || null,
			browserName = b.browser || b.browserName || null,
			browserVersion = b.browser_version || b.version || null,
			os = b.os || b.platform || null,
			osVersion = b.os_version || null,
			device = b.device || null;

		if (!str) {
			// auto detect
			str = "[%HOST%";
			if (port) {
				str += ":%PORT%"
			}
			str +="] %BROWSER%";

			if (browserVersion) {
				str += " %BROWSER_VERSION%";
			}

			if (device) {
				// Portable device (browserstack)
				str += " on %DEVICE%";
				if (os) {
					str += " (%OS%)";
				}
			} else if (os) {
				// Desktop OS
				str += " on %OS%";
				if (osVersion) {
					str += " %OS_VERSION%";
				}
			}
		}

		str = str.replace(/%HOST%/g, host || 'local')
			.replace(/%PORT%/g, port || '(default port)')
			.replace(/%BROWSER%/g, cap(browserName || '(any browser)'))
			.replace(/%BROWSER_VERSION%/g, browserVersion || '(any version)')
			.replace(/%OS%/g, cap(os || '(any os)'))
			.replace(/%OS_VERSION%/g, osVersion || '(any os version)')
			.replace(/%DEVICE%/g, device || '(any device)');

		return util.format.apply(util, [str].concat(Array.prototype.slice.call(arguments, 2)));
	},

	/**
	 * Nodeunit test object substitute.
	 * Contains all the methods of nodeunit's test object, only this object registers nothing.
	 * <p/>
	 * Useful if you wish to execute a test case as subroutine of another test case without using its assertions. Just pass this object instead as the subroutine's test argument.
	 * @memberof module:webfiberutil/src/utils
	 * @prop {Function} ok - does nothing
	 * @prop {Function} equal - does nothing
	 * @prop {Function} notEqual - does nothing
	 * @prop {Function} strictEqual - does nothing
	 * @prop {Function} notStrictEqual - does nothing
	 * @prop {Function} deepEqual - does nothing
	 * @prop {Function} notDeepEqual - does nothing
	 * @prop {Function} same - does nothing
	 * @prop {Function} throws - executes the first argument function inside a try-catch block
	 * @prop {Function} doesNotThrow - executes the first argument function inside a try-catch block
	 * @prop {Function} ifError - does nothing
	 * @prop {Function} expect - does nothing
	 * @prop {Function} done - does nothing
	 * @example
	 * // Run subroutine with testNoop
	 * var testNoop = require('webfiberunit').utils.testNoop;
	 * module.exports = {
	 *
	 *     // Test if driver can maximize window
	 *     "maximizeWindow": function(test, browser) {
	 *         try {
	 *             browser.windowHandleMaximize();
	 *             test.ok(true, "Driver supports maximizing window");
	 *         } catch (err) {
	 *             test.ok(false, "Driver does not support maximizing window");
	 *         }
	 *     },
	 *
	 *     // Uses maximizeWindow as subroutine
	 *     "openMySite": function(test, browser) {
	 *         // Maximize window if possible, but do not register its test assertions.
	 *         this.maximizeWindow(testNoop, browser);
	 *         browser.url("http://localhost/mysite/");
	 *         // Do register this test assertion
	 *         test.ok(true, "Opened my local site");
	 *     }
	 * }
	 */
	testNoop: {
		ok: n,
		equal: n,
		notEqual: n,
		strictEqual: n,
		notStrictEqual: n,
		deepEqual: n,
		notDeepEqual: n,
		same: n,
		throws: muffle,
		doesNotThrow: muffle,
		ifError: n,
		expect: n,
		done: n
	}
};
