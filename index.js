'use strict';

// Deprecated
// Whether or not the node represents a generic define() call
// Note: this should not be used as it will have false positives.
// It is mostly used to guide sniffs for other methods and will be made private eventually.
module.exports.isDefine = function(node) {
  if (!node) return false;

  const c = node.callee;

  return c &&
    node.type === 'CallExpression' &&
    c.type === 'Identifier' &&
    c.name === 'define';
};

// Whether or not the node represents any of the AMD define() forms
module.exports.isDefineAMD = function(node) {
  if (!node) return false;

  const e = module.exports;

  return e.isNamedForm(node) || e.isDependencyForm(node) ||
    e.isFactoryForm(node) || e.isNoDependencyForm(node) ||
    e.isREMForm(node);
};

// Whether or not the node represents a require function call
module.exports.isRequire = function(node) {
  return this.isPlainRequire(node) || this.isMainScopedRequire(node);
};

// Whether or not the node represents a plain require function call [require(...)]
module.exports.isPlainRequire = function(node) {
  if (!node) return false;
  if (node.type !== 'CallExpression') return false;

  const c = node.callee;

  return c && c.type === 'Identifier' && c.name === 'require';
};

// Whether or not the node represents main-scoped require function call [require.main.require(...)]
module.exports.isMainScopedRequire = function(node) {
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
};

// Whether or not the node represents a require at the top of the module
// Instead of trying to find the require then backtrack to the top,
// just take the root and check its immediate child
module.exports.isTopLevelRequire = function(node) {
  if (node.type !== 'Program' || !node.body ||
    node.body.length === 0 || !node.body[0].expression) {
    return false;
  }

  return this.isRequire(node.body[0].expression);
};

// Whether or not the node represents an AMD-style driver script's require
// Example: require(deps, function)
module.exports.isAMDDriverScriptRequire = function(node) {
  if (!this.isRequire(node)) return false;

  const args = node.arguments;
  if (!args || args.length === 0) return false;

  const firstArg = args[0];

  return firstArg && firstArg.type === 'ArrayExpression';
};

function isExportsIdentifier(obj) {
  return obj && obj.type === 'Identifier' && obj.name === 'exports';
}

function isModuleIdentifier(obj) {
  return obj && obj.type === 'Identifier' && obj.name === 'module';
}

function isFunctionLike(node) {
  if (!node) return false;
  return node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
}

// module.exports.foo
function isModuleExportsAttach(node) {
  if (!node || node.type !== 'MemberExpression') return false;

  const obj = node.object;
  if (!obj || obj.type !== 'MemberExpression') return false;

  return isModuleIdentifier(obj.object) && isExportsIdentifier(obj.property);
}

// module.exports
function isModuleExportsAssign(node) {
  if (!node.object || !node.property) return false;
  if (node.type !== 'MemberExpression') return false;

  return isModuleIdentifier(node.object) && isExportsIdentifier(node.property);
}

// exports
function isExportsAssign(node) {
  return isExportsIdentifier(node);
}

// exports.foo
function isExportsAttach(node) {
  if (!node) return false;
  return node.type === 'MemberExpression' && isExportsIdentifier(node.object);
}

// Whether or not the node represents the use of
// assigning (and possibly attaching) something to module.exports or exports
module.exports.isExports = function(node) {
  if (!node || node.type !== 'AssignmentExpression') return false;

  // Only the left side matters
  const leftNode = node.left;

  return isModuleExportsAttach(leftNode) || isModuleExportsAssign(leftNode) ||
    isExportsAttach(leftNode) || isExportsAssign(leftNode);
};

// define('name', [deps], func)
module.exports.isNamedForm = function(node) {
  if (!this.isDefine(node)) return false;

  const args = node.arguments;
  if (!args || args.length !== 3) return false;

  const [first, second, third] = args;
  const firstArgType = first.type;

  if (firstArgType !== 'Literal' && firstArgType !== 'StringLiteral') return false;

  return second.type === 'ArrayExpression' && isFunctionLike(third);
};

// define([deps], func)
module.exports.isDependencyForm = function(node) {
  if (!this.isDefine(node)) return false;

  const args = node.arguments;
  if (!args || args.length !== 2) return false;

  return args[0].type === 'ArrayExpression' && isFunctionLike(args[1]);
};

// define(func(require))
module.exports.isFactoryForm = function(node) {
  if (!this.isDefine(node)) return false;

  const args = node.arguments;
  if (!args || args.length !== 1) return false;

  const firstArg = args[0];
  if (!isFunctionLike(firstArg)) return false;

  const firstParamNode = firstArg.params && firstArg.params[0];
  if (!firstParamNode) return false;

  // Node should have a function whose first param is 'require'
  return firstParamNode.type === 'Identifier' && firstParamNode.name === 'require';
};

// define({})
module.exports.isNoDependencyForm = function(node) {
  if (!this.isDefine(node)) return false;

  const args = node.arguments;
  if (!args || args.length !== 1) return false;

  return args[0].type === 'ObjectExpression';
};

// define(function(require, exports, module)
module.exports.isREMForm = function(node) {
  if (!this.isDefine(node)) return false;

  const args = node.arguments;
  if (!args || args.length === 0) return false;

  const firstArg = args[0];
  if (!isFunctionLike(firstArg)) return false;
  if (!firstArg.params || firstArg.params.length !== 3) return false;

  const [first, second, third] = firstArg.params;

  return first.type === 'Identifier' && first.name === 'require' &&
    second.type === 'Identifier' && second.name === 'exports' &&
    third.type === 'Identifier' && third.name === 'module';
};

module.exports.isES6Import = function(node) {
  const t = node.type;

  return t === 'Import' ||
    t === 'ImportDeclaration' ||
    t === 'ImportDefaultSpecifier' ||
    t === 'ImportNamespaceSpecifier';
};

module.exports.isES6Export = function(node) {
  const t = node.type;

  return t === 'ExportDeclaration' ||
    t === 'ExportNamedDeclaration' ||
    t === 'ExportSpecifier' ||
    t === 'ExportDefaultDeclaration' ||
    t === 'ExportAllDeclaration';
};

module.exports.isDynamicImport = function(node) {
  const c = node.callee;
  return c && c.type === 'Import' && node.arguments.length > 0;
};
