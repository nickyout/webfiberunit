var webfiber = require('./webfiber'),
	nodeunit = require('nodeunit'),
	types = nodeunit.types,
	utils = nodeunit.utils,
	async = require('nodeunit/deps/async'),
	path = require('path'),
	u = require('lodash');

function forEachWebdriverConfig(webdriverConfigs, fn, doneFn) {
	doneFn || (doneFn = function() {});
	async.concatSeries(webdriverConfigs, function(webdriverConfig, cb) {
		fn(webdriverConfig, cb);
	}, doneFn);
}

function bindOptions(options, ctx) {
	options = types.options(options);
	var returnOptions = {};
	for (var name in options) {
		if (typeof options[name] === "function") {
			returnOptions[name] = options[name].bind(ctx);
		} else {
			returnOptions[name] = options[name];
		}
	}
	return returnOptions;
}

/**
 * @module webfiberunit
 */
module.exports = {

	/**
	 * Executes every test with every webdriverConfig. A new synchronous webdriverio instance is created for every test case.
	 * @param {String|WebdriverConfig|InstanceCreator|Array} webdriverConfigPaths - {@link WebdriverConfig} objects or {@link InstanceCreator} functions, or paths to modules returning such values.
	 * @param {Array.<String>} paths - paths to test files
	 * @param {Object} options - nodeunit opt object, used for reporter hooks
	 */
	runFiles: function(webdriverConfigPaths, paths, options) {
		var all_assertions = [];
		var start = new Date().getTime();
		if (!u.isArray(webdriverConfigPaths)) {
			webdriverConfigPaths = [webdriverConfigPaths];
		}
		// Resolve and flatten
		webdriverConfigPaths = u.flatten(webdriverConfigPaths.map(function(val) {
			return (typeof val === "string") && require(path.resolve(process.cwd(), val)) || val;
		}));
		if (!u.isArray(paths)) {
			paths = [paths];
		}

		if (options.start) {
			var testNames = paths.map(function(val) {
				return typeof val == "string" && path.basename(val) || val;
			});
			options.start.call(webdriverConfigPaths, testNames);
		}
		if (!paths.length || !webdriverConfigPaths.length) {
			return options.done.call(webdriverConfigPaths, types.assertionList(all_assertions));
		}

		utils.modulePaths(paths, function (err, files) {
			if (err) throw err;
			async.concatSeries(files, function (file, cb) {
					var name = path.basename(file);
					module.exports.runModule(webdriverConfigPaths, name, require(file), options, cb);
				},
				function (err, all_assertions) {
					var end = new Date().getTime();
					nodeunit.done();
					options.done.call(webdriverConfigPaths, types.assertionList(all_assertions, end - start));
				});
		});
	},

	/**
	 *
	 * @param {WebdriverConfig|InstanceCreator|Array.<WebdriverConfig|InstanceCreator>} webdriverConfigs
	 * @param {String} name
	 * @param {Object} suite
	 * @param {Object} options
	 * @param {Function} callback
	 */
	runModule: function(webdriverConfigs, name, suite, options, callback) {
		if (!u.isArray(webdriverConfigs)) {
			webdriverConfigs = [webdriverConfigs];
		}
		forEachWebdriverConfig(webdriverConfigs, function(webdriverConfig, cb) {
			var moduleOptions = bindOptions(options || {}, webdriverConfig);
			nodeunit.runModule(name, webfiber(webdriverConfig, suite), moduleOptions, cb);
		}, function(err, all_assertions) {
			callback(err, types.assertionList(all_assertions));
		});
	},

	/**
	 *
	 * @param {WebdriverConfig|InstanceCreator} webdriverConfig
	 * @param {String} name
	 * @param {Object} suite
	 * @param {Object} options
	 * @param {Function} callback
	 */
	runSuite: function(webdriverConfig, name, suite, options, callback) {
		nodeunit.runSuite(name, webfiber(webdriverConfig, suite), options, callback);
	},

	/**
	 *
	 * @param {WebdriverConfig|InstanceCreator} webdriverConfig
	 * @param {String} name
	 * @param {Function} fn
	 * @param {Object} options
	 * @param {Function} callback
	 */
	runTest: function(webdriverConfig, name, fn, options, callback) {
		nodeunit.runTest(name, webfiber(webdriverConfig, fn), options, callback);
	}
};