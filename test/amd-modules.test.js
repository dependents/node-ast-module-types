import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
  isAMDDriverScriptRequire,
  isDependencyForm,
  isFactoryForm,
  isNamedForm,
  isNoDependencyForm,
  isREMForm
} from '../index.js';
import check from './utils.js';

const testSuite = suite('isExports');

testSuite('detects driver scripts', () => {
  assert.ok(check('require(["a"], function(a){});', isAMDDriverScriptRequire));
});

testSuite('does not get confused with a commonjs require', () => {
  assert.not.ok(check('require("foo");', isAMDDriverScriptRequire));
});

// named form
testSuite('detects named form', () => {
  assert.ok(check('define("foobar", ["a"], function(a){});', isNamedForm));
});

testSuite('needs 3 arguments', () => {
  assert.not.ok(check('define("foobar", ["a"]);', isNamedForm));
  assert.not.ok(check('define("foobar", ["a"], function(a){}, "foo");', isNamedForm));
});

testSuite('needs the first argument to be a literal', () => {
  assert.not.ok(check('define(["foobar"], ["a"], function(a){});', isNamedForm));
});

testSuite('needs the second argument to be an array', () => {
  assert.not.ok(check('define("foobar", 123, function(a){});', isNamedForm));
});

testSuite('needs the third argument to be a function', () => {
  assert.not.ok(check('define("foobar", ["foo"], 123);', isNamedForm));
  assert.not.ok(check('define("reset", [0, 0], "modifier");', isNamedForm));
});
// });

// dependency form
testSuite('detects dependency form modules', () => {
  assert.ok(check('define(["a"], function(a){});', isDependencyForm));
});

testSuite('needs the first argument to be an array', () => {
  assert.not.ok(check('define(123, function(a){});', isDependencyForm));
});

testSuite('needs the second argument to be a function', () => {
  assert.not.ok(check('define(["a"], 123);', isDependencyForm));
});

testSuite('needs 2 arguments', () => {
  assert.not.ok(check('define(["a"], function(a){}, 123);', isDependencyForm));
});

// factory form
testSuite('detects factory form modules', () => {
  assert.ok(check('define(function(require){});', isFactoryForm));
});

testSuite('needs one argument', () => {
  assert.not.ok(check('define(function(require){}, 123);', isFactoryForm));
});

testSuite('needs the first argument to be a function', () => {
  assert.not.ok(check('define(123);', isFactoryForm));
});

testSuite('detects REM form modules', () => {
  assert.ok(check('define(function(require, exports, module){});', isREMForm));
});

// no dependency form
testSuite('detects no dependency form modules', () => {
  assert.ok(check('define({});', isNoDependencyForm));
});

testSuite('needs a single argument', () => {
  assert.not.ok(check('define({}, 123);', isNoDependencyForm));
});

testSuite('needs the first argument to be an object', () => {
  assert.not.ok(check('define(function(){});', isNoDependencyForm));
});

testSuite.run();
