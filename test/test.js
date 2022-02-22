/* eslint-env mocha */

'use strict';

// TODO switch to assert.strict
const assert = require('assert');
const Walker = require('node-source-walk');
const types = require('../index.js');

// Checks whether of not the checker succeeds on
// a node in the AST of the given source code
function check(code, checker, harmony) {
  let found = false;
  const walker = new Walker({ esprimaHarmony: Boolean(harmony) });

  walker.walk(code, (node) => {
    // Use call to avoid .bind(types) everywhere
    if (checker.call(types, node)) {
      found = true;
      walker.stopWalking();
    }
  });

  return found;
}
  
describe('module-types', () => {
  describe('isDefine', () => {
    it('detects define function calls', () => {
      assert.ok(check('define();', types.isDefine));
    });
  });

  describe('isDefineAMD', () => {
    it('does not detect a generic define function call', () => {
      assert.ok(!check('define();', types.isDefineAMD));
      // Named form
      assert.ok(check('define("foobar", ["a"], function(a){});', types.isDefineAMD));
      // Dependency form
      assert.ok(check('define(["a"], function(a){});', types.isDefineAMD));
      // Factory form
      assert.ok(check('define(function(require){});', types.isDefineAMD));
      // REM form
      assert.ok(check('define(function(require, exports, module){});', types.isDefineAMD));
      // No-dependency form
      assert.ok(check('define({});', types.isDefineAMD));
    });

    it('detects a named form AMD define function call', () => {
      assert.ok(!check('define();', types.isDefineAMD));
    });
  });

  describe('isRequire', () => {
    it('detects require function calls', () => {
      assert.ok(check('require();', types.isRequire));
    });
  });

  describe('isRequire with main-scoped require ', () => {
    it('detects require function calls', () => {
      assert.ok(check('require.main.require();', types.isRequire));
    });
  });

  describe('isTopLevelRequire', () => {
    it('detects top-level (i.e., top of file) require function calls', () => {
      assert.ok(check('require();', types.isTopLevelRequire));
      assert.ok(!check('var foo = 2; \nrequire([], function(){});', types.isTopLevelRequire));
      assert.ok(check('require(["a"], function(a){});', types.isTopLevelRequire));
    });

    it('does not fail on es6', () => {
      assert.doesNotThrow(() => {
        check('import require from "mylib"; \nrequire();', types.isTopLevelRequire, true);
      });
    });
  });

  describe('isExports', () => {
    it('detects module.exports CJS style exports', () => {
      assert.ok(check('module.exports.foo = function() {};', types.isExports));
      assert.ok(check('module.exports = function() {};', types.isExports));
      assert.ok(check('module.exports = {};', types.isExports));
    });

    it('detects plain exports CJS style exports', () => {
      assert.ok(check('exports = function() {};', types.isExports));
      assert.ok(check('exports.foo = function() {};', types.isExports));
      assert.ok(check('exports = {};', types.isExports));
    });
  });

  describe('AMD modules', () => {
    it('detects driver scripts', () => {
      assert.ok(check('require(["a"], function(a){});', types.isAMDDriverScriptRequire));
    });

    it('does not get confused with a commonjs require', () => {
      assert.ok(!check('require("foo");', types.isAMDDriverScriptRequire));
    });

    describe('named form', () => {
      it('detects named form', () => {
        assert.ok(check('define("foobar", ["a"], function(a){});', types.isNamedForm));
      });

      it('needs 3 arguments', () => {
        assert.ok(!check('define("foobar", ["a"]);', types.isNamedForm));
        assert.ok(!check('define("foobar", ["a"], function(a){}, "foo");', types.isNamedForm));
      });

      it('needs the first argument to be a literal', () => {
        assert.ok(!check('define(["foobar"], ["a"], function(a){});', types.isNamedForm));
      });

      it('needs the second argument to be an array', () => {
        assert.ok(!check('define("foobar", 123, function(a){});', types.isNamedForm));
      });

      it('needs the third argument to be a function', () => {
        assert.ok(!check('define("foobar", ["foo"], 123);', types.isNamedForm));
        assert.ok(!check('define("reset", [0, 0], "modifier");', types.isNamedForm));
      });
    });

    describe('dependency form', () => {
      it('detects dependency form modules', () => {
        assert.ok(check('define(["a"], function(a){});', types.isDependencyForm));
      });

      it('needs the first argument to be an array', () => {
        assert.ok(!check('define(123, function(a){});', types.isDependencyForm));
      });

      it('needs the second argument to be a function', () => {
        assert.ok(!check('define(["a"], 123);', types.isDependencyForm));
      });

      it('needs 2 arguments', () => {
        assert.ok(!check('define(["a"], function(a){}, 123);', types.isDependencyForm));
      });
    });

    describe('factory form', () => {
      it('detects factory form modules', () => {
        assert.ok(check('define(function(require){});', types.isFactoryForm));
      });

      it('needs one argument', () => {
        assert.ok(!check('define(function(require){}, 123);', types.isFactoryForm));
      });

      it('needs the first argument to be a function', () => {
        assert.ok(!check('define(123);', types.isFactoryForm));
      });
    });

    it('detects REM form modules', () => {
      assert.ok(check('define(function(require, exports, module){});', types.isREMForm));
    });

    describe('no dependency form', () => {
      it('detects no dependency form modules', () => {
        assert.ok(check('define({});', types.isNoDependencyForm));
      });

      it('needs a aingle argument', () => {
        assert.ok(!check('define({}, 123);', types.isNoDependencyForm));
      });

      it('needs the first argument to be an object', () => {
        assert.ok(!check('define(function(){});', types.isNoDependencyForm));
      });
    });
  });

  describe('ES6', () => {
    it('detects es6 imports', () => {
      assert.ok(check('import {foo, bar} from "mylib";', types.isES6Import, true));
      assert.ok(check('import * as foo from "mod.js";', types.isES6Import, true));
      assert.ok(check('import "mylib2";', types.isES6Import, true));
      assert.ok(check('import foo from "mod.js";', types.isES6Import, true));
      assert.ok(check('import("foo");', types.isES6Import, true));
    });

    it('detects es6 exports', () => {
      assert.ok(check('export default 123;', types.isES6Export, true));
      assert.ok(check('export {foo, bar}; function foo() {} function bar() {}', types.isES6Export, true));
      assert.ok(check('export { D as default }; class D {}', types.isES6Export, true));
      assert.ok(check('export function inc() { counter++; }', types.isES6Export, true));
      assert.ok(check('export * from "mod";', types.isES6Export, true));
    });

    it('detects dynamic imports', () => {
      assert.ok(check('import("./bar");', types.isDynamicImport, true));
      assert.ok(check('function foo() { import("./bar"); }', types.isDynamicImport, true));
    });
  });
});
