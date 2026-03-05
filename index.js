'use strict';

class AstModuleTypes {
  // Whether or not the node represents any of the AMD define() forms
  isDefineAMD(node) {
    if (!node) return false;

    return this.isNamedForm(node) || this.isDependencyForm(node) ||
      this.isFactoryForm(node) || this.isNoDependencyForm(node) ||
      this.isREMForm(node);
  }

  // Whether or not the node represents a require function call
  isRequire(node) {
    return this.isPlainRequire(node) || this.isMainScopedRequire(node);
  }

  // Whether or not the node represents a plain require function call [require(...)]
  isPlainRequire(node) {
    if (!node) return false;
    if (node.type !== 'CallExpression') return false;

    const c = node.callee;

    return c && c.type === 'Identifier' && c.name === 'require';
  }

  // Whether or not the node represents main-scoped require function call [require.main.require(...)]
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

  // Whether or not the node represents a require at the top of the module
  // Instead of trying to find the require then backtrack to the top,
  // just take the root and check its immediate child
  isTopLevelRequire(node) {
    if (node.type !== 'Program' || !node.body || node.body.length === 0 || !node.body[0].expression) {
      return false;
    }

    return this.isRequire(node.body[0].expression);
  }

  // Whether or not the node represents an AMD-style driver script's require
  // Example: require(deps, function)
  isAMDDriverScriptRequire(node) {
    if (!this.isRequire(node)) return false;

    const args = node.arguments;
    if (!args || args.length === 0) return false;

    const firstArg = args[0];

    return firstArg && firstArg.type === 'ArrayExpression';
  }

  // Whether or not the node represents the use of
  // assigning (and possibly attaching) something to module.exports or exports
  isExports(node) {
    if (!node || node.type !== 'AssignmentExpression') return false;

    // Only the left side matters
    const leftNode = node.left;

    return this.#isModuleExportsAttach(leftNode) || this.#isModuleExportsAssign(leftNode) ||
      this.#isExportsAttach(leftNode) || this.#isExportsAssign(leftNode);
  }

  // define('name', [deps], func)
  isNamedForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 3) return false;

    const [first, second, third] = args;
    const firstArgType = first.type;

    if (firstArgType !== 'Literal' && firstArgType !== 'StringLiteral') return false;

    return second.type === 'ArrayExpression' && this.#isFunctionLike(third);
  }

  // define([deps], func)
  isDependencyForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 2) return false;

    return args[0].type === 'ArrayExpression' && this.#isFunctionLike(args[1]);
  }

  // define(func(require))
  isFactoryForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 1) return false;

    const firstArg = args[0];
    if (!this.#isFunctionLike(firstArg)) return false;

    const firstParamNode = firstArg.params && firstArg.params[0];
    if (!firstParamNode) return false;

    // Node should have a function whose first param is 'require'
    return firstParamNode.type === 'Identifier' && firstParamNode.name === 'require';
  }

  // define({})
  isNoDependencyForm(node) {
    if (!this.#isDefine(node)) return false;

    const args = node.arguments;
    if (!args || args.length !== 1) return false;

    return args[0].type === 'ObjectExpression';
  }

  // define(function(require, exports, module)
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

  isES6Import(node) {
    const t = node.type;

    return t === 'Import' ||
      t === 'ImportDeclaration' ||
      t === 'ImportDefaultSpecifier' ||
      t === 'ImportNamespaceSpecifier';
  }

  isES6Export(node) {
    const t = node.type;

    return t === 'ExportDeclaration' ||
      t === 'ExportNamedDeclaration' ||
      t === 'ExportSpecifier' ||
      t === 'ExportDefaultDeclaration' ||
      t === 'ExportAllDeclaration';
  }

  isDynamicImport(node) {
    const c = node.callee;
    return c && c.type === 'Import' && node.arguments.length > 0;
  }

  // Whether or not the node represents a generic define() call
  // Note: this should not be used as it will have false positives.
  // It is mostly used to guide sniffs for other methods.
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

  // module.exports.foo
  #isModuleExportsAttach(node) {
    if (!node || node.type !== 'MemberExpression') return false;

    const obj = node.object;
    if (!obj || obj.type !== 'MemberExpression') return false;

    return this.#isModuleIdentifier(obj.object) && this.#isExportsIdentifier(obj.property);
  }

  // module.exports
  #isModuleExportsAssign(node) {
    if (!node.object || !node.property) return false;
    if (node.type !== 'MemberExpression') return false;

    return this.#isModuleIdentifier(node.object) && this.#isExportsIdentifier(node.property);
  }

  // exports
  #isExportsAssign(node) {
    return this.#isExportsIdentifier(node);
  }

  // exports.foo
  #isExportsAttach(node) {
    if (!node) return false;
    return node.type === 'MemberExpression' && this.#isExportsIdentifier(node.object);
  }

  #isFunctionLike(node) {
    if (!node) return false;
    return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
  }
}

module.exports = new AstModuleTypes();
