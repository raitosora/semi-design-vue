import { stat } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

export const requiredDocumentationPaths = [
  "website/.vitepress/config.ts",
  "website/examples",
  "website/src",
  "website/check.mjs",
  "website/tsconfig.json",
  "website/playwright.config.ts",
];

const requiredDirectories = new Set(["website/examples", "website/src"]);

async function isRequiredPath(path, root) {
  try {
    const entry = await stat(join(root, path));
    return requiredDirectories.has(path) ? entry.isDirectory() : entry.isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function inspectDocumentationSurface(root) {
  const present = await Promise.all(
    requiredDocumentationPaths.map((path) => isRequiredPath(path, root)),
  );
  const missing = requiredDocumentationPaths.filter(
    (_, index) => !present[index],
  );
  if (missing.length)
    throw new Error(
      `Documentation surface is incomplete; missing: ${missing.join(", ")}.`,
    );
  return { status: "available" };
}

export function runDocumentationCommand(command, options) {
  const [file, ...arguments_] = command;
  return new Promise((resolve, reject) => {
    const child = spawn(file, arguments_, { ...options, stdio: "inherit" });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0) return resolve();
      const result = signal ? `signal ${signal}` : `exit code ${code}`;
      const error = new Error(`Documentation command failed with ${result}.`);
      error.code = code;
      error.signal = signal;
      reject(error);
    });
  });
}

export async function runDocumentationChecks(
  root,
  run = runDocumentationCommand,
) {
  await inspectDocumentationSurface(root);
  await run(["pnpm", "check:docs"], { cwd: root });
  return { status: "checked" };
}
