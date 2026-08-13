import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { isES6Import, isES6Export, isDynamicImport } from '../index.js';
import check from './utils.js';

const testSuite = suite('module-types');

testSuite('detects es6 imports', () => {
  assert.ok(check('import {foo, bar} from "mylib";', isES6Import));
  assert.ok(check('import * as foo from "mod.js";', isES6Import));
  assert.ok(check('import "mylib2";', isES6Import));
  assert.ok(check('import foo from "mod.js";', isES6Import));
  assert.ok(check('import("foo");', isES6Import));
});

testSuite('detects es6 exports', () => {
  assert.ok(check('export default 123;', isES6Export));
  assert.ok(check('export {foo, bar}; function foo() {} function bar() {}', isES6Export));
  assert.ok(check('export { D as default }; class D {}', isES6Export));
  assert.ok(check('export function inc() { counter++; }', isES6Export));
  assert.ok(check('export * from "mod";', isES6Export));
});

testSuite('detects dynamic imports', () => {
  assert.ok(check('import("./bar");', isDynamicImport));
  assert.ok(check('function foo() { import("./bar"); }', isDynamicImport));
});

testSuite.run();
