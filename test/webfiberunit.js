var webfiberunit = require('../src/webfiberunit'),
	wdio = require('webdriverjs'),
	path = require('path'),
	dummyPath = path.resolve(process.cwd(), "test/fixtures/dummytest.js");


module.exports = {

	"moduleWithEvents": function(test) {
		var numCommands = 0,
			initCalls = 0,
			endCalls = 0;
		test.expect(8);
		webfiberunit.runModule({
				host: {
					desiredCapabilities: {
						"browserName": "firefox"
					}
				},
				events: {
					init: function(e) {
						initCalls++;
					},
					command: function(e) {
						if (this.host.desiredCapabilities.browserName == "firefox") {
							numCommands++;
						}
					},
					error: function(e) {
						test.ok(e, "Got error event");
					},
					end: function(e) {
						endCalls++;
					}
				},
				browser: {
					"browserName": "chrome"
				}
			}, 'dummytest', require('./fixtures/dummytest'), {
				moduleStart: function() {
					var webdriverConfig = this;
					test.equal(webdriverConfig.host.desiredCapabilities.browserName, "firefox", "Hook moduleStart has webdriverConfig as this");
				},
				moduleDone: function() {
					var webdriverConfig = this;
					test.equal(webdriverConfig.host.desiredCapabilities.browserName, "firefox", "Hook moduleDone has webdriverConfig as this");
				}
			},
			function(err, assertions) {
				test.equal(assertions.passes(), 2, "Found the succeeding tests");
				test.equal(assertions.failures(), 0, "Found the failed tests");
				test.ok(!!numCommands, "Command event triggered, got firefox");
				test.equal(initCalls, 2, "Got init event for each test");
				test.equal(endCalls, 2, "Got end event for each test");
				test.done();
			}
		);
	},

	"moduleWithCustomStartup": function(test){
		test.expect(4);
		var autolessTestSuite = {
			autorun: false,

			"manualEverything": function(nest, browser) {
				test.equal(browser.desiredCapabilities.penix, "yep", "Create function gets called");
				test.ok(!browser.requestHandler.sessionID, "Option autorun is false works");
				browser.init();
				browser.url('http://www.google.com');
				test.ok(!!browser.requestHandler.sessionID, "Manual initialization works");
				test.ok(browser.getTitle().search(/google/i) !== -1, "Instance working");
				browser.end();
				nest.done();
			}
		};
		webfiberunit.runModule(function() {
				return [
					wdio.remote({ desiredCapabilities: { browserName: "chrome", penix: "yep" } }),
					['removeAllListeners', 'on', 'once', 'removeEventListener', 'emit']
				]
			}, 'autoless', autolessTestSuite, {}, function(err, assertions) {
				test.done(err);
			}
		);

	},

	"multiWebdriverModule": function(test) {
		webfiberunit.runModule([
				{
					host: {
						desiredCapabilities: {
							"browserName": "chrome"
						}
					}
				},
				{
					host: {
						desiredCapabilities: {
							"browserName": "firefox"
						}
					}
				}
			], 'dummytest', require('./fixtures/dummytest'), {},
			function(err, assertions) {
				test.equal(assertions.passes(), 4, "Found the succeeding tests");
				test.equal(assertions.failures(), 0, "Found the failed tests");
				test.done();
			});
	},
	"file": function(test) {

		webfiberunit.runFiles({
			host: {
				desiredCapabilities: {
					"browserName": "chrome"
				}
			}
		}, [dummyPath], {
			done: function (assertions) {
				test.equal(assertions.passes(), 2, "Found the succeeding tests");
				test.equal(assertions.failures(), 0, "Found the failed tests");
				test.done();
			}
		});
	},

	"multiFile": function(test) {
		webfiberunit.runFiles({
			host: {
				desiredCapabilities: {
					"browserName": "chrome"
				}
			}
		}, [dummyPath, dummyPath], {
			done: function (assertions) {
				test.equal(assertions.passes(), 4, "Found the succeeding tests");
				test.equal(assertions.failures(), 0, "Found the failed tests");
				test.done();
			}
		});
	},

	"multiWebdriverMultiFile": function(test) {
		var toggle = false,
			correctOrder = true,
			orderNo = 0,
			firefox = {
				host: {
					desiredCapabilities: {
						"browserName": "firefox"
					}
				}
			},
			chrome = {
				host: {
					desiredCapabilities: {
						"browserName": "chrome"
					}
				}
			},
			webdriverConfigs = [chrome,firefox];

		webfiberunit.runFiles(webdriverConfigs, [dummyPath, dummyPath], {
			start: function() {
				test.same(this, webdriverConfigs, "start: webdriverConfigs available from this");
			},
			moduleStart: function() {
				orderNo++;
				if (orderNo%2) {
					test.same(this, chrome, "moduleStart: webdriverConfig in order #"+orderNo+" (chrome)");
				} else {
					test.same(this, firefox, "moduleStart: webdriverConfig in order #"+orderNo+" (firefox)");
				}
			},
			moduleDone: function() {
				if (orderNo%2) {
					test.same(this, chrome, "moduleDone:  webdriverConfig in order #"+orderNo+" (chrome)");
				} else {
					test.same(this, firefox, "moduleDone:  webdriverConfig in order #"+orderNo+" (firefox)");
				}
			},
			done: function (assertions) {
				test.equal(assertions.passes(), 8, "Found the succeeding tests");
				test.equal(assertions.failures(), 0, "Found the failed tests");
				test.same(this, webdriverConfigs, "done: webdriverConfigs available from this");
				test.done();
			}
		});
	}
};
