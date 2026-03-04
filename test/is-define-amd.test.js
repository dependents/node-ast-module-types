import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { isDefineAMD } from '../index.js';
import check from './utils.js';

const testSuite = suite('isDefineAMD');

testSuite('detects all AMD define forms and ignores generic define calls', () => {
  assert.not.ok(check('define();', isDefineAMD));
  // Named form
  assert.ok(check('define("foobar", ["a"], function(a){});', isDefineAMD));
  // Dependency form
  assert.ok(check('define(["a"], function(a){});', isDefineAMD));
  // Factory form
  assert.ok(check('define(function(require){});', isDefineAMD));
  // REM form
  assert.ok(check('define(function(require, exports, module){});', isDefineAMD));
  // No-dependency form
  assert.ok(check('define({});', isDefineAMD));
});

testSuite('detects a named form AMD define function call', () => {
  assert.not.ok(check('define();', isDefineAMD));
  assert.not.ok(check('require();', isDefineAMD));
});

testSuite('detects AMD define with arrow callback returning class', () => {
  assert.ok(check('define(["jquery"] , ($) => { class A {} return A;});', isDefineAMD));
});

testSuite('detects AMD forms with arrow callbacks', () => {
  assert.ok(check('define("name", ["jquery"], ($) => $);', isDefineAMD));
  assert.ok(check('define(["jquery"], ($) => $);', isDefineAMD));
  assert.ok(check('define((require) => require("jquery"));', isDefineAMD));
  assert.ok(check('define((require, exports, module) => { exports.x = true; });', isDefineAMD));
});

testSuite.run();
