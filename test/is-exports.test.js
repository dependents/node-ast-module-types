import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { isExports } from '../index.js';
import check from './utils.js';

const testSuite = suite('isExports');

testSuite('detects module.exports CJS style exports', () => {
  assert.ok(check('module.exports.foo = function() {};', isExports));
  assert.ok(check('module.exports = function() {};', isExports));
  assert.ok(check('module.exports = {};', isExports));
});

testSuite('detects plain exports CJS style exports', () => {
  assert.ok(check('exports = function() {};', isExports));
  assert.ok(check('exports.foo = function() {};', isExports));
  assert.ok(check('exports = {};', isExports));
});

testSuite.run();
