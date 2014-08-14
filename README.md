# webfiberunit 
[![Build Status](https://travis-ci.org/nickyout/webfiberunit.svg?branch=master)](https://travis-ci.org/nickyout/webfiberunit)

Combines [WebdriverIO][io], [Nodeunit][nu] and [synchronize][sync] to form a nodeunit-style synchronous selenium test runner. The main goals were to simplify writing tests, running the same test suites in different browsers and creating a runner that you can trust to run all tests without dying or freezing.  

It essentially does the following:

1.  Uses synchronize on WebdriverIO to make it possible to run instances synchronously (provided they are run in a [fiber][fib]).
2.  Wraps every nodeunit test case in such a fiber. 
3.  Adds a WebdriverIO instance to every test case.

It comes with these handy features:

*   It runs every specified test suite against every specified browser.
*   It makes the WebdriverIO API fully synchronous, 
*   It manages setup and teardown of the WebdriverIO instance, as well as calling nodeunit's mandatory `test.done()` on exiting a test case, by default (can be disabled).  
*   It automatically catches uncaught test case errors (whether those are thrown by WebdriverIO or your code), closing the current selenium browser instance, marking the current test as failed *and continuing with the remaining test cases*.

This runner has no known issues, but it has not yet used outside its unit tests. 

### WebdriverIO API
See the [WebdriverIO Github repo][io-api-g], and [the webdriver.io website][io-api-s]. 

Most commands use CSS or XPath selectors. If you use Chrome DevTools, right-click on any html node to get the CSS or XPath selector. 

## Install
Because of [synchronize][sync]'s inevitable dependency on [node-fibers][fib], you probably have to install webfiberunit module with sudo/as administrator. Run:
```
npm install webfiberunit --save-dev
```

Now you can use `var webfiberunit = require('webfiberunit');`

## Example setup

Test config `config/local.js`:
```js
module.exports = [{
    browser: {
        browserName: "firefox"
    }
}, {
    browser: {
        browserName: "chrome"
    }
}]
```

Test module `test/suite.js`:
```js
module.exports = {
    "testGoogle": function(test, browser) {
        browser.url("http://www.google.com");
        var str = browser.getTitle();
        test.ok(/google/i.test(str), "Google homepage title contains google");
    }
}
```

Assuming an instance of selenium is already running, execute script:
```js
require('webfiberunit').reporters['verbose'].run('config/local.js', ['test/suite.js']);
```

Running in terminal outputs:
```
Setup:
• Browsers:
  • [local] Chrome
  • [local] Firefox
• Test files:
  • suite.js
  
[local] Chrome: suite.js
✔ testGoogle
  ✔ Google homepage title contains google

[local] Firefox: suite.js
✔ testGoogle
  ✔ Google homepage title contains google
  
OK: 2 assertions (5426ms)
```

## The module
The webfiberunit module looks a lot like the nodeunit module. It provides a subset of its methods and utilities, as much as possible in the same format. In practice, `webfiberunit.runFiles()` will be the method you will most likely use.   

### webfiberunit.runFiles(webdriverConfigs, paths, options)
Runs any specified webdriver configs against any test modules, and provides the possibility to use the reporter 'hooks'. 

*webdriverConfigs*

*   Type: `String|Object|Function|Array`
*   Specify paths to your webdriver configuration objects/arrays, or specify them directly. Ultimately, webdriverConfigs will result in a flat array of objects and functions. The objects must be webdriver config-formatted. If you want full control of the creation of the instance to use in your tests, you use a function. This is advanced use; build the jsdoc documentation of the project for the full story. 
 
*paths*

*   Type: `Array.<String>`
*   Specify an array of paths to your webfiberunit test suites. Works just like nodeunit. 

*options*

*   Type: `Object`
*   Optional
*   The options object passed to nodeunit. Mostly used to specify test reporter hooks (functions). See also docs on [nodeunit test reporters][nu-tr]. Note that every reporter hook's context (`this`) will be the currently active webdriver config (except reporter hook `done()`).

### webfiberunit.utils
Type: `Object`

Public utilities of the webfiberunit module. Currently contains only one utility:

#### webfiberunit.utils.format(webdriverConfig, format, args...)
Enables formatting strings using the properties of the webdriver config. 

*webdriverConfig*

*   Type: `Object`
*   An (already resolved) webdriver config.
 
*format*

*   Type: `String`
*   Optional
*   The string format used to create the string. Uses the same printf style formatting as NodeJS' native [util.format][no-fo]. If unspecified, an format string is created dynamically that will make the best of the information available from the webdriver config. Available placeholders are: 
    *   *%HOST%*, derived from host.host
	*   *%PORT%*, derived from host.port
	*   *%BROWSER%*, first letter capitalized, derived from host.desiredCapabilities.browser or browser.browser or host.desiredCapabilities.browserName or browser.browserName
	*   *%BROWSER_VERSION%*, derived from host.desiredCapabilities.browser_version or browser.browser_version or host.desiredCapabilities.version or browser.version
	*   *%OS%*, first letter capitalized, derived from host.desiredCapabilities.os or browser.os or host.desiredCapabilities.platform or browser.platform
	*   *%OS_VERSION%*, derived from host.desiredCapabilities.os_version or browser.os_version
	*   *%DEVICE%*, derived from host.desiredCapabilities.device or browser.device

*args...*

*   Type: `*`
*   Optional, repeating
*   Any other arguments passed after the format string can be referred to using %s or any other placeholder supported by [util.format][no-fo]. 

### webfiberunit.reporters
Type: `Object`

Works just like nodeunit.reporters. In fact, the available reporters are largely copies of the (MIT licensed) nodeunit reporters, adjusted slightly so they output what browsers are associated with which test results. Available reporters are:
 
*   `verbose`: stdout gives human readable output for in the terminal 
*   `html`: stdout gives html that can be piped directly into a file to create a valid html file.  

Any reporter has the same format:
 
#### webfiberunit.reporters\[reportername\].run(webdriverConfigs, paths)

*webdriverConfigs*

*   Type: `String|Object|Function|Array`
*   The same format for webdriverConfigs as that of `webdriverunit.runFiles()`. In short: specify webdriver config objects or paths to modules that return webdriver config objects. 

*paths*

*   Type: `Array`
*   Like nodeunit, specify the paths to your test module(s). Must be paths, must be an array.

## Webdriver config
The webdriver configuration is an object literal that dictates how the WebdriverIO object should be constructed. 
Technically, all properties of a config are optional. In practice, you will probably want to specify at least a browser. 

### config.browser
Type: `Object` 
Default value: `{}`

Dictates which browser to start up, and under what environment. The selenese term is desiredCapabilities, but basically describes what browser you want to use. See also [WebdriverIO desired capabilities][io-cap].

### config.host
Type: `Object` 
Default value: `{}`
 
Dictates where selenium is running. The configuration passed to `webdriverio.remote(config.host)`. The default will point to a local instance of selenium. See also [WebdriverIO][io]. 

#### config.host.desiredCapabilities
Type: `Object` 
Default value: `{}`

Dictates which browser to start up, and under what environment (just like `config.browser`. This is the format that webdriverio uses natively. Merged with `config.browser`, resolving duplicates with `config.host.desiredCapabilities`. See also [WebdriverIO desired capabilities][io-cap]. 

### config.url
Type: `String` 
Default value: `null`
 
The url to open after the webdriverio instance has been initialized, but before the test case has started. If no url is specified, no url is opened. 

### config.events
Type: `Object`
Default value: `null`

Offers the possibility to add one event listener per event type of webdriverio. See also [WebdriverIO event handling][io-ev].

### config.commands
Type: `Object`
Default value: `null`

Offers the possibility to add custom commands to the WebdriverIO instance. See also [WebdriverIO event handling][io-cc].

## A webfiberunit test suite
(elaborate on difference)

## Test case execution
Since any test case executed with webfiberunit is intended to use a synchronous webdriverio instance, most test cases should be possible in a fully synchronous format. Taking advantage of this, webfiberunit will, by default, execute several standard calls that should always happen before and after any test case. This is a feature referred to as 'autorun'.  

### With autorun
With autorun enabled, the test case is executed as follows:

*   Before any test case:
    *   a webdriverio instance is created using the provided WebdriverConfig object (or InstanceCreator function)
    *   *(autorun)* if method `init` exists on instance, `instance.init()` is called
    *   *(autorun)* if property `url` is specified in WebdriverConfig and method `url` exists, `instance.url(webdriverConfig.url)` is called. 
*   The test case function is executed with `(test, instance)`
*   If the (initialization of the) test case throws an uncaught error: 
    *   if method `end` exists on instance, `instance.end()` is called
    *   method `test.done(error)` is called, with the uncaught error as argument
*   If the test case function call is executed succesfully:
    *   *(autorun)* if method `end` exists on instance, `instance.end()` is called
*   After any test case:
    *   *(autorun)* if method `removeAllListeners` exists on instance, `instance.removeAllListeners();` is called.
    *   *(autorun)* method `test.done(null)` is called, signifying that no error occurred.

### Without autorun
If you disable autorun, your test case execution will look like this: 

*   Before any test case:
    *   a webdriverio instance is created using the provided WebdriverConfig object (or InstanceCreator function)
*   The test case function is executed with `(test, instance)`
*   If the (initialization of the) test case throws an uncaught error: 
    *   if method `end` exists on instance, `instance.end()` is called
    *   method `test.done(error)` is called, with the uncaught error as argument
    
### Enabling/disabling autorun
As mentioned, autorun is enabled by default. If you wish to disable autorun for a test suite, you must add `autorun: false` to your (nested) test suite. That test suite (and all its nested test suites) will be executed with autorun disabled. 
 
Example of a test module with *and* without autorun:
```js
module.exports = {
    "withAutorun": {
    
        "testcase": function(test, instance) {
            instance.url("http://www.google.com");
            var title = instance.getTitle();
            test.ok(title.search(/google/i) !== -1, "Google title contains google");
        }
    },
    
    "withoutAutorun": {
        
        // Disables autorun for this test suite
        autorun: false,
        
        testcase: function(test, instance) {
            instance.init();
            instance.url("http://www.google.com");
            var title = instance.getTitle();
            test.ok(title.search(/google/i) !== -1, "Google title contains google");
            instance.end();
            test.done();
        }
    }
}
```

It is also possible to explicitly enable autorun by adding `autorun: true`. This can be used to enable autorun for a test suite nested inside a test suite that has autorun disabled. 

## Reporter options
Since webfiberunit uses nodeunit, all default reporter options (moduleStart, moduleDone, done, etc) are supported, and added one more hook:

*   `options.start()` complements `options.done()` and is thus only used with `webfiberunit.runFiles()`.

In order to make it possible to identify what browser was used at every reporter option call, the context (`this`, normally unused) is set to the WebdriverConfig object currently being used. In the cases of `options.start()` and `options.done()`, it is set to an array containing all WebdriverConfig objects passed to the function (even if you passed one object).

## Miscellaneous

### Unit tests
For the unit test to run as intended, make sure you have the following:

*   Selenium, running locally
*   Chrome 
*   Firefox
*   Globally available `grunt-cli`
 
Go to the root folder of this module, and run:
```
npm install
npm test
```

### Documentation
To build the documentation, make sure to have:
 
*   Globally available `grunt-cli`
 
As `grunt-jsdoc` keeps breaking the travis build, I have currently removed it from devDependencies. You should still be able to install it manually, though it may occasionally fail to do so on the first try. Go to the root folder of this module, and run:
```
npm install
npm install grunt-jsdoc
grunt jsdoc
```

The documentation will be built into `doc/` in the module's root folder. 

## Todo:

*   ~~Add JS error tracker~~
*   ~~Add utils.testNoop~~
*   ~~Graceful shutdown on Ctrl + C (process.on('SIGINT'))~~
*   ~~Update webdriverjs to webdriverio (2.0)~~
*   Enable/provide access to screenshot on error
*   Add setUp & tearDown for every webdriver instance
*   Add jsLogTrack feature to capture console.log/warn/error
*   Explain the webfiberunit-style test suite


[io]:       https://github.com/webdriverio/webdriverio                          "WebdriverIO (Github)"
[io-cap]:   https://github.com/webdriverio/webdriverio#desiredcapabilities      "WebdriverIO desired capabilities (Github)"
[io-ev]:    https://github.com/webdriverio/webdriverio#eventhandling            "WebdriverIO event handling (Github)"
[io-cc]:    https://github.com/webdriverio/webdriverio#adding-custom-commands   "WebdriverIO custom commands (Github)"
[io-api-g]: https://github.com/webdriverio/webdriverio#list-of-current-helper-methods "WebdriverIO API (Github)"
[io-api-s]: http://webdriver.io/docs.html                                       "WebdriverIO API (website)"
[sync]:     http://alexeypetrushin.github.io/synchronize/docs/index.html        "Synchronize (website)" 
[nu]:       https://github.com/caolan/nodeunit                                  "Nodeunit (Github)"
[nu-tr]:    https://github.com/caolan/nodeunit#writing-a-test-reporter          "Nodeunit reporter options (Github)"
[no-fo]:    http://nodejs.org/api/util.html#util_util_format_format             "NodeJS util.format"
[fib]:      https://github.com/laverdet/node-fibers                             "Node fibers (Github)"
