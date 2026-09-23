import { expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyAcceptance,
  validateAcceptedEvidence,
  validateAcceptanceRecords,
} from "../../scripts/upstream-acceptance.mjs";

const evidence = {
  contract: ["packages/semi-icons-vue/src/components/Icon.tsx"],
  implementation: ["packages/semi-icons-vue/src/components/Icon.tsx"],
  sourceAndDeclarations: [
    "packages/semi-icons-vue/src/components/types.ts",
    "packages/semi-icons-vue/src/index.ts",
  ],
  browser: ["tests/browser/icons.test.tsx", "tests/e2e/icons.spec.ts"],
  documentation: ["website/src/zh-CN/components/icons.md"],
  consumer: ["tests/resource-consumer/icons.tsx"],
  limitations: ["SSR、hydration 与 CJS 入口不支持。"],
};
const mappings = {
  api: "Vue Icon contract.",
  types: "Vue Icon declarations.",
  statics: "No static subcomponents.",
  subpaths: "ESM root and ./Icon.",
  differences: {
    types: [
      {
        name: "IconProps",
        sourcePath: "packages/semi-icons/src/components/Icon.tsx",
      },
    ],
    staticMembers: [{ rootExport: "Icon", name: "elementType" }],
    subpaths: [{ upstreamPackage: "@douyinfe/semi-icons", subpath: "./Icon" }],
  },
};

it("keeps a reviewed pending decision separate from delivery and behavior acceptance", () => {
  const records = validateAcceptanceRecords({
    schema: 1,
    policy:
      "Only an explicit, reviewed decision with all evidence categories can alter a family status.",
    families: [
      {
        family: "icons",
        status: "pending",
        reviewedDecision:
          "Implementation evidence is listed for review; it is not a completed acceptance decision.",
        mappings,
        evidence,
      },
    ],
  });
  const matrix = applyAcceptance(
    {
      families: [
        {
          name: "icons",
          publicDelivery: "not-delivered",
          behaviorAcceptance: "not-accepted",
        },
      ],
      rootExports: [],
      summary: {},
    },
    records,
  );
  expect(matrix.families[0]).toMatchObject({
    acceptanceStatus: "pending",
    publicDelivery: "not-delivered",
    behaviorAcceptance: "not-accepted",
  });
});

it("rejects automatic acceptance, incomplete evidence, and unknown families", () => {
  const record = {
    family: "icons",
    status: "accepted",
    reviewedDecision: "A reviewer accepted the complete contract.",
    mappings,
    evidence,
  };
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [{ ...record, evidence: { ...evidence, browser: [] } }],
    }),
  ).toThrow(/browser/);
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [{ ...record, reviewedDecision: "" }],
    }),
  ).toThrow(/reviewedDecision/);
  expect(() =>
    applyAcceptance(
      { families: [{ name: "icons" }], rootExports: [], summary: {} },
      validateAcceptanceRecords({
        schema: 1,
        policy: "reviewed",
        families: [{ ...record, family: "missing", status: "pending" }],
      }),
    ),
  ).toThrow(/unknown family/);
  expect(() =>
    applyAcceptance(
      { families: [{ name: "icons" }], rootExports: [], summary: {} },
      validateAcceptanceRecords({
        schema: 1,
        policy: "reviewed",
        families: [record],
      }),
    ),
  ).toThrow(/requires a completed verification record/);
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [{ ...record, status: "pending", verification: {} }],
    }),
  ).toThrow(/Pending icons/);
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [{ ...record, status: "unknown" }],
    }),
  ).toThrow(/Invalid acceptance status/);
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [{ ...record, status: "pending", mappings: {} }],
    }),
  ).toThrow(/requires api mapping/);
  expect(() =>
    validateAcceptanceRecords({ schema: 1, policy: "", families: [] }),
  ).toThrow(/require a policy/);
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [
        {
          ...record,
          verification: {
            status: "complete",
            reviewId: "r",
            evidenceHashes: {},
          },
          mappings: { ...mappings, differences: { types: [{}] } },
        },
      ],
    }),
  ).toThrow(/difference mapping keys/);
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [
        {
          ...record,
          status: "pending",
          evidence: {
            ...evidence,
            extra: ["../../unsafe-evidence.ts"],
          },
        },
      ],
    }),
  ).toThrow(/unknown evidence/i);
  for (const [kind, path] of [
    ["browser", evidence.contract[0]],
    ["documentation", evidence.contract[0]],
    ["consumer", evidence.contract[0]],
  ])
    expect(() =>
      validateAcceptanceRecords({
        schema: 1,
        policy: "reviewed",
        families: [
          {
            ...record,
            status: "pending",
            evidence: { ...evidence, [kind]: [path] },
          },
        ],
      }),
    ).toThrow(new RegExp(kind));
});

it("validates optional public type targets as an all-or-nothing literal pair", () => {
  const record = {
    family: "icons",
    status: "accepted",
    reviewedDecision: "A reviewer accepted the complete contract.",
    verification: {
      status: "complete",
      reviewId: "icons-final-review",
      evidenceHashes: Object.fromEntries(
        Object.values(evidence)
          .slice(0, -1)
          .flat()
          .map((path) => [path, "a".repeat(64)]),
      ),
    },
    evidence,
    mappings: {
      ...mappings,
      differences: {
        ...mappings.differences,
        types: [
          {
            name: "IconProps",
            sourcePath: "packages/semi-icons/src/components/Icon.tsx",
            currentPackage: "semi-icons-vue",
            currentSubpath: "./Icon",
          },
        ],
      },
    },
  };
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [record],
    }),
  ).not.toThrow();
  const target = record.mappings.differences.types[0];
  for (const invalid of [
    { ...target, currentPackage: undefined },
    { ...target, currentSubpath: undefined },
    { ...target, currentPackage: "" },
    { ...target, currentSubpath: "" },
    { ...target, currentSubpath: "../Icon" },
    { ...target, currentSubpath: "./Icon/*" },
    { ...target, extra: "forbidden" },
  ]) {
    const value = structuredClone(record);
    value.mappings.differences.types = [invalid];
    expect(() =>
      validateAcceptanceRecords({
        schema: 1,
        policy: "reviewed",
        families: [value],
      }),
    ).toThrow();
  }
  const duplicate = structuredClone(record);
  duplicate.mappings.differences.types.push({
    ...target,
    currentPackage: "another-package",
    currentSubpath: "./another",
  });
  expect(() =>
    validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [duplicate],
    }),
  ).toThrow(/duplicate types mapping/i);
});

it("promotes a family only after an explicit completed review record", () => {
  const acceptance = validateAcceptanceRecords({
    schema: 1,
    policy: "reviewed",
    families: [
      {
        family: "icons",
        status: "accepted",
        reviewedDecision: "The review accepted the listed public contract.",
        verification: {
          status: "complete",
          reviewId: "icons-final-review",
          evidenceHashes: Object.fromEntries(
            Object.values(evidence)
              .slice(0, -1)
              .flat()
              .map((path) => [path, "a".repeat(64)]),
          ),
        },
        mappings,
        evidence,
      },
    ],
  });
  expect(
    applyAcceptance(
      {
        families: [
          {
            name: "icons",
            publicDelivery: "not-delivered",
            behaviorAcceptance: "not-accepted",
          },
        ],
        rootExports: [
          { name: "Icon", family: "icons", currentExportExists: true },
        ],
        summary: {},
      },
      acceptance,
    ).families[0],
  ).toMatchObject({
    acceptanceStatus: "accepted",
    publicDelivery: "delivered",
    behaviorAcceptance: "accepted",
  });
  const result = applyAcceptance(
    {
      families: [
        { name: "icons", publicDelivery: "not-delivered" },
        { name: "other", publicDelivery: "not-delivered" },
      ],
      rootExports: [
        {
          name: "Icon",
          family: "icons",
          classification: "infrastructure",
          currentExportExists: true,
        },
        { name: "semiGlobal", classification: "infrastructure" },
        { name: "Other", classification: "absent" },
      ],
      summary: {},
    },
    acceptance,
  );
  expect(result.rootExports).toMatchObject([
    {
      acceptanceStatus: "accepted",
      publicDelivery: "delivered",
      classification: "public-component",
    },
    { acceptanceStatus: "unrecorded", classification: "infrastructure" },
    { acceptanceStatus: "unrecorded", classification: "absent" },
  ]);
  expect(result.families[1].acceptanceStatus).toBe("unrecorded");
  for (const rootExports of [
    [],
    [{ name: "Icon", family: "icons", currentExportExists: false }],
    [
      { name: "Icon", family: "icons", currentExportExists: true },
      { name: "IconProps", family: "icons", currentExportExists: false },
    ],
  ])
    expect(() =>
      applyAcceptance(
        {
          families: [{ name: "icons" }],
          rootExports,
          summary: {},
        },
        acceptance,
      ),
    ).toThrow(/current root export/i);
  expect(() => applyAcceptance(null, acceptance)).toThrow(/Matrix/);
  const noIndexedStaticsOrSubpaths = structuredClone(acceptance);
  noIndexedStaticsOrSubpaths.families[0].mappings.differences.staticMembers =
    [];
  noIndexedStaticsOrSubpaths.families[0].mappings.differences.subpaths = [];
  expect(() =>
    validateAcceptanceRecords(noIndexedStaticsOrSubpaths),
  ).not.toThrow();
});

it("requires accepted evidence files to be nonempty and content-hash pinned", async () => {
  const root = await mkdtemp(join(tmpdir(), "semi-acceptance-"));
  const path = "packages/semi-icons-vue/src/components/Icon.tsx";
  const content = "export const Icon = () => null;\n";
  const sha256 = createHash("sha256").update(content).digest("hex");
  const acceptedEvidence = {
    contract: [path],
    implementation: [path],
    sourceAndDeclarations: [path],
    browser: ["tests/browser/icons.test.tsx"],
    documentation: ["website/src/zh-CN/components/icons.md"],
    consumer: ["tests/resource-consumer/icons.tsx"],
    limitations: evidence.limitations,
  };
  try {
    for (const files of Object.values(acceptedEvidence))
      for (const file of files)
        if (file !== acceptedEvidence.limitations[0]) {
          await mkdir(join(root, file, ".."), { recursive: true });
          await writeFile(join(root, file), content);
        }
    const accepted = validateAcceptanceRecords({
      schema: 1,
      policy: "reviewed",
      families: [
        {
          family: "icons",
          status: "accepted",
          reviewedDecision: "Reviewed after final verification.",
          verification: {
            status: "complete",
            reviewId: "icons-final-review",
            evidenceHashes: Object.fromEntries(
              Object.entries(acceptedEvidence)
                .filter(([kind]) => kind !== "limitations")
                .flatMap(([, paths]) => paths)
                .map((file) => [file, sha256]),
            ),
          },
          mappings,
          evidence: acceptedEvidence,
        },
      ],
    });
    await expect(validateAcceptedEvidence(root, accepted)).resolves.toEqual(
      accepted,
    );
    await writeFile(join(root, path), "changed\n");
    await expect(validateAcceptedEvidence(root, accepted)).rejects.toThrow(
      /hash differs/,
    );
    await writeFile(join(root, path), "");
    await expect(validateAcceptedEvidence(root, accepted)).rejects.toThrow(
      /nonempty/,
    );
    await writeFile(join(root, path), content);
    await rm(join(root, path));
    await expect(validateAcceptedEvidence(root, accepted)).rejects.toThrow(
      /file is missing/,
    );
    await mkdir(join(root, path), { recursive: true });
    await expect(validateAcceptedEvidence(root, accepted)).rejects.toThrow(
      /must be a file/,
    );
    await rm(join(root, path), { recursive: true });
    const external = await mkdtemp(join(tmpdir(), "semi-acceptance-target-"));
    try {
      await writeFile(join(external, "proof.ts"), content);
      for (const [name, target] of [
        ["external", join(external, "proof.ts")],
        ["internal", join(root, "proof.ts")],
      ]) {
        if (name === "internal") await writeFile(target, content);
        await symlink(target, join(root, path));
        await expect(validateAcceptedEvidence(root, accepted)).rejects.toThrow(
          /cannot be a symlink/,
        );
        await rm(join(root, path));
      }
    } finally {
      await rm(external, { recursive: true, force: true });
    }
    const ignoredPath = "docs/proof.ts";
    await mkdir(join(root, "docs"), { recursive: true });
    await writeFile(join(root, ignoredPath), content);
    const ignored = structuredClone(accepted);
    ignored.families[0].evidence.contract = [ignoredPath];
    ignored.families[0].verification.evidenceHashes = Object.fromEntries(
      Object.entries(ignored.families[0].evidence)
        .filter(([kind]) => kind !== "limitations")
        .flatMap(([, paths]) => paths)
        .map((file) => [file, sha256]),
    );
    await expect(validateAcceptedEvidence(root, ignored)).rejects.toThrow(
      /outside formal roots/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
