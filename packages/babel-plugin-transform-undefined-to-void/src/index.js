"use strict";

module.exports = function({ types: t }) {
  const VOID_0 = t.unaryExpression("void", t.numericLiteral(0), true);

  return {
    name: "transform-undefined-to-void",
    visitor: {
      ReferencedIdentifier(path) {
        if (path.node.name === "undefined") {
          path.replaceWith(VOID_0);
        }
      },

      VariableDeclarator(path) {
        const { node } = path;
        if (node.init && node.init.name === "undefined") {
          path.replaceWith(t.variableDeclarator(node.id, VOID_0));
        }
      },
    },
  };
};
