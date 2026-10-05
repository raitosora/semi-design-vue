import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const required = [
  "tests/consumer/tsconfig.source.json",
  "tests/consumer/consumer.ts",
  "tests/types/tsconfig.source.json",
  "tests/types/tsconfig.macro-negative.json",
  "tests/types/tsconfig.declaration.json",
  "tests/types/StrictFixture.tsx",
  "tests/types/positive.tsx",
  "tests/types/negative.tsx",
  "tests/types/badge-positive.tsx",
  "tests/types/badge-negative.tsx",
  "tests/types/tag-positive.tsx",
  "tests/types/tag-negative.tsx",
  "tests/types/tag-group-positive.tsx",
  "tests/types/tag-group-negative.tsx",
  "tests/types/avatar-positive.tsx",
  "tests/types/avatar-negative.tsx",
  "tests/types/overflowList-positive.tsx",
  "tests/types/overflowList-negative.tsx",
  "tests/types/collapsible-positive.tsx",
  "tests/types/collapsible-negative.tsx",
  "tests/types/popover-positive.tsx",
  "tests/types/popover-negative.tsx",
  "tests/types/tooltip-positive.tsx",
  "tests/types/tooltip-negative.tsx",
];

for (const file of required) {
  if (!existsSync(resolve(root, file)))
    throw new Error(`Missing strict type fixture: ${file}`);
}

function runTypecheck(command, config) {
  execFileSync("pnpm", ["exec", command, "-p", config], {
    cwd: root,
    stdio: "inherit",
  });
}

const generated = resolve(root, "artifacts/types");
rmSync(generated, { recursive: true, force: true });
try {
  runTypecheck("tsmc", "tests/consumer/tsconfig.source.json");
  // Additional call-site check, separate from the full declaration check above:
  // Vue rc.9's own declarations are not exact-optional compatible.
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsmc",
      "-p",
      "tests/consumer/tsconfig.source.json",
      "--exactOptionalPropertyTypes",
      "--skipLibCheck",
    ],
    { cwd: root, stdio: "inherit" },
  );
  runTypecheck("tsmc", "tests/types/tsconfig.source.json");
  runTypecheck("tsmc", "tests/types/tsconfig.macro-negative.json");
  runTypecheck("tsmc", "tests/types/tsconfig.declaration.json");
  cpSync(
    resolve(root, "tests/types/positive.tsx"),
    join(generated, "consumer.tsx"),
  );
  cpSync(
    resolve(root, "tests/types/negative.tsx"),
    join(generated, "negative.tsx"),
  );
  writeFileSync(
    join(generated, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tests/types/tsconfig.base.json",
        compilerOptions: { noEmit: true },
        files: ["StrictFixture.d.ts", "consumer.tsx", "negative.tsx"],
      },
      null,
      2,
    ),
  );
  runTypecheck("tsc", join(generated, "tsconfig.json"));
  console.log("Strict TS-Macro and generated-declaration consumers passed.");
} finally {
  rmSync(generated, { recursive: true, force: true });
}
