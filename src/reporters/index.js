/**
 * @module webfiberunit/src/reporters
 */
var reporters = {

	/**
	 * @memberof module:webfiberunit/src/reporters
	 * @type {Object}
	 * @prop {Function} run
	 */
	'html': require('./html'),

	/**
	 * @memberof module:webfiberunit/src/reporters
	 * @type {Object}
	 * @prop {Function} run
	 */
	'verbose': require('./verbose'),

	/**
	 * Default is verbose.
	 * @memberof module:webfiberunit/src/reporters
	 * @type {Object}
	 * @prop {Function} run
	 */
	'default': require('./verbose')
};

module.exports = reporters;