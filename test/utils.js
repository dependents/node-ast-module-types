import Walker from 'node-source-walk';
import types from '../index.js';

// Checks whether or not the checker succeeds on
// a node in the AST of the given source code
function check(code, checker, harmony) {
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
}

export default check;
