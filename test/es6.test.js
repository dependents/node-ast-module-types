'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const types = require('../index.js');
const check = require('./utils.js');

const testSuite = suite('module-types');

testSuite('detects es6 imports', () => {
  assert.ok(check('import {foo, bar} from "mylib";', types.isES6Import, true));
  assert.ok(check('import * as foo from "mod.js";', types.isES6Import, true));
  assert.ok(check('import "mylib2";', types.isES6Import, true));
  assert.ok(check('import foo from "mod.js";', types.isES6Import, true));
  assert.ok(check('import("foo");', types.isES6Import, true));
});

testSuite('detects es6 exports', () => {
  assert.ok(check('export default 123;', types.isES6Export, true));
  assert.ok(check('export {foo, bar}; function foo() {} function bar() {}', types.isES6Export, true));
  assert.ok(check('export { D as default }; class D {}', types.isES6Export, true));
  assert.ok(check('export function inc() { counter++; }', types.isES6Export, true));
  assert.ok(check('export * from "mod";', types.isES6Export, true));
});

testSuite('detects dynamic imports', () => {
  assert.ok(check('import("./bar");', types.isDynamicImport, true));
  assert.ok(check('function foo() { import("./bar"); }', types.isDynamicImport, true));
});

testSuite.run();
