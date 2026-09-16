import { access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await access(new URL("../website/check.mjs", import.meta.url));
execFileSync(process.execPath, ["website/check.mjs"], {
  cwd: root,
  stdio: "inherit",
});
