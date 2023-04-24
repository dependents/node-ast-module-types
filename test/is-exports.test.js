'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const types = require('../index.js');
const check = require('./utils.js');

const testSuite = suite('isExports');

testSuite('detects module.exports CJS style exports', () => {
  assert.ok(check('module.exports.foo = function() {};', types.isExports));
  assert.ok(check('module.exports = function() {};', types.isExports));
  assert.ok(check('module.exports = {};', types.isExports));
});

testSuite('detects plain exports CJS style exports', () => {
  assert.ok(check('exports = function() {};', types.isExports));
  assert.ok(check('exports.foo = function() {};', types.isExports));
  assert.ok(check('exports = {};', types.isExports));
});

testSuite.run();
