import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import types from '../index.js';
import check from './utils.js';

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
