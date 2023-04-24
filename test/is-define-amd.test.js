'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const types = require('../index.js');
const check = require('./utils.js');

const testSuite = suite('isDefineAMD');

testSuite('does not detect a generic define function call', () => {
  assert.ok(!check('define();', types.isDefineAMD));
  // Named form
  assert.ok(check('define("foobar", ["a"], function(a){});', types.isDefineAMD));
  // Dependency form
  assert.ok(check('define(["a"], function(a){});', types.isDefineAMD));
  // Factory form
  assert.ok(check('define(function(require){});', types.isDefineAMD));
  // REM form
  assert.ok(check('define(function(require, exports, module){});', types.isDefineAMD));
  // No-dependency form
  assert.ok(check('define({});', types.isDefineAMD));
});

testSuite('detects a named form AMD define function call', () => {
  assert.ok(!check('define();', types.isDefineAMD));
});

testSuite.run();
