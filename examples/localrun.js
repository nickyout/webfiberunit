/**
 * Paths (except require) are resolved using process.cwd().
 */
require('../index').reporters['default'].run('test/config/local', ['test/fixtures/dummytest.js']);