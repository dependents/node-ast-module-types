'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const types = require('../index.js');
const check = require('./utils.js');

const testSuite = suite('isExports');

testSuite('detects driver scripts', () => {
  assert.ok(check('require(["a"], function(a){});', types.isAMDDriverScriptRequire));
});

testSuite('does not get confused with a commonjs require', () => {
  assert.not.ok(check('require("foo");', types.isAMDDriverScriptRequire));
});

// named form
testSuite('detects named form', () => {
  assert.ok(check('define("foobar", ["a"], function(a){});', types.isNamedForm));
});

testSuite('needs 3 arguments', () => {
  assert.not.ok(check('define("foobar", ["a"]);', types.isNamedForm));
  assert.not.ok(check('define("foobar", ["a"], function(a){}, "foo");', types.isNamedForm));
});

testSuite('needs the first argument to be a literal', () => {
  assert.not.ok(check('define(["foobar"], ["a"], function(a){});', types.isNamedForm));
});

testSuite('needs the second argument to be an array', () => {
  assert.not.ok(check('define("foobar", 123, function(a){});', types.isNamedForm));
});

testSuite('needs the third argument to be a function', () => {
  assert.not.ok(check('define("foobar", ["foo"], 123);', types.isNamedForm));
  assert.not.ok(check('define("reset", [0, 0], "modifier");', types.isNamedForm));
});
// });

// dependency form
testSuite('detects dependency form modules', () => {
  assert.ok(check('define(["a"], function(a){});', types.isDependencyForm));
});

testSuite('needs the first argument to be an array', () => {
  assert.not.ok(check('define(123, function(a){});', types.isDependencyForm));
});

testSuite('needs the second argument to be a function', () => {
  assert.not.ok(check('define(["a"], 123);', types.isDependencyForm));
});

testSuite('needs 2 arguments', () => {
  assert.not.ok(check('define(["a"], function(a){}, 123);', types.isDependencyForm));
});

// factory form
testSuite('detects factory form modules', () => {
  assert.ok(check('define(function(require){});', types.isFactoryForm));
});

testSuite('needs one argument', () => {
  assert.not.ok(check('define(function(require){}, 123);', types.isFactoryForm));
});

testSuite('needs the first argument to be a function', () => {
  assert.not.ok(check('define(123);', types.isFactoryForm));
});

testSuite('detects REM form modules', () => {
  assert.ok(check('define(function(require, exports, module){});', types.isREMForm));
});

// no dependency form
testSuite('detects no dependency form modules', () => {
  assert.ok(check('define({});', types.isNoDependencyForm));
});

testSuite('needs a aingle argument', () => {
  assert.not.ok(check('define({}, 123);', types.isNoDependencyForm));
});

testSuite('needs the first argument to be an object', () => {
  assert.not.ok(check('define(function(){});', types.isNoDependencyForm));
});

testSuite.run();
