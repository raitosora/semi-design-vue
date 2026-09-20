import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import {
  delimiter,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import {
  assertConsumerLocation,
  assertExactDependencies,
  assertPackFiles,
  assertPackedContent,
  assertLockedFamily,
  assertProductionTree,
  cleanConsumerEnvironment,
  isForbiddenProduction,
} from "./packed-consumer-policy.mjs";
import { verifyPackageMaps } from "./finalize-package.mjs";
import { validatePackageDirectory } from "./package-contracts.mjs";
import { startPackedRegistry } from "./packed-consumer-registry.mjs";

const folders = [
  "semi-animation-vue",
  "semi-icons-vue",
  "semi-icons-lab-vue",
  "semi-illustrations-vue",
  "semi-ui-vue",
  "vite-plugin-semi-theme",
];
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

export function runConsumerCommand(
  command,
  args,
  { cwd, env, signal, allowedExitCodes = [0] },
) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      signal,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-32_768);
    });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (allowedExitCodes.includes(code)) resolveCommand(stdout);
      else
        reject(
          new Error(
            `${command} ${args[0]} failed (${signal ?? code}): ${stderr}\n${stdout.slice(-4096)}`,
          ),
        );
    });
  });
}

async function inspectTarball(path, folder, options) {
  const files = (await runConsumerCommand("tar", ["-tzf", path], options))
    .trim()
    .split("\n")
    .filter((file) => !file.endsWith("/"));
  assertPackFiles(files);
  const detailed = (await runConsumerCommand("tar", ["-tvzf", path], options))
    .trim()
    .split("\n");
  if (detailed.some((line) => !line.startsWith("-")))
    throw new Error(`Nonregular packed member: ${folder}`);
  const extracted = `${path}.inspection`;
  mkdirSync(extracted);
  await runConsumerCommand("tar", ["-xzf", path, "-C", extracted], options);
  for (const file of files)
    assertPackedContent(readFileSync(join(extracted, file), "utf8"), file);
  const contract = validatePackageDirectory(join(extracted, "package"));
  const maps = folders.includes(folder)
    ? await verifyPackageMaps({
        root: options.root,
        packageDirectory: join(extracted, "package"),
      })
    : undefined;
  const manifest = JSON.parse(
    await runConsumerCommand(
      "tar",
      ["-xOzf", path, "package/package.json"],
      options,
    ),
  );
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
  ])
    for (const [name, version] of Object.entries(manifest[field] ?? {}))
      if (
        isForbiddenProduction(name) ||
        /^(?:workspace:|file:|link:|npm:)/.test(version)
      )
        throw new Error(
          `Unpublishable packed dependency: ${manifest.name} ${name} ${version}`,
        );
  const bytes = readFileSync(path);
  return {
    folder,
    contract,
    maps,
    path,
    archiveName: path.split(/[\\/]/).at(-1),
    manifest,
    files: files.sort(),
    memberHashes: Object.fromEntries(
      files.map((file) => [
        file,
        createHash("sha256")
          .update(readFileSync(join(extracted, file)))
          .digest("hex"),
      ]),
    ),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
  };
}

async function packPackages(root, directory, additionalTarballs, env) {
  const packed = [];
  for (const folder of folders) {
    const target = join(directory, ".packed", folder);
    mkdirSync(target, { recursive: true });
    await runConsumerCommand("pnpm", ["pack", "--pack-destination", target], {
      cwd: join(root, "packages", folder),
      env,
    });
    const archives = readdirSync(target).filter((file) =>
      file.endsWith(".tgz"),
    );
    if (archives.length !== 1)
      throw new Error(`Expected one packed archive: ${folder}`);
    packed.push(
      await inspectTarball(join(target, archives[0]), folder, {
        cwd: directory,
        env,
        root,
      }),
    );
  }
  for (const [name, source] of Object.entries(additionalTarballs)) {
    const target = join(directory, ".packed", `fixture-${packed.length}.tgz`);
    copyFileSync(source, target);
    const pack = await inspectTarball(target, name, { cwd: directory, env });
    if (
      pack.manifest.name !== name ||
      packed.some((item) => item.manifest.name === name)
    )
      throw new Error(`Duplicate or mismatched fixture package: ${name}`);
    packed.push(pack);
  }
  return packed;
}

function assertInstalledPaths(directory) {
  const visited = new Set();
  const packagePaths = [];
  function visit(path) {
    const real = realpathSync(path);
    const local = relative(directory, real);
    if (local.startsWith("..") || isAbsolute(local))
      throw new Error(`Installed path escapes isolated consumer: ${local}`);
    if (visited.has(real)) return;
    visited.add(real);
    const stat = lstatSync(real);
    if (stat.isDirectory()) {
      if (existsSync(join(real, "package.json"))) {
        const manifest = json(join(real, "package.json"));
        assertLockedFamily(manifest.name ?? "", manifest.version);
        packagePaths.push(relative(directory, real));
      }
      for (const entry of readdirSync(real)) visit(join(real, entry));
    }
  }
  visit(join(directory, "node_modules"));
  if (!packagePaths.length)
    throw new Error("No installed package realpaths were checked");
  return packagePaths.sort();
}

function sanitizeEvidence(value, directory, root, origin) {
  return JSON.parse(
    JSON.stringify(value)
      .replaceAll(directory, "<consumer>")
      .replaceAll(root, "<repository>")
      .replaceAll(origin, "<packed-registry>"),
  );
}

function prepareDirectory(root, directory, label) {
  if (!/^[a-z0-9-]+$/.test(label))
    throw new Error(
      "Consumer evidence label must be lowercase letters, numbers and hyphens",
    );
  mkdirSync(directory, { recursive: true });
  const real = realpathSync(directory);
  assertConsumerLocation(realpathSync(root), real);
  for (const file of [
    "package.json",
    "node_modules",
    ".npmrc",
    ".pnpmfile.cjs",
    "pnpm-workspace.yaml",
    "package-lock.json",
    ".packed",
  ])
    if (existsSync(join(real, file)))
      throw new Error(`Consumer directory must be clean: ${file}`);
  // npm walks parent directories for project configuration. Reject inherited
  // package-manager configuration rather than overriding a hidden repair.
  for (
    let parent = dirname(real);
    dirname(parent) !== parent;
    parent = dirname(parent)
  )
    for (const file of [".npmrc", ".pnpmfile.cjs", "pnpm-workspace.yaml"])
      if (existsSync(join(parent, file)))
        throw new Error(
          `Consumer ancestor contains package-manager configuration: ${file}`,
        );
  return real;
}

export async function installPackedConsumer({
  root,
  directory,
  packages,
  dependencies = {},
  devDependencies = {},
  label,
  additionalTarballs = {},
  signal,
}) {
  directory = prepareDirectory(root, directory, label);
  assertExactDependencies(dependencies);
  assertExactDependencies(devDependencies);
  if (!packages?.length || new Set(packages).size !== packages.length)
    throw new Error("Consumer package roots must be nonempty and unique");
  mkdirSync(join(directory, ".packed"));
  const userconfig = join(directory, ".packed", "user.npmrc");
  const globalconfig = join(directory, ".packed", "global.npmrc");
  writeFileSync(userconfig, "");
  writeFileSync(globalconfig, "");
  const inherited = cleanConsumerEnvironment(process.env);
  const env = {
    ...inherited,
    PATH: (inherited.PATH ?? "")
      .split(delimiter)
      .filter((path) => {
        if (!isAbsolute(path)) return false;
        const fromRoot = relative(realpathSync(root), path);
        return fromRoot.startsWith("..") || isAbsolute(fromRoot);
      })
      .join(delimiter),
    npm_config_userconfig: userconfig,
    npm_config_globalconfig: globalconfig,
    npm_config_cache: join(directory, ".packed", "npm-cache"),
  };
  const packed = await packPackages(root, directory, additionalTarballs, env);
  const selected = packages.map((name) => {
    const pack = packed.find(
      (item) => item.folder === name || item.manifest.name === name,
    );
    if (!pack) throw new Error(`Unknown packed consumer root: ${name}`);
    if (dependencies[pack.manifest.name] || devDependencies[pack.manifest.name])
      throw new Error(`Duplicate consumer dependency: ${name}`);
    return pack;
  });
  const registry = await startPackedRegistry(packed);
  const evidenceDirectory = resolve(
    root,
    ".vitest",
    "attachments",
    "package-consumers",
    label,
  );
  try {
    writeJson(join(directory, "package.json"), {
      name: `semi-${label}-consumer`,
      version: "0.0.0",
      private: true,
      type: "module",
      dependencies: {
        ...dependencies,
        ...Object.fromEntries(
          selected.map((pack) => [
            pack.manifest.name,
            `file:${relative(directory, pack.path)}`,
          ]),
        ),
      },
      devDependencies,
    });
    await runConsumerCommand(
      "npm",
      [
        "install",
        "--include=dev",
        "--registry",
        registry.origin,
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--strict-peer-deps",
      ],
      { cwd: directory, env, signal },
    );
    const productionTree = JSON.parse(
      await runConsumerCommand(
        "npm",
        ["ls", "--omit=dev", "--all", "--json", "--long"],
        { cwd: directory, env },
      ),
    );
    assertProductionTree(productionTree);
    const installedPackagePaths = assertInstalledPaths(directory);
    mkdirSync(evidenceDirectory, { recursive: true });
    const clean = (value) =>
      sanitizeEvidence(value, directory, root, registry.origin);
    const packageEvidence = packed.map(
      ({ manifest, files, memberHashes, integrity, contract, maps }) => ({
        name: manifest.name,
        version: manifest.version,
        manifest,
        files,
        memberHashes,
        integrity,
        contract,
        maps,
      }),
    );
    writeJson(join(evidenceDirectory, "pack-files.json"), packageEvidence);
    writeJson(
      join(evidenceDirectory, "production-tree.json"),
      clean(productionTree),
    );
    writeJson(
      join(evidenceDirectory, "install-summary.json"),
      clean({
        roots: selected.map(({ manifest }) => manifest.name),
        dependencies,
        devDependencies,
        registryRequests: registry.requests,
        installedPackagePaths,
        node: process.version,
        installScripts: false,
        repositoryLinks: false,
      }),
    );
    const audit = JSON.parse(
      await runConsumerCommand(
        "npm",
        [
          "audit",
          "--omit=dev",
          "--audit-level=moderate",
          "--registry",
          "https://registry.npmjs.org",
          "--json",
        ],
        { cwd: directory, env, signal, allowedExitCodes: [0, 1] },
      ),
    );
    writeJson(join(evidenceDirectory, "production-audit.json"), clean(audit));
    const vulnerabilities = audit.metadata?.vulnerabilities;
    if (
      !vulnerabilities ||
      audit.error ||
      ["moderate", "high", "critical"].some(
        (level) => vulnerabilities[level] > 0,
      )
    )
      throw new Error(
        "Isolated production dependency audit failed; inspect production-audit.json",
      );
    writeJson(
      join(evidenceDirectory, "package-lock.json"),
      clean(json(join(directory, "package-lock.json"))),
    );
    return {
      directory,
      env,
      packages: packageEvidence,
      productionTree,
      evidenceDirectory,
    };
  } finally {
    await registry.close();
  }
}
