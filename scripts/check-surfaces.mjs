import { access, readdir, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { runDocumentationChecks } from "./documentation-surface.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await rm(join(root, "artifacts/surfaces.json"), { force: true });
async function exists(path) {
  try {
    await access(join(root, path));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
const packages = (
  await readdir(join(root, "packages"), { withFileTypes: true })
).filter((entry) => entry.isDirectory());
if (!packages.length) throw new Error("No package sources found.");
for (const entry of packages) {
  if (!(await exists(`packages/${entry.name}/src/index.ts`)))
    throw new Error(`Missing source entry: ${entry.name}`);
}
if (!(await exists("playground/src/main.tsx")))
  throw new Error("Missing executable playground.");
const documentation = await runDocumentationChecks(root);
const report = {
  source: {
    status: "configured",
    packages: packages.map((entry) => entry.name),
    checks: [
      "lint",
      "strict types",
      "per-file coverage",
      "dependency policy",
      "production build",
    ],
  },
  demo: {
    status: "configured",
    path: "playground",
    checks: ["strict types", "build", "Chromium interaction"],
  },
  documentation: {
    ...documentation,
    checks: ["pnpm check:docs"],
  },
  consumer: {
    status: "limited",
    checks: [
      "built ESM entry import",
      "plain TypeScript declaration consumption",
      "isolated CSS/SCSS theme consumer build and Chromium checks",
      "isolated SVG/locale consumer types, tree shaking, provenance and Chromium checks",
    ],
    limitation:
      "Manifest and built ESM/declaration consumption, style/theme builds and SVG/locale runtime consumers are verified; tarball installation, public components and full publication acceptance remain unestablished.",
  },
};
await mkdir(join(root, "artifacts"), { recursive: true });
await writeFile(
  join(root, "artifacts/surfaces.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
