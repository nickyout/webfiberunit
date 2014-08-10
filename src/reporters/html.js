/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

var webfiberunit = require('../webfiberunit'),
	format = webfiberunit.utils.format,
    utils = require('nodeunit').utils,
    fs = require('fs'),
    path = require('path'),
	util = require('util'),
    AssertionError = require('assert').AssertionError;

exports.info = "Report tests result as HTML";

exports.run = function (webfiberConfigs, files, options, callback) {
    var start = new Date().getTime();
    var paths = files.map(function (p) {
        return path.resolve(p);
    });

	if (!options) {
		// load default options
		options = require('nodeunit/bin/nodeunit.json');
	}

	webfiberunit.runFiles(webfiberConfigs, paths, {

        testspec: options.testspec,
        testFullSpec: options.testFullSpec,

		start: function(testNames) {
			console.log('<html>');
			console.log('<head>');
			console.log('<title></title>');
			console.log('<style type="text/css">');
			console.log('body { font: 12px Helvetica Neue }');
			console.log('h2 { margin:0 ; padding:0 }');
			console.log('pre { font: 11px Andale Mono; margin-left: 1em; padding-left: 1em; margin-top:0; font-size:smaller;}');
			console.log('.assertion_message { margin-left: 1em; }');
			console.log('  ol {' +
				'	list-style: none;' +
				'	margin-left: 1em;' +
				'	padding-left: 1em;' +
				'	text-indent: -1em;' +
				'}');
			console.log('  ol li.pass:before { content: "\\2714 \\0020"; }');
			console.log('  ol li.fail:before { content: "\\2716 \\0020"; }');
			console.log('  ol li.bullet:before { content: "\\2022 \\0020"; }');
			console.log('</style>');
			console.log('</head>');
			console.log('<body>');
			console.log('<h2>Setup</h2>');
			console.log('<h3>Browsers:</h3>');
			console.log('<ol>');
			var i, arr, config;
			i = 0; arr = this;
			while (config = arr[i++]) {
				console.log('<li class="bullet">'+format(config)+'</li>');
			}
			console.log('</ol>');
			console.log('<h3>Test files:</h3>');
			console.log('<ol>');
			i = 0; arr = testNames;
			while (config = arr[i++]) {
				console.log('<li class="bullet">'+config+'</li>');
			}
			console.log('</ol>');
			console.log('<h2>Tests</h2>');
		},

        moduleStart: function (name) {
            console.log('<h3>' + format(this) + ': ' + name + '</h3>');
            console.log('<ol>');
        },
        testDone: function (name, assertions) {
            if (!assertions.failures()) {
                console.log('<li class="pass">' + name + '</li>');
            }
            else {
                console.log('<li class="fail">' + name);
                assertions.forEach(function (a) {
                    if (a.failed()) {
                        a = utils.betterErrors(a);
                        if (a.error instanceof AssertionError && a.message) {
                            console.log('<div class="assertion_message">' +
                                'Assertion Message: ' + a.message +
                            '</div>');
                        }
                        console.log('<pre>');
                        console.log(a.error.stack);
                        console.log('</pre>');
                    }
                });
                console.log('</li>');
            }
        },
        moduleDone: function () {
            console.log('</ol>');
        },
        done: function (assertions) {
			console.log('<h2>Result</h2>');
            var end = new Date().getTime();
            var duration = end - start;
            if (assertions.failures()) {
                console.log(
                    '<h3>FAILURES: '  + assertions.failures() +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)</h3>'
                );
            }
            else {
                console.log(
                    '<h3>OK: ' + assertions.length +
                    ' assertions (' + assertions.duration + 'ms)</h3>'
                );
            }
            console.log('</body>');
            console.log('</html>');

            if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
        }
    });
};
