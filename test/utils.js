'use strict';

const Walker = require('node-source-walk');
const types = require('../index.js');

// Checks whether of not the checker succeeds on
// a node in the AST of the given source code
module.exports = function(code, checker, harmony) {
  const walker = new Walker({ esprimaHarmony: Boolean(harmony) });
  let found = false;

  walker.walk(code, node => {
    // Use call to avoid .bind(types) everywhere
    if (checker.call(types, node)) {
      found = true;
      walker.stopWalking();
    }
  });

  return found;
};
