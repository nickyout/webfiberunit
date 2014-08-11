var util = require('util');

function createInjectionScript(fn, args) {
	var arr = args,
		i = -1,
		max =arr.length,
		el,
		script = 'return (' + fn + ')(';
	while (++i < max) {
		el = arr[i];
		if (typeof el === "string") {
			el = "\"" + el + "\"";
		}
		script += el;
		if (i+1 < max) {
			script += ",";
		}
	}
	return  script + ')';
}

module.exports = {

	/**
	 * Inject javascript into the website. Passes the return value, if any, as callback result.
	 * <p/>
	 * If argument script is a function and args is an array, jsInject will execute your
	 * function with the args array as its arguments and return its result, if any.
	 * <p/>
	 * As javascript cannot refer to any values residing in NodeJS, all required values must be injected along.
	 * @param {String|Function} script
	 * @param {Array=} args -
	 * @param {Function} callback
	 * @memberof module:webfiberunit/src/commands
	 */
	jsInject: function(script, args, callback) {
		if (typeof args === "function") {
			callback = args;
		} else if (typeof script === "function" && util.isArray(args)) {
			script = createInjectionScript(script, args);
		}
		this.execute(script, function(err, result) {
			if (result) {
				result = result.value;
			}
			callback(err, result);
		});
	},

	/**
	 * Start tracking errors on the website
	 * @param callback
	 * @memberof module:webfiberunit/src/commands
	 * @see module:webfiberunit/src/commands.jsErrorLog
	 */
	jsErrorTrack: function(callback) {
		var addErrorHandler = function(inject, cond) {
				var prevFn = false;
				if (cond && !cond()) {
					return false;
				}
				if (window.onerror && typeof window.onerror === "function") {
					prevFn = window.onerror;
				}
				window.onerror = function() {
					var args = Array.prototype.slice.call(arguments);
					return inject.apply(window, args) || prevFn && prevFn.apply(window, args) || false;
				};
				return true;
			},
			cond = function() {
				var present = !window.errorList;
				if (!present) {
					window.errorList = [];
				}
				return present;
			},
			inject = function() {
				window.errorList || (window.errorList = []);
				window.errorList.push([+new Date()].concat(Array.prototype.slice.call(arguments)));
				return false;
			};

		this.jsInject(addErrorHandler, [inject, cond], callback);
	},

	/**
	 * Request the tracking log of errors.
	 * If error logging has not been enabled before this method is called, returns an error.
	 * @param {Boolean=} clear - clear the error log afterwards
	 * @param {Function} callback
	 * @memberof module:webfiberunit/src/commands
	 * @see module:webfiberunit/src/commands.jsErrorTrack
	 */
	jsErrorLog: function(clear, callback) {
		if (typeof clear == "function") {
			callback = clear;
			clear = false;
		}
		var returnLog = function(truncate) {
			var arr = window.errorList,
				returnArr;
			if (!arr) {
				return null;
			}
			returnArr = arr.slice();
			if (truncate) {
				arr.length = 0;
			}
			return returnArr;
		};

		this.jsInject(returnLog, [clear], function(err, result) {
			if (result) {
				result.map(function(val) {
					val[0] = new Date(val[0]);
				});
			} else if (!err) {
				err = new Error("Could not fetch errorList: jsErrorTrack has not been initialized");
			}
			callback(err, result);
		});
	}
};