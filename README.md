# ast-module-types

[![CI](https://img.shields.io/github/actions/workflow/status/dependents/node-ast-module-types/ci.yml?branch=main&label=CI&logo=github)](https://github.com/dependents/node-ast-module-types/actions/workflows/ci.yml?query=branch%3Amain)
[![npm version](https://img.shields.io/npm/v/ast-module-types?logo=npm&logoColor=fff)](https://www.npmjs.com/package/ast-module-types)
[![npm downloads](https://img.shields.io/npm/dm/ast-module-types)](https://www.npmjs.com/package/ast-module-types)

A collection of useful helper functions when trying to determine module type (CommonJS or AMD) properties of an AST node.

**AST checks are based on the Esprima (Spidermonkey) format**

```sh
npm install ast-module-types
```

## Usage

```js
// ESM
import { isRequire } from 'ast-module-types';
// CommonJS
const { isRequire } = require('ast-module-types');
```

The functions take a single AST node and return a boolean. To get nodes, walk the AST with a tool like [`node-source-walk`](https://github.com/dependents/node-source-walk):

```js
import { isRequire } from 'ast-module-types';
import Walker from 'node-source-walk';

const walker = new Walker();

walker.walk('const x = require("lodash")', node => {
  if (isRequire(node)) {
    console.log('found require call');
  }
});
```

## API

Each function takes a single AST node and returns a boolean.

### CommonJS

* `isRequire(node)`: matches any `require()` call - plain or `require.main.require()`
* `isPlainRequire(node)`: matches a bare `require()` call
* `isMainScopedRequire(node)`: matches `require.main.require()`
* `isTopLevelRequire(node)`: takes a `Program` node; returns true when the first expression is a `require()` call
* `isAMDDriverScriptRequire(node)`: matches the AMD driver script form `require([deps], callback)`
* `isExports(node)`: matches `module.exports` or `exports` assignments

### AMD define forms

* `isDefineAMD(node)`: matches any valid AMD `define()` call
* `isNamedForm(node)`: `define('name', [deps], factory)`
* `isDependencyForm(node)`: `define([deps], factory)`
* `isFactoryForm(node)`: `define(function(require) { ... })`
* `isNoDependencyForm(node)`: `define({})`
* `isREMForm(node)`: `define(function(require, exports, module) { ... })`

### ES modules

*All types follow the [ESTree spec](https://github.com/estree/estree/blob/master/es2015.md)*

* `isES6Import(node)`: matches any ES module import form
* `isES6Export(node)`: matches any ES module export form
* `isDynamicImport(node)`: matches dynamic `import()` calls

## License

[MIT](LICENSE)
