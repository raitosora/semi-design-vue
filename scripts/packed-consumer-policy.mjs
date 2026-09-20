import { isAbsolute, relative } from "node:path";

const contains = (parent, child) => {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
};

export function assertConsumerLocation(root, directory) {
  if (contains(root, directory) || contains(directory, root))
    throw new Error(
      "Packed consumer must be outside the repository and its ancestors",
    );
}

export function assertExactDependencies(dependencies) {
  for (const [name, version] of Object.entries(dependencies)) {
    if (
      !/^(?:@[^/]+\/)?[^/@\s]+$/.test(name) ||
      !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)
    )
      throw new Error(`Consumer dependency requires an exact version: ${name}`);
  }
}

export function cleanConsumerEnvironment(environment) {
  return Object.fromEntries(
    Object.entries(environment).filter(
      ([key]) =>
        !/^(?:npm_|pnpm_|corepack_|node_path$|node_options$|node_env$)/i.test(
          key,
        ),
    ),
  );
}

export function assertPackFiles(files) {
  for (const required of [
    "package/package.json",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts",
  ])
    if (!files.includes(required))
      throw new Error(`Missing required packed file: ${required}`);
  if (new Set(files).size !== files.length)
    throw new Error("Duplicate packed member");
  for (const path of files) {
    const debugSnapshot =
      /^package\/dist\/map-sources\/[a-f0-9]{64}\.(?:ts|tsx)$/.test(path);
    if (
      path.includes("\\") ||
      path
        .split("/")
        .some((part) =>
          /^(?:g\d{2}-(?:probes?|review|report)|(?:experiment|local)-(?:record|review))(?:[-.]|$)/i.test(
            part,
          ),
        ) ||
      !(
        /^package\/(?:package\.json|LICENSE)$/.test(path) ||
        /^package\/dist\/(?!map-sources\/)[^\s]+(?:\.js(?:\.map)?|\.d\.ts(?:\.map)?|\.css|\.scss)$/.test(
          path,
        ) ||
        /^package\/dist\/(?:build-meta|compiler-provenance|sources|resources\/provenance|locale\/provenance|styles\/sources)\.json$/.test(
          path,
        ) ||
        /^package\/dist\/(?:(?:resources|styles)\/)?licenses\/[^/]+\.txt$/.test(
          path,
        ) ||
        debugSnapshot
      ) ||
      path
        .split("/")
        .some(
          (part) =>
            part === ".." ||
            part.startsWith(".") ||
            ["docs", "experiments", "node_modules"].includes(part),
        ) ||
      (!debugSnapshot && /\.(?:tsx|jsx)$/.test(path)) ||
      (!debugSnapshot && /\.ts$/.test(path) && !/\.d\.ts$/.test(path))
    )
      throw new Error(`Unexpected packed file: ${path}`);
  }
}

export function isForbiddenProduction(name) {
  return /^(?:react(?:-dom)?|@types\/react(?:-dom)?|lodash(?:-es|\.[^/]+)?|@types\/lodash(?:-es|\.[^/]+)?|@douyinfe\/semi-(?:ui|foundation))(?:\/|$)/.test(
    name,
  );
}

export function assertProductionTree(tree) {
  if (!tree.dependencies || Object.keys(tree.dependencies).length === 0)
    throw new Error("Production dependency evidence is empty");
  function visit(node, key) {
    // npm ls represents absent optional peers as empty objects, without a problem.
    if (Object.keys(node).length === 0) return 0;
    if (
      isForbiddenProduction(key) ||
      isForbiddenProduction(node.name ?? key) ||
      node.missing ||
      node.invalid ||
      node.problems?.length ||
      !node.version
    )
      throw new Error(`Invalid or forbidden production dependency: ${key}`);
    return (
      1 +
      Object.entries(node.dependencies ?? {}).reduce(
        (count, [name, dependency]) => count + visit(dependency, name),
        0,
      )
    );
  }
  if (tree.problems?.length)
    throw new Error(`Invalid production tree: ${tree.problems.join(", ")}`);
  const installedCount = Object.entries(tree.dependencies).reduce(
    (count, [name, node]) => count + visit(node, name),
    0,
  );
  if (installedCount === 0)
    throw new Error("Production dependency evidence is empty");
}

export function assertPackedContent(source, file) {
  if (
    /(?:\/Users\/[^/]+\/|\/home\/[^/]+\/|[A-Z]:\\Users\\|docs\/(?:tasks|experiments)\/|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:AKIA|ASIA)[A-Z0-9]{16})/.test(
      source,
    )
  )
    throw new Error(
      `Private path, record or credential in packed content: ${file}`,
    );
}

export function assertLockedFamily(name, version) {
  const vue =
    name === "vue" ||
    /^@vue\/(?:compiler-(?:core|dom|sfc|ssr|vapor)|reactivity|runtime-(?:core|dom|vapor)|server-renderer|shared)$/.test(
      name,
    );
  const jsx = name === "vue-jsx" || name.startsWith("@vue-jsx/");
  const expected = vue ? "3.6.0-rc.9" : jsx ? "3.3.0-rc.2" : undefined;
  if (expected && version !== expected)
    throw new Error(
      `Installed family version drift: ${name}@${version}; expected ${expected}`,
    );
}
