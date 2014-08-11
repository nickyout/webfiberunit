var util = require('util'),
	u = require('lodash');

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
	}
};
