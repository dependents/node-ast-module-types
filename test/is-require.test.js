import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { isRequire, isTopLevelRequire } from '../index.js';
import check from './utils.js';

const testSuite = suite('isRequire');

testSuite('detects require function calls', () => {
  assert.ok(check('require();', isRequire));
});

testSuite('detects require.main.require function calls', () => {
  assert.ok(check('require.main.require();', isRequire));
});

testSuite('detects top-level (i.e., top of file) require function calls', () => {
  assert.ok(check('require();', isTopLevelRequire));
  assert.not.ok(check('var foo = 2; \nrequire([], function(){});', isTopLevelRequire));
  assert.ok(check('require(["a"], function(a){});', isTopLevelRequire));
});

testSuite('does not fail on es6', () => {
  assert.not.throws(() => {
    check('import require from "mylib"; \nrequire();', isTopLevelRequire, true);
  });
});

testSuite.run();
