import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const root = fileURLToPath(new URL("../", import.meta.url));
const resourceDirectory = join("resources", "locale");
const outputDirectory = join("packages", "semi-ui-vue", "src", "locale");
const expectedUpstream = {
  sha: "8bed560dd3f36579f85b7a522f19762f2bace756",
  version: "2.103.0",
};
const expectedDateFnsVersion = "2.30.0";
const expectedDateFnsRange = "^2.29.3";
const expectedLocaleLicenses = [
  [
    "third-party-licenses/semi-ui-locale-2.103.0-MIT.txt",
    "2acf865e87e59090121369aac0575467067fdd7999923a70d785a46ceae3330f",
  ],
  [
    "third-party-licenses/date-fns-2.30.0-MIT.txt",
    "8d3951c38967b964b1fe259bfd200c2647cc04c858b55a4414e3122a60f1ef4b",
  ],
];
const expectedSourceTreeHash =
  "f9e109ef8f725afc314a8d4b7b7f1d694241ae9ba5ca46fd0227778c3d15bf9e";
const dateFnsLocalePaths = {
  arSA: "ar-SA",
  az: "az",
  bg: "bg",
  bn: "bn",
  ca: "ca",
  cs: "cs",
  da: "da",
  de: "de",
  el: "el",
  enGB: "en-GB",
  enUS: "en-US",
  es: "es",
  et: "et",
  faIR: "fa-IR",
  fi: "fi",
  fr: "fr",
  frCA: "fr-CA",
  he: "he",
  hi: "hi",
  hr: "hr",
  hu: "hu",
  id: "id",
  is: "is",
  it: "it",
  ja: "ja",
  kk: "kk",
  km: "km",
  ko: "ko",
  lt: "lt",
  lv: "lv",
  ms: "ms",
  nb: "nb",
  nl: "nl",
  pl: "pl",
  pt: "pt",
  ptBR: "pt-BR",
  ro: "ro",
  ru: "ru",
  sk: "sk",
  sl: "sl",
  sq: "sq",
  sv: "sv",
  th: "th",
  tr: "tr",
  uk: "uk",
  uz: "uz",
  vi: "vi",
  zhCN: "zh-CN",
  zhTW: "zh-TW",
};
const requiredLicenseNotices = new Map([
  [
    "third-party-licenses/semi-ui-locale-2.103.0-MIT.txt",
    "Copyright (c) 2021 DouyinFE",
  ],
  [
    "third-party-licenses/date-fns-2.30.0-MIT.txt",
    "Copyright (c) 2021 Sasha Koss",
  ],
]);

function digest(content) {
  return createHash("sha256").update(content).digest("hex");
}

function snapshotTreeHash(snapshot) {
  return digest(
    Object.keys(snapshot)
      .sort()
      .map((path) => `${path}\0${digest(snapshot[path])}\n`)
      .join(""),
  );
}

function pathFor(rootDirectory, relativePath) {
  return join(rootDirectory, ...relativePath.split("/"));
}

async function readManifest(rootDirectory) {
  return JSON.parse(
    await readFile(
      pathFor(rootDirectory, `${resourceDirectory}/manifest.json`),
      "utf8",
    ),
  );
}

async function readSnapshot(rootDirectory) {
  return JSON.parse(
    await readFile(
      pathFor(rootDirectory, `${resourceDirectory}/sources.json`),
      "utf8",
    ),
  );
}

function assertManifest(manifest) {
  if (
    manifest?.schemaVersion !== 1 ||
    manifest?.generator !== "scripts/locale-inputs.mjs"
  ) {
    throw new Error("Invalid locale resource manifest.");
  }
  if (
    manifest.upstream?.sha !== expectedUpstream.sha ||
    manifest.upstream?.version !== expectedUpstream.version ||
    manifest.upstream?.repository !==
      "https://github.com/DouyinFE/semi-design" ||
    manifest.upstream?.ref !== "v2.103.0" ||
    manifest.upstream?.sourceDirectory !== "packages/semi-ui/locale"
  ) {
    throw new Error(
      "Expected fixed Semi locale source 2.103.0 at 8bed560dd3f36579f85b7a522f19762f2bace756.",
    );
  }
  if (
    manifest.dateFns?.version !== expectedDateFnsVersion ||
    manifest.dateFns?.upstreamRange !== expectedDateFnsRange ||
    manifest.dateFns?.license !== expectedLocaleLicenses[1][0]
  ) {
    throw new Error(`Expected date-fns ${expectedDateFnsVersion}.`);
  }
  if (
    JSON.stringify(
      manifest.licenses?.map(({ path, sha256 }) => [path, sha256]),
    ) !== JSON.stringify(expectedLocaleLicenses)
  ) {
    throw new Error("Locale manifest has invalid fixed license metadata.");
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("Locale resource manifest has no source files.");
  }
  const hash = /^[a-f0-9]{64}$/;
  if (
    !hash.test(manifest.interface?.sha256) ||
    !hash.test(manifest.interface?.outputSha256)
  ) {
    throw new Error("Locale resource manifest has invalid interface hashes.");
  }
  if (
    manifest.files.some(
      (file) => !hash.test(file?.sha256) || !hash.test(file?.outputSha256),
    )
  ) {
    throw new Error("Locale resource manifest has invalid source hashes.");
  }
  const paths = manifest.files.map((file) => file?.path);
  if (new Set(paths).size !== paths.length) {
    throw new Error("Locale resource manifest has duplicate source paths.");
  }
}

function checkHash(content, relativePath, expectedHash, label) {
  if (digest(content) !== expectedHash) {
    throw new Error(`Locked locale ${label} drift: ${relativePath}.`);
  }
  return content;
}

async function renderTypeScript(content) {
  const direct = content.replace(
    /import \{ (\w+) \} from 'date-fns\/locale';/,
    (_match, name) => {
      const localePath = dateFnsLocalePaths[name];
      if (!localePath)
        throw new Error(`Unsupported fixed date-fns locale ${name}.`);
      return `import ${name} from 'date-fns/locale/${localePath}/index.js';`;
    },
  );
  return format(
    direct
      .replace(
        "import { Locale as dateFnsLocale } from 'date-fns';",
        "import type { Locale as dateFnsLocale } from 'date-fns';",
      )
      .replace(
        "import { Locale } from '../interface';",
        "import type { Locale } from '../interface.js';",
      ),
    { parser: "typescript" },
  );
}

export function listLocaleOutputs(inputs) {
  return ["interface.ts", ...inputs.files.map((file) => file.path)];
}

async function listOwnedEntries(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const all = await Promise.all(
    entries.map(async (entry) => {
      const location = join(directory, entry.name);
      const entryPath = relative(base, location).replaceAll("\\", "/");
      if (!entry.isDirectory()) return { files: [entryPath], directories: [] };
      const nested = await listOwnedEntries(location, base);
      return {
        files: nested.files,
        directories: [entryPath, ...nested.directories],
      };
    }),
  );
  return all.reduce(
    (result, entry) => ({
      files: [...result.files, ...entry.files],
      directories: [...result.directories, ...entry.directories],
    }),
    { files: [], directories: [] },
  );
}

export async function checkLocaleInputs(rootDirectory = root) {
  const manifest = await readManifest(rootDirectory);
  const snapshot = await readSnapshot(rootDirectory);
  assertManifest(manifest);
  if (snapshotTreeHash(snapshot) !== expectedSourceTreeHash) {
    throw new Error("Fixed locale snapshot tree drift.");
  }
  const tracked = new Set([
    manifest.interface.path,
    ...manifest.files.map((file) => file.path),
  ]);
  for (const sourcePath of Object.keys(snapshot)) {
    if (!tracked.has(sourcePath))
      throw new Error(`Untracked locale resource ${sourcePath}.`);
  }
  for (const sourcePath of tracked) {
    if (typeof snapshot[sourcePath] !== "string") {
      throw new Error(`Missing locale resource ${sourcePath}.`);
    }
  }
  checkHash(
    snapshot[manifest.interface.path],
    manifest.interface.path,
    manifest.interface.sha256,
    "interface",
  );
  for (const file of manifest.files) {
    if (!file.path.startsWith("source/") || !file.path.endsWith(".ts")) {
      throw new Error(`Invalid locale resource path ${file.path}.`);
    }
    const content = checkHash(
      snapshot[file.path],
      file.path,
      file.sha256,
      "source",
    );
    if (/\b(?:react|lodash)(?:\/|['"])/.test(content)) {
      throw new Error(
        `Locale source must not import React or lodash: ${file.path}.`,
      );
    }
  }
  for (const [license, notice] of requiredLicenseNotices) {
    const lockedLicense = manifest.licenses?.find(
      (item) => item.path === license,
    );
    if (!lockedLicense?.sha256) {
      throw new Error(`Locale manifest is missing ${license}.`);
    }
    const baselineHash = expectedLocaleLicenses.find(
      ([path]) => path === license,
    )?.[1];
    if (lockedLicense.sha256 !== baselineHash)
      throw new Error(`Locale manifest license hash drift: ${license}.`);
    const content = await readFile(pathFor(rootDirectory, license), "utf8");
    if (
      digest(content) !== lockedLicense.sha256 ||
      !content.includes("MIT License") ||
      !content.includes(notice)
    ) {
      throw new Error(`Locale license notice is incomplete: ${license}.`);
    }
  }
  return { ...manifest, snapshot };
}

export async function generateLocale({
  root: rootDirectory = root,
  output,
} = {}) {
  const inputs = await checkLocaleInputs(rootDirectory);
  if (!output)
    throw new Error("Locale generation requires an output directory.");
  const generated = await Promise.all(
    [inputs.interface, ...inputs.files].map(async (file) => ({
      path: file.path,
      content: await renderTypeScript(inputs.snapshot[file.path]),
      hash: file.outputSha256,
    })),
  );
  for (const file of generated) {
    if (digest(file.content) !== file.hash)
      throw new Error(`Locked generated locale drift: ${file.path}.`);
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of generated) {
    const destination = join(output, file.path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.content, "utf8");
  }
  return inputs;
}

export async function generateCommittedLocale(rootDirectory = root) {
  const destination = pathFor(rootDirectory, outputDirectory);
  await stat(pathFor(rootDirectory, resourceDirectory));
  return generateLocale({ root: rootDirectory, output: destination });
}

export async function checkGeneratedLocale(rootDirectory = root) {
  const inputs = await checkLocaleInputs(rootDirectory);
  const destination = pathFor(rootDirectory, outputDirectory);
  const expected = new Set(listLocaleOutputs(inputs));
  const entries = await listOwnedEntries(destination);
  const actual = new Set(entries.files);
  if (
    JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())
  ) {
    throw new Error(
      "Generated locale output set does not match the fixed manifest.",
    );
  }
  if (
    JSON.stringify([...new Set(entries.directories)].sort()) !==
    JSON.stringify(["source"])
  ) {
    throw new Error(
      "Generated locale output directories do not match the fixed manifest.",
    );
  }
  for (const file of [inputs.interface, ...inputs.files]) {
    const generated = await readFile(join(destination, file.path), "utf8");
    const expectedContent = await renderTypeScript(inputs.snapshot[file.path]);
    if (generated !== expectedContent) {
      throw new Error(`Generated locale output drift: ${file.path}.`);
    }
  }
  return inputs;
}

export async function stageLocaleDistribution({
  root: rootDirectory = root,
  output,
} = {}) {
  const inputs = await checkLocaleInputs(rootDirectory);
  const { snapshot: _snapshot, ...metadata } = inputs;
  if (!output)
    throw new Error(
      "Locale distribution staging requires an output directory.",
    );
  const provenancePath = join(output, "locale", "provenance.json");
  await mkdir(join(output, "locale"), { recursive: true });
  await writeFile(
    provenancePath,
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
  for (const license of inputs.licenses) {
    const destination = join(
      output,
      "licenses",
      license.path.split("/").at(-1),
    );
    await mkdir(join(output, "licenses"), { recursive: true });
    await cp(pathFor(rootDirectory, license.path), destination, {
      force: true,
    });
  }
  return inputs;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateCommittedLocale();
  console.log("Generated fixed Semi locale resources.");
}
