var wdjs = require('webdriverio'),
	u = require('lodash'),
	sync = require('synchronize'),
	debug = require('./debug'),
	commands = require('./commands'),
	index = -1,
	p = "Aborting:";

/**
 * @typedef {Array} InstanceSyncDefinition
 * @prop {*} 0 - the instance to use instead of the default webdriverio instance. If you go for something other than webdriverio, do note that, unless you add autorun:false to your test suite, webfiberunit will still attempt to execute the methods associated with autorun.
 * @prop {Array.<String>} [1] - the exclude list of method names to apply sync() to. Usually, sync() will be able to properly synchronous methods. In some cases, it will mistake a synchronous method for an async one, causing unexpected behavior. If do not specify this array, all methods are applied to sync().
 * @see InstanceCreator
 * @tutorial autorun
 */

/**
 * Dictates how to create the webdriverio instance for the test case at hand. Should provide enough configuration options to cover most use cases. If not, use the {@link InstanceCreator} notation instead.
 * @typedef {Object} WebdriverConfig
 * @prop {Object} [host] - webdriverio remote config. Defaults to local selenium
 * @prop {Object} [host.desiredCapabilities] - webdriverio desiredCapabilities. Merged over 'browser' (per property, duplicates resolved with host.desiredCapabilities).
 * @prop {Objects} [browser] - used to fill in webdriverio's desiredCapabilities. Redundant, but I personally prefer this over the host.desiredCapabilities notation.
 * @prop {Object.<Function>} [commands] - custom commands added to the webdriverio instance. Make sure their last argument is a callback function that expects (error, result).
 * @prop {Object.<Function>} [events] - the event handlers to attach to the webdriverio instance. In the handler, 'this' is set to be the entire webdriverConfig of the current instance.
 * @prop {Function} [events.init] - triggered on webdriverio init, and thus before each test case
 * @prop {Function} [events.command] - triggered on every webdriverio command (including init)
 * @prop {Function} [events.end] - triggered on webdriverio end, and thus after each test case
 * @prop {Function} [events.error] - triggered on every error thrown in a test case
 * @prop {String} [url] - the url to open after initialization. Only when autorun is enabled.
 * @see InstanceCreator
 * @example
 * // Minimal browser object example (local selenium)
 * var browser = {
 *     browserName: "chrome"
 * }
 * @example
 * // Convoluted custom command example
 * var webdriverConfig = {
 *     commands: {
 *         // Make sure to end with callback
 *         waitForClick: function(selector, timeout, callback) {
 *             this.waitFor(selector, timeout, function(error, result) {
 *                 if (err) {
 *                     console.error(error);
 *                     // Result can be left undefined if error is specified
 *                     callback(error);
 *                 } else {
 *                     this.click(result.value, function(error, result) {
 *                         if (error) {
 *                             console.error(error);
 *                         }
 *                         // Insist on this return format
 *                         callback(error, result);
 *                     });
 *                 }
 *             });
 *         }
 *     }
 * }
 * @example
 * // Event handler example
 * var events = {*     init: function(event) {
 *         var webdriverConfig = this;
 *         console.log("Test module started with webdriverConfig:", webdriverConfig);
 *     }
 * }
 */

/**
 * A function that dictates what instance will be appended to the nodeunit tests, and which of its methods should be omitted from applying sync().
 * It receives no arguments.
 * @typedef {Function} InstanceCreator
 * @returns {InstanceSyncDefinition}
 * @example
 * // A very simple example of the default webdriverio instance
 * function instanceCreator() {
 * 	   var webdriver = require('webdriverio');
 *     return [
 *         webdriver.remote(),
 *         ['removeAllListeners', 'on', 'once', 'removeEventListener', 'emit']
 *     ];
 * }
 */

/**
 * Create a webdriverio instance with the given config and, optionally, helper commands.
 * @param {WebdriverConfig} webdriverConfig
 * @returns {InstanceSyncDefinition}
 */
function init(webdriverConfig) {
	var name,
		browser = webdriverConfig.browser && u.clone(webdriverConfig.browser) || {},
		remoteConfig = u.merge({ desiredCapabilities: browser }, webdriverConfig.host || {}),
		helperCommands = u.merge({}, commands, webdriverConfig.commands),
		eventHandlers = webdriverConfig.events;

	var inst = wdjs.remote(remoteConfig);
	if (helperCommands) {
		for (name in helperCommands) {
			if (u.isFunction(helperCommands[name])) {
				inst.addCommand(name, helperCommands[name]);
			}
		}
	}
	if (eventHandlers) {
		for (name in eventHandlers) {
			if (u.isFunction(eventHandlers[name])) {
				inst.on(name, eventHandlers[name].bind(webdriverConfig));
			}
		}
	}
	return [inst, ['removeAllListeners', 'on', 'once', 'removeEventListener', 'emit']];
}

/**
 * Creates a function that executes the given testFunction in a fiber, allowing synchronized webdriverio calls. Also offers the option to create an alternative instance to use instead of webdriverio.
 *
 * @param {WebdriverConfig|InstanceCreator} webdriverConfig - the configuration for the webdriverio instance, or the function that will return an {@link InstanceSyncDefinition}.
 * @param {Function} testFunction - the test function to execute
 * @param {Boolean} [autorun=true] - whether or not to call instance.init() before the test case, and instance.end() as well as test.done() synchronously after the test case.
 * @returns {Function} the test case (function) that nodeunit will call.
 */
function createRunner(webdriverConfig, testFunction, autorun) {
	typeof autorun === "undefined" && (autorun = true);
	return function(test) {

		// If NODEUNIT_FLUSH is truey, mark all tests as done immediately
		// Should not be necessary... but just in case killing does not work, omitting all will
		if (process.env.NODEUNIT_FLUSH) {
			console.error(p, "Omitting test...");
			test.done(new Error("Test aborted."));
			return;
		}

		sync.fiber(function() {
			var i = ++index,
				exiter;
			debug('testcase #%s start, using', i, webdriverConfig);
			var error = null;
			try {
				var arr = typeof webdriverConfig === "function" && webdriverConfig() || init(webdriverConfig),
					inst = arr[0],
					excludeList = arr[1];
				for (var name in inst) {
					if (u.isFunction(inst[name]) && (!excludeList || excludeList.indexOf(name) === -1)) {
						sync(inst, name);
					}
				}

				// From this point, init can trigger a browser, which will have to be killed
				exiter = exitHandler.bind(inst, test);
				process.on('SIGINT', exiter);
				if (autorun && inst.init) {
					inst.init();

					// If desired, possible and not flushing, open url
					if (!process.env.NODEUNIT_FLUSH && webdriverConfig.url && inst.url) {
						inst.url(webdriverConfig.url);
					}
				}
				// Unless flushing, start the tests
				if (!process.env.NODEUNIT_FLUSH) {
					testFunction.call(this, test, inst);
				}
			} catch (err) {
				debug('testcase #%s uncaught error (%s)', i, err);
				error = err;
			}
			if (exiter) {
				process.removeListener('SIGINT', exiter);
			}
			if (!process.env.NODEUNIT_FLUSH) {
				if (autorun || error) {
					inst && inst.end && inst.end();
					inst && inst.removeAllListeners && inst.removeAllListeners();
					test.done(error);
				}
			}
			debug('testcase #%s finish', i);
		});

	}
}

function exitHandler(test) {
	if (process.env.NODEUNIT_FLUSH) {
		console.error(" (Use Ctrl+D to kill immediately)");
		return;
	}

	// Finishes all tests
	process.env.NODEUNIT_FLUSH = true;

	// Death to all inside fiber, except test.done()
	for (var name in test) {
		if (typeof test[name] !== "function" || name === "done") {
			continue;
		}
		test[name] = function() {
			throw new Error("Test aborted");
		}
	}

	var inst = this,
		intervalID,
		count = 3,
		exiter = function(err) {
			console.error(p, (err || "success"));
			process.kill(process.pid, "SIGTERM");
		},
		ender = function() {
			// Prefer end
			if (inst && inst.end) {
				console.error(p, "shutting down browser...");
				inst.end(exiter);
			} else {
				// If impossible, kill regardless
				console.error(p, "did not find any browser. Omitting...");
				test.done(new Error("Test aborted"));
			}
		};

	console.error(' ');
	if (inst.requestHandler.sessionID) {
		// Session already established, end it
		ender();
	} else {
		// Wait for init complete, we really want to a sessionId to close down.
		console.error(p, "waiting to shut down browser...");
		intervalID = setInterval(function() {
			if (inst.requestHandler.sessionID || --count==0) {
				clearInterval(intervalID);
				ender();
				return;
			}
			console.error(p,"waiting",count,"more seconds...");
		}, 1000);
		inst.once('init', function(e) {
			if (e.sessionId) {
				clearInterval(intervalID);
				ender();
			}
		});
	}
}

/**
 * Accepts a webdriverjs remote config and nodeunit-format test suite. Returns a synchronized webdriverjs test suite.
 * <p/>
 * Each function in the test suite will be given an initialized webdriver instance as second parameter. When the  function is left (by either return, uncaught error or end of function) the test will automatically be marked as done and the webdriver instance is 'end'ed.
 * @param {WebdriverConfig|InstanceCreator} webdriverConfig
 * @param {Object|Function} test - a nodeunit-format test suite or test function
 * @param {Boolean} [autorun=true] - determines whether or not to enable autorun for the testSuite
 * @returns {Object} - the test suite that can be fed to nodeunit.runModule
 * @alias module:webfiberunit/src/webfiber
 */
function webfiber(webdriverConfig, test, autorun) {
	var returnVal;
	if (u.isPlainObject(test)) {
		returnVal = {};
		if (test.hasOwnProperty('autorun') && typeof test.autorun !== "function") {
			autorun = test.autorun;
		}
		for (var name in test) {
			returnVal[name] = webfiber(webdriverConfig, test[name], autorun);
			//sync(returnVal, name);
		}
	} else if (u.isFunction(test)) {
		returnVal = createRunner(webdriverConfig, test, autorun);
	} else {
		returnVal = test;
	}

	return returnVal;
}

/**
 * @module webfiberunit/src/webfiber
 */
module.exports = webfiber;