'use strict';

const { suite } = require('uvu');
const assert = require('uvu/assert');
const types = require('../index.js');
const check = require('./utils.js');

const testSuite = suite('isDefine');

testSuite('detects define function calls', () => {
  assert.ok(check('define();', types.isDefine));
});

testSuite.run();
