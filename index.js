'use strict';

class AstModuleTypes {
  // Deprecated
  // Whether or not the node represents a generic define() call
  // Note: this should not be used as it will have false positives.
  // It is mostly used to guide sniffs for other methods and will be made private eventually.
  isDefine(node) {
    if (!node) return false;

    const c = node.callee;

    return c &&
           node.type === 'CallExpression' &&
           c.type === 'Identifier' &&
           c.name === 'define';
  }

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

    const c = node.callee;

    return c &&
      node.type === 'CallExpression' &&
      c.type === 'Identifier' &&
      c.name === 'require';
  }

  // Whether or not the node represents main-scoped require function call [require.main.require(...)]
  isMainScopedRequire(node) {
    if (!node) return false;

    const c = node.callee;

    return c &&
      node.type === 'CallExpression' &&
      c.type === 'MemberExpression' &&
      c.object.type === 'MemberExpression' &&
      c.object.object.type === 'Identifier' &&
      c.object.object.name === 'require' &&
      c.object.property.type === 'Identifier' &&
      c.object.property.name === 'main' &&
      c.property.type === 'Identifier' &&
      c.property.name === 'require';
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
    return this.isRequire(node) &&
      node.arguments &&
      node.arguments[0] && node.arguments[0].type &&
      node.arguments[0].type === 'ArrayExpression';
  }

  // Whether or not the node represents the use of
  // assigning (and possibly attaching) something to module.exports or exports
  isExports(node) {
    if (node.type !== 'AssignmentExpression') return;

    // Only the left side matters
    const leftNode = node.left;

    return this.#isModuleExportsAttach(leftNode) || this.#isModuleExportsAssign(leftNode) ||
      this.#isExportsAttach(leftNode) || this.#isExportsAssign(leftNode);
  }

  // define('name', [deps], func)
  isNamedForm(node) {
    if (!this.isDefine(node)) return false;

    const args = node.arguments;

    return args && args.length === 3 &&
           (args[0].type === 'Literal' || args[0].type === 'StringLiteral') &&
           args[1].type === 'ArrayExpression' &&
           this.#isFunctionLike(args[2]);
  }

  // define([deps], func)
  isDependencyForm(node) {
    if (!this.isDefine(node)) return false;

    const args = node.arguments;

    return args && args.length === 2 &&
           args[0].type === 'ArrayExpression' &&
           this.#isFunctionLike(args[1]);
  }

  // define(func(require))
  isFactoryForm(node) {
    if (!this.isDefine(node)) return false;

    const args = node.arguments;
    const firstParamNode = args.length > 0 && args[0].params ? args[0].params[0] : null;

    // Node should have a function whose first param is 'require'
    return args && args.length === 1 &&
           this.#isFunctionLike(args[0]) &&
           firstParamNode && firstParamNode.type === 'Identifier' &&
           firstParamNode.name === 'require';
  }

  // define({})
  isNoDependencyForm(node) {
    if (!this.isDefine(node)) return false;

    const args = node.arguments;

    return args && args.length === 1 && args[0].type === 'ObjectExpression';
  }

  // define(function(require, exports, module)
  isREMForm(node) {
    if (!this.isDefine(node)) return false;

    const args = node.arguments;
    const params = args.length > 0 ? args[0].params : null;

    if (!args || args.length === 0 || !this.#isFunctionLike(args[0]) || params.length !== 3) {
      return false;
    }

    const [first, second, third] = params;

    return first.type === 'Identifier' && first.name === 'require' &&
           second.type === 'Identifier' && second.name === 'exports' &&
           third.type === 'Identifier' && third.name === 'module';
  }

  isES6Import(node) {
    switch (node.type) {
      case 'Import':
      case 'ImportDeclaration':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier': {
        return true;
      }

      default: {
        return false;
      }
    }
  }

  isES6Export(node) {
    switch (node.type) {
      case 'ExportDeclaration':
      case 'ExportNamedDeclaration':
      case 'ExportSpecifier':
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration': {
        return true;
      }

      default: {
        return false;
      }
    }
  }

  isDynamicImport(node) {
    return node.callee && node.callee.type === 'Import' && node.arguments.length > 0;
  }

  #isExportsIdentifier(obj) {
    return obj.type && obj.type === 'Identifier' && obj.name === 'exports';
  }

  #isModuleIdentifier(obj) {
    return obj.type && obj.type === 'Identifier' && obj.name === 'module';
  }

  // module.exports.foo
  #isModuleExportsAttach(node) {
    if (!node.object || !node.object.object || !node.object.property) return false;

    return node.type === 'MemberExpression' &&
           this.#isModuleIdentifier(node.object.object) &&
           this.#isExportsIdentifier(node.object.property);
  }

  // module.exports
  #isModuleExportsAssign(node) {
    if (!node.object || !node.property) return false;

    return node.type === 'MemberExpression' &&
           this.#isModuleIdentifier(node.object) &&
           this.#isExportsIdentifier(node.property);
  }

  // exports
  #isExportsAssign(node) {
    return this.#isExportsIdentifier(node);
  }

  // exports.foo
  #isExportsAttach(node) {
    return node.type === 'MemberExpression' && this.#isExportsIdentifier(node.object);
  }

  #isFunctionLike(node) {
    if (!node) return false;

    return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
  }
}

module.exports = new AstModuleTypes();
