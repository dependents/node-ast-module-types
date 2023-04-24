'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const types = require('../index.js');
const check = require('./utils.js');

const testSuite = suite('isRequire');

testSuite('detects require function calls', () => {
  assert.ok(check('require();', types.isRequire));
});

testSuite('detects require function calls', () => {
  assert.ok(check('require.main.require();', types.isRequire));
});

testSuite('detects top-level (i.e., top of file) require function calls', () => {
  assert.ok(check('require();', types.isTopLevelRequire));
  assert.ok(!check('var foo = 2; \nrequire([], function(){});', types.isTopLevelRequire));
  assert.ok(check('require(["a"], function(a){});', types.isTopLevelRequire));
});

testSuite('does not fail on es6', () => {
  assert.not.throws(() => {
    check('import require from "mylib"; \nrequire();', types.isTopLevelRequire, true);
  });
});

testSuite.run();
