import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import types from '../index.js';
import check from './utils.js';

const testSuite = suite('isDefineAMD');

testSuite('does not detect a generic define function call', () => {
  assert.not.ok(check('define();', types.isDefineAMD));
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
  assert.not.ok(check('define();', types.isDefineAMD));
  assert.not.ok(check('require();', types.isDefineAMD));
});

testSuite('detects AMD define with arrow callback returning class', () => {
  assert.ok(check('define(["jquery"] , ($) => { class A {} return A;});', types.isDefineAMD));
});

testSuite('detects AMD forms with arrow callbacks', () => {
  assert.ok(check('define("name", ["jquery"], ($) => $);', types.isDefineAMD));
  assert.ok(check('define(["jquery"], ($) => $);', types.isDefineAMD));
  assert.ok(check('define((require) => require("jquery"));', types.isDefineAMD));
  assert.ok(check('define((require, exports, module) => { exports.x = true; });', types.isDefineAMD));
});

testSuite.run();
