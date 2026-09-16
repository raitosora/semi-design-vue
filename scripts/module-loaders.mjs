import ts from "typescript";

const isModuleName = (node) =>
  node &&
  ts.isStringLiteral(node) &&
  ["module", "node:module"].includes(node.text);
const unwrap = (node) =>
  ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node;

function collectBindings(ast, symbol) {
  const loaders = new Set();
  const factories = new Set();
  const namespaces = new Set();
  const declarations = [];
  function collect(node) {
    if (ts.isImportDeclaration(node) && isModuleName(node.moduleSpecifier)) {
      const clause = node.importClause;
      if (clause?.name) namespaces.add(symbol(clause.name));
      const bindings = clause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings))
        namespaces.add(symbol(bindings.name));
      if (bindings && ts.isNamedImports(bindings)) {
        for (const item of bindings.elements) {
          if ((item.propertyName ?? item.name).text === "createRequire")
            factories.add(symbol(item.name));
        }
      }
    }
    if (ts.isVariableDeclaration(node) && node.initializer)
      declarations.push(node);
    ts.forEachChild(node, collect);
  }
  collect(ast);
  return { loaders, factories, namespaces, declarations };
}

export function moduleLoaders(ast) {
  const options = { noLib: true, noResolve: true, allowJs: true };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram([ast.fileName], options, {
    ...host,
    getSourceFile: (file) => (file === ast.fileName ? ast : undefined),
  });
  const checker = program.getTypeChecker();
  const symbol = (node) => checker.getSymbolAtLocation(node);
  const global = (node, name) =>
    ts.isIdentifier(node) && node.text === name && !symbol(node);
  const { loaders, factories, namespaces, declarations } = collectBindings(
    ast,
    symbol,
  );
  const member = (node, property) =>
    ts.isPropertyAccessExpression(node) &&
    node.name.text === property &&
    namespace(node.expression);
  const factory = (node) =>
    (ts.isIdentifier(node) && factories.has(symbol(node))) ||
    member(node, "createRequire");
  const loader = (expression) => {
    const node = unwrap(expression);
    return (
      global(node, "require") ||
      (ts.isIdentifier(node) && loaders.has(symbol(node))) ||
      member(node, "require") ||
      (ts.isCallExpression(node) && factory(node.expression))
    );
  };
  const namespace = (expression) => {
    const node = unwrap(expression);
    if (ts.isAwaitExpression(node)) return namespace(node.expression);
    return (
      global(node, "module") ||
      (ts.isIdentifier(node) && namespaces.has(symbol(node))) ||
      (ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          loader(node.expression)) &&
        isModuleName(node.arguments[0]))
    );
  };
  const register = (name, value) => {
    if (ts.isIdentifier(name)) {
      if (loader(value)) loaders.add(symbol(name));
      if (factory(value)) factories.add(symbol(name));
      if (namespace(value)) namespaces.add(symbol(name));
    } else if (ts.isObjectBindingPattern(name) && namespace(value)) {
      for (const item of name.elements) {
        if (!ts.isIdentifier(item.name)) continue;
        const property = (item.propertyName ?? item.name).getText(ast);
        if (property === "createRequire") factories.add(symbol(item.name));
        if (property === "require") loaders.add(symbol(item.name));
      }
    }
  };
  // Resolve forward aliases as well as ordinary declaration order.
  let changed;
  do {
    const size = loaders.size + factories.size + namespaces.size;
    for (const { name, initializer } of declarations)
      register(name, unwrap(initializer));
    changed = size !== loaders.size + factories.size + namespaces.size;
  } while (changed);
  return loader;
}
