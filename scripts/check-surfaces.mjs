import { access, readdir, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
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
const documentationPaths = ["docs/.vitepress", "docs/src", "docs/examples"];
const present = (
  await Promise.all(
    documentationPaths.map(async (path) =>
      (await exists(path)) ? path : null,
    ),
  )
).filter(Boolean);
if (present.length)
  throw new Error(
    `Documentation surface found (${present.join(", ")}); configure its real compiler, strict types, links and production build checks before enabling it.`,
  );
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
    status: "not-applicable",
    reason: "No documentation site or executable documentation examples exist.",
  },
  consumer: {
    status: "limited",
    checks: [
      "built ESM entry import",
      "plain TypeScript declaration consumption",
    ],
    limitation:
      "Current packages export version only; tarball installation, public components, production dependency closure and consumer bundling are not established.",
  },
};
await mkdir(join(root, "artifacts"), { recursive: true });
await writeFile(
  join(root, "artifacts/surfaces.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
