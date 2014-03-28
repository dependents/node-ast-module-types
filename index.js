// Whether or not the node represents an AMD define() call
module.exports.isDefine = function (node) {
  var c = node.callee;

  return c &&
    node.type === 'CallExpression' &&
    c.type    === 'Identifier' &&
    c.name    === 'define';
};

// Whether or not the node represents a require function call
module.exports.isRequire = function (node) {
  var c = node.callee;

  return c &&
        node.type  === 'CallExpression' &&
        c.type     === 'Identifier' &&
        c.name     === 'require';
};

// Whether or not the node represents the use of
// assigning something to module.exports or exports
module.exports.isExports = function (node) {
  var c = node.object;
  return c &&
    node.type === 'MemberExpression' &&
    c.type    === 'Identifier' &&
    (c.name   === 'module' || c.name === 'exports');
};

// define('name', [deps], func)
module.exports.isNamedForm = function (node) {
  var args = node['arguments'];

  // TODO: Should we also make sure the second element is an array?
  return args && args[0].type === 'Literal';
};

// define([deps], func)
module.exports.isDependencyForm = function (node) {
  var args = node['arguments'];

  return args && args[0].type === 'ArrayExpression';
};

// define(func(require))
module.exports.isFactoryForm = function (node) {
  var args = node['arguments'],
      firstParamNode = args.length && args[0].params ? args[0].params[0] : null;

  // Node should have a function whose first param is 'require'
  return args && args[0].type === 'FunctionExpression' &&
        firstParamNode && firstParamNode.type === 'Identifier' && firstParamNode.name === 'require';
};

// define({})
module.exports.isNoDependencyForm = function (node) {
  var args = node['arguments'];

  return args && args[0].type === 'ObjectExpression';
};