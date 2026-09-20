import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const compilerLicense = "vue-jsx-3.3.0-rc.2-MIT.txt";
const compilerVersion = "3.3.0-rc.2";
const helperPattern = /(?:^|\/)vue-jsx\/(props|vapor)$/;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const isWithin = (parent, candidate) => {
  const path = relative(parent, candidate);
  return (
    path &&
    !path.startsWith(`..${sep}`) &&
    path !== ".." &&
    !path.startsWith(sep)
  );
};
const toPosix = (value) => value.replaceAll("\\", "/");

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? files(path) : entry.isFile() ? [path] : [];
    }),
  );
  return nested.flat();
}

function sourceExtension(source) {
  const extension = extname(source);
  return [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx"].includes(extension)
    ? extension
    : ".ts";
}

async function sourceFor({ map, mapPath, index, packageDirectory }) {
  const source = map.sources?.[index];
  if (typeof source !== "string" || !source) {
    throw new Error(`${mapPath}: source ${index} is missing.`);
  }
  if (source.startsWith("/") || /^[A-Za-z]:[\\/]/.test(source)) {
    throw new Error(
      `${mapPath}: source ${source} is not an approved package source.`,
    );
  }
  const resolved = resolve(dirname(mapPath), map.sourceRoot ?? "", source);
  const sourceRoot = resolve(packageDirectory, "src");
  if (isWithin(sourceRoot, resolved)) {
    const content = await readFile(resolved, "utf8");
    const embedded = map.sourcesContent?.[index];
    if (embedded !== undefined && embedded !== content) {
      throw new Error(
        `${mapPath}: source ${source} does not match package source.`,
      );
    }
    return { content, kind: "package", source };
  }
  if (/(?:^|\/)(?:docs|experiments|tests)(?:\/|$)/.test(toPosix(source))) {
    throw new Error(
      `${mapPath}: source ${source} is not an approved package source.`,
    );
  }
  if (!helperPattern.test(toPosix(source))) {
    throw new Error(
      `${mapPath}: source ${source} is not an approved vue-jsx helper.`,
    );
  }
  const content = map.sourcesContent?.[index];
  if (typeof content !== "string" || !content) {
    throw new Error(
      `${mapPath}: vue-jsx helper ${source} has no source content.`,
    );
  }
  return {
    content,
    kind: "vue-jsx",
    source: `vue-jsx/${toPosix(source).match(helperPattern)[1]}`,
  };
}

async function writeSnapshot({ content, extension, output }) {
  const name = `${sha256(content)}${extension}`;
  const path = join(output, name);
  try {
    const existing = await readFile(path, "utf8");
    if (existing !== content)
      throw new Error(`Map snapshot hash collision: ${path}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(path, content);
  }
  return path;
}

export async function finalizePackage({ root, packageDirectory }) {
  const dist = join(packageDirectory, "dist");
  const snapshots = join(dist, "map-sources");
  await rm(snapshots, { recursive: true, force: true });
  await mkdir(snapshots, { recursive: true });
  const maps = (await files(dist)).filter((path) => path.endsWith(".map"));
  if (!maps.length)
    throw new Error(`${packageDirectory}: no source maps were emitted.`);
  const helpers = new Map();
  for (const mapPath of maps) {
    const map = JSON.parse(await readFile(mapPath, "utf8"));
    if (
      map.version !== 3 ||
      !Array.isArray(map.sources) ||
      !map.sources.length
    ) {
      throw new Error(`${mapPath}: invalid or empty source map.`);
    }
    const rewritten = [];
    for (let index = 0; index < map.sources.length; index += 1) {
      const input = await sourceFor({ map, mapPath, index, packageDirectory });
      const snapshot = await writeSnapshot({
        content: input.content,
        extension: sourceExtension(input.source),
        output: snapshots,
      });
      rewritten.push(toPosix(relative(dirname(mapPath), snapshot)));
      if (input.kind === "vue-jsx")
        helpers.set(input.source, sha256(input.content));
    }
    map.sources = rewritten;
    delete map.sourceRoot;
    delete map.sourcesContent;
    await writeFile(mapPath, JSON.stringify(map));
  }
  if (helpers.size) {
    const licenses = join(dist, "licenses");
    await mkdir(licenses, { recursive: true });
    await copyFile(
      join(root, "third-party-licenses", compilerLicense),
      join(licenses, compilerLicense),
    );
    await writeFile(
      join(dist, "compiler-provenance.json"),
      JSON.stringify(
        {
          compiler: "vue-jsx",
          version: compilerVersion,
          license: `licenses/${compilerLicense}`,
          sources: [...helpers].map(([source, hash]) => ({
            source,
            sha256: hash,
          })),
        },
        null,
        2,
      ) + "\n",
    );
  }
  return { mapCount: maps.length, compilerHelperCount: helpers.size };
}

export async function verifyPackageMaps({ root, packageDirectory }) {
  const dist = join(packageDirectory, "dist");
  const snapshots = resolve(dist, "map-sources");
  const maps = (await files(dist)).filter((path) => path.endsWith(".map"));
  if (!maps.length)
    throw new Error(`${packageDirectory}: no source maps were emitted.`);
  let compilerHelperCount = 0;
  const referencedSnapshots = new Set();
  const buildMeta = JSON.parse(
    await readFile(join(dist, "build-meta.json"), "utf8"),
  );
  const expectedHelpers = new Set(
    (buildMeta.chunks ?? [])
      .flatMap((chunk) => chunk.modules ?? [])
      .filter(
        (module) =>
          typeof module === "string" && module.startsWith("compiler:vue-jsx/"),
      )
      .map((module) => module.slice("compiler:".length)),
  );
  for (const mapPath of maps) {
    const map = JSON.parse(await readFile(mapPath, "utf8"));
    if (
      map.version !== 3 ||
      !Array.isArray(map.sources) ||
      !map.sources.length
    ) {
      throw new Error(`${mapPath}: invalid or empty source map.`);
    }
    if (map.sourceRoot || map.sourcesContent) {
      throw new Error(
        `${mapPath}: source map must use materialized package snapshots.`,
      );
    }
    for (const source of map.sources) {
      if (
        typeof source !== "string" ||
        source.startsWith("/") ||
        /^[A-Za-z]:[\\/]/.test(source)
      ) {
        throw new Error(`${mapPath}: unsafe materialized source.`);
      }
      const snapshot = resolve(dirname(mapPath), source);
      if (!isWithin(snapshots, snapshot)) {
        throw new Error(`${mapPath}: source escapes dist/map-sources.`);
      }
      let content;
      try {
        content = await readFile(snapshot, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT")
          throw new Error(`${mapPath}: source snapshot is missing.`);
        throw error;
      }
      const expected = `${sha256(content)}${extname(snapshot)}`;
      if (snapshot !== join(snapshots, expected)) {
        throw new Error(
          `${mapPath}: source snapshot hash does not match its content.`,
        );
      }
      referencedSnapshots.add(snapshot);
    }
  }
  const materialized = await files(snapshots);
  if (
    materialized.length !== referencedSnapshots.size ||
    materialized.some((path) => !referencedSnapshots.has(path))
  ) {
    throw new Error(
      `${packageDirectory}: dist/map-sources contains an unreferenced snapshot.`,
    );
  }
  const provenance = join(dist, "compiler-provenance.json");
  let record;
  try {
    record = JSON.parse(await readFile(provenance, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" && !expectedHelpers.size)
      return { mapCount: maps.length, compilerHelperCount: 0 };
    if (error?.code === "ENOENT")
      throw new Error(`${provenance}: missing compiler provenance.`);
    throw error;
  }
  if (
    record.compiler !== "vue-jsx" ||
    record.version !== compilerVersion ||
    !Array.isArray(record.sources) ||
    !record.sources.length
  ) {
    throw new Error(`${provenance}: invalid compiler provenance.`);
  }
  const actualHelpers = new Set();
  for (const entry of record.sources) {
    if (
      typeof entry.source !== "string" ||
      !helperPattern.test(entry.source) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    ) {
      throw new Error(`${provenance}: invalid compiler helper source.`);
    }
    if (
      ![...referencedSnapshots].some((path) =>
        path.endsWith(`${entry.sha256}.ts`),
      )
    ) {
      throw new Error(`${provenance}: compiler helper snapshot is missing.`);
    }
    actualHelpers.add(entry.source);
  }
  if (
    actualHelpers.size !== expectedHelpers.size ||
    [...actualHelpers].some((source) => !expectedHelpers.has(source))
  ) {
    throw new Error(
      `${provenance}: compiler helper sources do not match build metadata.`,
    );
  }
  const license = join(dist, record.license ?? "");
  let packagedLicense;
  try {
    packagedLicense = await readFile(license, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT")
      throw new Error(`${provenance}: missing vue-jsx license.`);
    throw error;
  }
  if (
    !isWithin(dist, license) ||
    packagedLicense !==
      (await readFile(
        join(root, "third-party-licenses", compilerLicense),
        "utf8",
      ))
  ) {
    throw new Error(`${provenance}: missing vue-jsx license.`);
  }
  compilerHelperCount = record.sources.length;
  return { mapCount: maps.length, compilerHelperCount };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const verifyOnly = process.argv[2] === "--verify";
  const packageDirectory = resolve(
    process.cwd(),
    process.argv[verifyOnly ? 3 : 2] ?? ".",
  );
  if (!verifyOnly) await finalizePackage({ root, packageDirectory });
  await verifyPackageMaps({ root, packageDirectory });
}
