class AstModuleTypes {
  // Determines whether a node represents any AMD-style define() signature
  isDefineAMD(node) {
    if (!node) return false;

    // All AMD define forms are define() calls; return early before checking each form.
    if (!this.#isDefine(node)) return false;

    return this.isNamedForm(node) || this.isDependencyForm(node) ||
      this.isFactoryForm(node) || this.isNoDependencyForm(node) ||
      this.isREMForm(node);
  }

  // Determines whether a node represents any form of require() call
  isRequire(node) {
    return this.isPlainRequire(node) || this.isMainScopedRequire(node);
  }

  // Checks for a standard require(...) call
  isPlainRequire(node) {
    if (!node) return false;
    if (node.type !== 'CallExpression') return false;

    const c = node.callee;

    return c && c.type === 'Identifier' && c.name === 'require';
  }

  // Checks for require.main.require(...) usage
  isMainScopedRequire(node) {
    if (!node) return false;
    if (node.type !== 'CallExpression') return false;

    const c = node.callee;
    if (!c || c.type !== 'MemberExpression') return false;

    const obj = c.object;
    if (!obj || obj.type !== 'MemberExpression') return false;

    const base = obj.object;
    const prop = obj.property;
    if (!base || !prop) return false;

    if (base.type !== 'Identifier' || base.name !== 'require') return false;
    if (prop.type !== 'Identifier' || prop.name !== 'main') return false;

    return c.property.type === 'Identifier' && c.property.name === 'require';
  }

  // Checks whether the first expression in a Program is a require() call
  // Instead of trying to find the require then backtrack to the top,
  // just take the root and check its immediate child
  isTopLevelRequire(node) {
    if (node.type !== 'Program' || !node.body || node.body.length === 0 || !node.body[0].expression) {
      return false;
    }

    return this.isRequire(node.body[0].expression);
  }

  // Checks for AMD driver scripts: require([deps], callback)
  isAMDDriverScriptRequire(node) {
    if (!this.isRequire(node)) return false;

    const args = node.arguments;
    if (!args || args.length === 0) return false;

    const firstArg = args[0];

    return firstArg && firstArg.type === 'ArrayExpression';
  }

  // Determines whether a node assigns to module.exports or exports.*
  isExports(node) {
    if (!node || node.type !== 'AssignmentExpression') return false;

    // Only the left-hand side matters
    const leftNode = node.left;

    return this.#isModuleExportsAttach(leftNode) || this.#isModuleExportsAssign(leftNode) ||
      this.#isExportsAttach(leftNode) || this.#isExportsAssign(leftNode);
  }

  // Matches: define('name', [deps], factory)
  isNamedForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 3) return false;

    const [first, second, third] = args;
    const firstArgType = first.type;

    if (firstArgType !== 'Literal' && firstArgType !== 'StringLiteral') return false;

    return second.type === 'ArrayExpression' && this.#isFunctionLike(third);
  }

  // Matches: define([deps], factory)
  isDependencyForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 2) return false;

    return args[0].type === 'ArrayExpression' && this.#isFunctionLike(args[1]);
  }

  // Matches: define(function(require) { ... })
  isFactoryForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 1) return false;
    const firstArg = args[0];
    if (!this.#isFunctionLike(firstArg)) return false;

    const firstParamNode = firstArg.params && firstArg.params[0];
    if (!firstParamNode) return false;

    // Factory form requires the first parameter to be named "require"
    return firstParamNode.type === 'Identifier' && firstParamNode.name === 'require';
  }

  // Matches: define({ ... })
  isNoDependencyForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 1) return false;

    return args[0].type === 'ObjectExpression';
  }

  // Matches: define(function(require, exports, module) { ... })
  isREMForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length === 0) return false;

    const firstArg = args[0];
    if (!this.#isFunctionLike(firstArg)) return false;
    if (!firstArg.params || firstArg.params.length !== 3) return false;

    const [first, second, third] = firstArg.params;

    return first.type === 'Identifier' && first.name === 'require' &&
      second.type === 'Identifier' && second.name === 'exports' &&
      third.type === 'Identifier' && third.name === 'module';
  }

  // Checks for ES6 import syntax
  isES6Import(node) {
    const t = node.type;

    return t === 'Import' ||
      t === 'ImportDeclaration' ||
      t === 'ImportDefaultSpecifier' ||
      t === 'ImportNamespaceSpecifier';
  }

  // Checks for ES6 export syntax
  isES6Export(node) {
    const t = node.type;

    return t === 'ExportDeclaration' ||
      t === 'ExportNamedDeclaration' ||
      t === 'ExportSpecifier' ||
      t === 'ExportDefaultDeclaration' ||
      t === 'ExportAllDeclaration';
  }

  // Checks for dynamic import(...) expressions
  isDynamicImport(node) {
    const c = node.callee;
    return c && c.type === 'Import' && node.arguments.length > 0;
  }

  // Internal: checks for a generic define(...) call
  // Note: intentionally broad; used only as a helper for more specific checks
  #isDefine(node) {
    if (!node || node.type !== 'CallExpression') return false;

    const c = node.callee;
    return c && c.type === 'Identifier' && c.name === 'define';
  }

  #isExportsIdentifier(obj) {
    return obj && obj.type === 'Identifier' && obj.name === 'exports';
  }

  #isModuleIdentifier(obj) {
    return obj && obj.type === 'Identifier' && obj.name === 'module';
  }

  // Matches: module.exports.foo = ...
  #isModuleExportsAttach(node) {
    if (!node || node.type !== 'MemberExpression') return false;

    const obj = node.object;
    if (!obj || obj.type !== 'MemberExpression') return false;

    return this.#isModuleIdentifier(obj.object) && this.#isExportsIdentifier(obj.property);
  }

  // Matches: module.exports = ...
  #isModuleExportsAssign(node) {
    if (!node.object || !node.property) return false;
    if (node.type !== 'MemberExpression') return false;

    return this.#isModuleIdentifier(node.object) && this.#isExportsIdentifier(node.property);
  }

  // Matches: exports = ...
  #isExportsAssign(node) {
    return this.#isExportsIdentifier(node);
  }

  // Matches: exports.foo = ...
  #isExportsAttach(node) {
    if (!node) return false;
    return node.type === 'MemberExpression' && this.#isExportsIdentifier(node.object);
  }

  #isFunctionLike(node) {
    if (!node) return false;
    return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
  }
}

const moduleTypes = new AstModuleTypes();

export default moduleTypes;
