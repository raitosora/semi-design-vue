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
      "real tarball installation and production dependency audit",
      "built ESM entry import",
      "plain TypeScript declaration consumption",
      "isolated CSS/SCSS theme consumer build and Chromium checks",
      "isolated Popover/Tooltip/Progress/Highlight/Skeleton/Layout/Grid/Space/Divider/Button/ButtonGroup/SplitButtonGroup/IconButton/Spin/LocaleProvider/LocaleConsumer/ConfigProvider/Icon/SVG/locale consumer types, tree shaking, provenance and Chromium checks",
      "public Popover and Tooltip plus patched Foundation fixture tarball in pure Vapor and interop",
    ],
    limitation:
      "Four isolated tarball consumer flows check ESM/declarations, styles, Popover/Tooltip/Progress/Highlight/Skeleton/Layout/Grid/Space/Divider/Button/ButtonGroup/SplitButtonGroup/IconButton/Spin/Locale/ConfigProvider/Icon/resources and patched Foundation fixtures; other public components and full publication acceptance remain unestablished.",
  },
};
await mkdir(join(root, "artifacts"), { recursive: true });
await writeFile(
  join(root, "artifacts/surfaces.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
