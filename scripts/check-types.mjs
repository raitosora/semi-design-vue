import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const required = [
  "tests/types/tsconfig.source.json",
  "tests/types/tsconfig.macro-negative.json",
  "tests/types/tsconfig.declaration.json",
  "tests/types/StrictFixture.tsx",
  "tests/types/positive.tsx",
  "tests/types/negative.tsx",
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
