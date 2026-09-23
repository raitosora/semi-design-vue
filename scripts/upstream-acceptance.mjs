import { lstat, readFile, realpath, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { sha256 } from "./upstream-source.mjs";

const evidenceKinds = [
  "contract",
  "implementation",
  "sourceAndDeclarations",
  "browser",
  "documentation",
  "consumer",
  "limitations",
];
const evidencePaths = (evidence) =>
  evidenceKinds
    .filter((kind) => kind !== "limitations")
    .flatMap((kind) => evidence[kind]);

const validPath = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  !value.startsWith("/") &&
  !value.split("/").includes("..");

function validateEvidence(evidence) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence))
    throw new Error("Acceptance evidence must be an object.");
  if (
    Object.keys(evidence).length !== evidenceKinds.length ||
    Object.keys(evidence).some((kind) => !evidenceKinds.includes(kind))
  )
    throw new Error("Acceptance evidence contains an unknown evidence kind.");
  for (const kind of evidenceKinds) {
    const values = evidence[kind];
    if (!Array.isArray(values) || values.length === 0)
      throw new Error(`Acceptance evidence requires ${kind}.`);
    if (!values.every((value) => typeof value === "string" && value.trim()))
      throw new Error(`Acceptance evidence ${kind} contains an invalid value.`);
    if (kind !== "limitations" && !values.every((value) => validPath(value)))
      throw new Error(`Acceptance evidence ${kind} contains an invalid path.`);
  }
  if (
    !evidence.browser.some((path) =>
      /^tests\/(?:browser|e2e)\/.+\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/.test(
        path,
      ),
    )
  )
    throw new Error("Acceptance evidence browser requires a browser test.");
  if (
    !evidence.documentation.some((path) => /^website\/src\/.+\.md$/.test(path))
  )
    throw new Error(
      "Acceptance evidence documentation requires a website document.",
    );
  if (
    !evidence.consumer.some(
      (path) =>
        /^tests\/(?:consumer|resource-consumer)\//.test(path) ||
        /^scripts\/check-[^/]*consumer\.mjs$/.test(path),
    )
  )
    throw new Error(
      "Acceptance evidence consumer requires a consumer surface.",
    );
  return evidence;
}

function validateMappings(mappings, family) {
  if (!mappings || typeof mappings !== "object" || Array.isArray(mappings))
    throw new Error(`Acceptance record ${family} requires mappings.`);
  for (const kind of ["api", "types", "statics", "subpaths"])
    if (typeof mappings[kind] !== "string" || !mappings[kind].trim())
      throw new Error(`Acceptance record ${family} requires ${kind} mapping.`);
  return mappings;
}

function validateDifferenceMappings(record) {
  const differences = record.mappings.differences;
  if (
    !differences ||
    typeof differences !== "object" ||
    Array.isArray(differences)
  )
    throw new Error(`Accepted ${record.family} requires difference mappings.`);
  const shapes = {
    types: ["name", "sourcePath"],
    staticMembers: ["rootExport", "name"],
    subpaths: ["upstreamPackage", "subpath"],
  };
  if (
    Object.keys(differences).length !== Object.keys(shapes).length ||
    Object.keys(differences).some((key) => !Object.hasOwn(shapes, key))
  )
    throw new Error(
      `Accepted ${record.family} has invalid difference mapping keys.`,
    );
  for (const [kind, keys] of Object.entries(shapes)) {
    const entries = differences[kind];
    if (!Array.isArray(entries))
      throw new Error(`Accepted ${record.family} requires ${kind} mappings.`);
    const seen = new Set();
    for (const entry of entries) {
      const scoped =
        kind === "types" &&
        entry &&
        (Object.hasOwn(entry, "currentPackage") ||
          Object.hasOwn(entry, "currentSubpath"));
      const allowed = scoped
        ? [...keys, "currentPackage", "currentSubpath"]
        : keys;
      const validTarget =
        !scoped ||
        (typeof entry.currentPackage === "string" &&
          /^(?:@[a-z0-9_-]+\/)?[a-z0-9_-]+$/.test(entry.currentPackage) &&
          typeof entry.currentSubpath === "string" &&
          /^\.\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(
            entry.currentSubpath,
          ) &&
          !entry.currentSubpath
            .split("/")
            .slice(1)
            .some((part) => part === "." || part === ".."));
      if (
        !entry ||
        !validTarget ||
        Object.keys(entry).length !== allowed.length ||
        Object.keys(entry).some((key) => !allowed.includes(key)) ||
        !keys.every((key) => typeof entry[key] === "string" && entry[key])
      )
        throw new Error(
          `Accepted ${record.family} has invalid ${kind} mapping.`,
        );
      const fingerprint = keys.map((key) => entry[key]).join("\0");
      if (seen.has(fingerprint))
        throw new Error(
          `Accepted ${record.family} has duplicate ${kind} mapping.`,
        );
      seen.add(fingerprint);
    }
  }
}

/**
 * Acceptance is a deliberate reviewer decision, separate from source discovery.
 * Pending records may cite planned files, while accepted records must retain a
 * completed verification record so a command invocation cannot accept a family.
 */
export function validateAcceptanceRecords(value) {
  if (!value || value.schema !== 1 || !Array.isArray(value.families))
    throw new Error(
      "Acceptance records require schema 1 and a families array.",
    );
  if (typeof value.policy !== "string" || !value.policy.trim())
    throw new Error("Acceptance records require a policy.");
  const names = new Set();
  const families = value.families.map((record) => {
    if (!record || !validPath(record.family) || record.family.includes("/"))
      throw new Error("Acceptance record requires a valid family.");
    if (names.has(record.family))
      throw new Error(`Duplicate acceptance family: ${record.family}`);
    names.add(record.family);
    if (!["pending", "accepted"].includes(record.status))
      throw new Error(`Invalid acceptance status for ${record.family}.`);
    if (
      typeof record.reviewedDecision !== "string" ||
      !record.reviewedDecision.trim()
    )
      throw new Error(
        `Acceptance record ${record.family} requires reviewedDecision.`,
      );
    validateEvidence(record.evidence);
    validateMappings(record.mappings, record.family);
    if (record.status === "accepted") {
      validateDifferenceMappings(record);
      if (
        !record.verification ||
        record.verification.status !== "complete" ||
        typeof record.verification.reviewId !== "string" ||
        !record.verification.reviewId.trim()
      )
        throw new Error(
          `Accepted ${record.family} requires a completed verification record.`,
        );
      const paths = evidencePaths(record.evidence);
      const hashes = record.verification.evidenceHashes;
      if (
        !hashes ||
        typeof hashes !== "object" ||
        Array.isArray(hashes) ||
        !paths.every(
          (path) =>
            typeof hashes[path] === "string" &&
            /^[a-f0-9]{64}$/.test(hashes[path]),
        )
      )
        throw new Error(
          `Accepted ${record.family} requires hashes for every evidence path.`,
        );
    } else if (record.verification)
      throw new Error(`Pending ${record.family} cannot contain verification.`);
    return structuredClone(record);
  });
  return { schema: 1, policy: value.policy, families };
}

export async function validateAcceptedEvidence(root, acceptance) {
  if (typeof root !== "string" || !root)
    throw new Error("Acceptance root is required.");
  const records = validateAcceptanceRecords(acceptance);
  const resolvedRoot = await realpath(root);
  const lexicalRoot = resolve(root);
  for (const record of records.families) {
    if (record.status !== "accepted") continue;
    for (const path of evidencePaths(record.evidence)) {
      const target = resolve(root, path);
      if (!target.startsWith(lexicalRoot + "/"))
        throw new Error(`Accepted evidence path escapes root: ${path}`);
      if (
        !/^(?:packages|website|tests|resources|scripts)\//.test(path) ||
        /^(?:docs|experiments)\//.test(path) ||
        path
          .split("/")
          .slice(1)
          .some(
            (segment) =>
              segment === "node_modules" ||
              segment === "dist" ||
              segment === "artifacts" ||
              segment.startsWith("."),
          )
      )
        throw new Error(`Accepted evidence is outside formal roots: ${path}`);
      let info;
      try {
        info = await lstat(target);
      } catch {
        throw new Error(`Accepted evidence file is missing: ${path}`);
      }
      if (info.isSymbolicLink())
        throw new Error(`Accepted evidence cannot be a symlink: ${path}`);
      let parent = lexicalRoot;
      for (const segment of path.split("/")) {
        parent = join(parent, segment);
        if ((await lstat(parent)).isSymbolicLink())
          throw new Error(
            `Accepted evidence cannot traverse a symlink: ${path}`,
          );
      }
      if (!info.isFile())
        throw new Error(`Accepted evidence must be a file: ${path}`);
      if ((await realpath(target)) !== resolve(resolvedRoot, path))
        throw new Error(`Accepted evidence path escapes root: ${path}`);
      const contents = await readFile(target, "utf8");
      if (!contents.trim())
        throw new Error(`Accepted evidence must be nonempty: ${path}`);
      if (sha256(contents) !== record.verification.evidenceHashes[path])
        throw new Error(`Accepted evidence hash differs: ${path}`);
    }
  }
  return records;
}

export function applyAcceptance(matrix, acceptance) {
  if (!matrix || !Array.isArray(matrix.families) || !matrix.summary)
    throw new Error("Matrix must contain families and summary.");
  const records = validateAcceptanceRecords(acceptance);
  const byFamily = new Map(
    records.families.map((record) => [record.family, record]),
  );
  for (const family of byFamily.keys())
    if (!matrix.families.some((entry) => entry.name === family))
      throw new Error(
        `Acceptance record references an unknown family: ${family}`,
      );
  for (const record of records.families) {
    if (record.status !== "accepted") continue;
    const rootEntries = matrix.rootExports.filter(
      (entry) => entry.family === record.family,
    );
    if (
      !rootEntries.length ||
      rootEntries.some((entry) => !entry.currentExportExists)
    )
      throw new Error(
        `Accepted ${record.family} requires every current root export.`,
      );
  }
  const families = matrix.families.map((entry) => {
    const record = byFamily.get(entry.name);
    if (!record) return { ...entry, acceptanceStatus: "unrecorded" };
    if (record.status === "pending")
      return {
        ...entry,
        acceptanceStatus: "pending",
        acceptance: record,
      };
    return {
      ...entry,
      publicDelivery: "delivered",
      behaviorAcceptance: "accepted",
      acceptanceStatus: "accepted",
      acceptance: record,
      apiDifference: record.mappings.api,
      typeDifference: record.mappings.types,
      staticDifference: record.mappings.statics,
      subpathDifference: record.mappings.subpaths,
    };
  });
  const rootExports = matrix.rootExports.map((entry) => {
    const record = entry.family && byFamily.get(entry.family);
    if (!record || record.status !== "accepted")
      return {
        ...entry,
        acceptanceStatus: record ? "pending" : "unrecorded",
      };
    return {
      ...entry,
      publicDelivery: "delivered",
      behaviorAcceptance: "accepted",
      acceptanceStatus: "accepted",
      classification: "public-component",
      alignment: "accepted-reviewed-contract",
      difference: record.mappings.api,
    };
  });
  return {
    ...matrix,
    acceptancePolicy: records.policy,
    families,
    rootExports,
    summary: {
      ...matrix.summary,
      publiclyDeliveredFamilies: families.filter(
        (entry) => entry.publicDelivery === "delivered",
      ).length,
      behaviorAcceptedFamilies: families.filter(
        (entry) => entry.behaviorAcceptance === "accepted",
      ).length,
      pendingAcceptanceFamilies: families.filter(
        (entry) => entry.acceptanceStatus === "pending",
      ).length,
    },
  };
}
