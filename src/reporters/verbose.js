/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

var nodeunit = require('nodeunit'),
    utils = nodeunit.utils,
	webfiberunit = require('../webfiberunit'),
	format = webfiberunit.utils.format,
    fs = require('fs'),
    track = require('nodeunit/lib/track'),
    path = require('path'),
	util = require('util'),
    AssertionError = require('assert').AssertionError;

exports.info = "Verbose tests reporter";

exports.run = function (webdriverConfigs, files, options, callback) {
	if (!options) {
        // load default options
        options = require('nodeunit/bin/nodeunit.json');
    }

    var error = function (str) {
        return options.error_prefix + str + options.error_suffix;
    };
    var ok    = function (str) {
        return options.ok_prefix + str + options.ok_suffix;
    };
    var bold  = function (str) {
        return options.bold_prefix + str + options.bold_suffix;
    };
    var assertion_message = function (str) {
        return options.assertion_prefix + str + options.assertion_suffix;
    };

    var start = new Date().getTime();
    var paths = files.map(function (p) {
        return path.resolve(p);
    });
    var tracker = track.createTracker(function (tracker) {
        if (tracker.unfinished()) {
            console.log('');
            console.log(error(bold(
                'FAILURES: Undone tests (or their setups/teardowns): '
            )));
            var names = tracker.names();
            for (var i = 0; i < names.length; i += 1) {
                console.log('- ' + names[i]);
            }
            console.log('');
            console.log('To fix this, make sure all tests call test.done()');
            process.reallyExit(tracker.unfinished());
        }
    });

    webfiberunit.runFiles(webdriverConfigs, paths, {
        testspec: options.testspec,
        testFullSpec: options.testFullSpec,

		start: function(testNames) {
			var i, arr, config;
			console.log(bold('Setup:'));
			console.log('• Browsers:');
			i = 0; arr = this;
			while (config = arr[i++]) {
				console.log('  • '+format(config));
				arr[i+1] && console.log('\n');
			}
			console.log('• Test files:');
			i = 0; arr = testNames;
			while (config = arr[i++]) {
				console.log('  • '+config);
				arr[i+1] && console.log('\n');
			}
		},

        moduleStart: function (name) {
            console.log('\n' + bold(format(this) + ': ' + name));
        },
        testDone: function (name, assertions) {
            tracker.remove(name);

            if (!assertions.failures()) {
                console.log('✔ ' + name);
            }
            else {
                console.log(error('✖ ' + name));
            }
            // verbose so print everything
            assertions.forEach(function (a) {
              if (a.failed()) {
                console.log(error('  ✖ ' + a.message));
                a = utils.betterErrors(a);
                console.log('  ' + a.error.stack);
              }
              else {
                console.log('  ✔ ' + a.message);
              }
            });
        },
        done: function (assertions, end) {
            var end = end || new Date().getTime();
            var duration = end - start;
            if (assertions.failures()) {
                console.log(
                    '\n' + bold(error('FAILURES: ')) + assertions.failures() +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)'
                );
            }
            else {
                console.log(
                   '\n' + bold(ok('OK: ')) + assertions.length +
                   ' assertions (' + assertions.duration + 'ms)'
                );
            }
            
            if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
        },
        testStart: function(name) {
            tracker.put(name);
        }
    });
};
