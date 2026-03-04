import Walker from 'node-source-walk';

// Checks whether or not the checker succeeds on
// a node in the AST of the given source code
function check(code, checker, harmony) {
  const walker = new Walker({ esprimaHarmony: Boolean(harmony) });
  let found = false;

  walker.walk(code, node => {
    if (checker(node)) {
      found = true;
      walker.stopWalking();
    }
  });

  return found;
}

export default check;
