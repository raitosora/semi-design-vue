import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  inspectDocumentationSurface,
  requiredDocumentationPaths,
  runDocumentationCommand,
  runDocumentationChecks,
} from "../../scripts/documentation-surface.mjs";

const roots = [];
async function fixture(paths = []) {
  const root = await mkdtemp(join(tmpdir(), "semi-documentation-surface-"));
  roots.push(root);
  await Promise.all(
    paths.map(async (path) => {
      const target = join(root, path);
      if (path === "website/examples" || path === "website/src") {
        await mkdir(target, { recursive: true });
        return;
      }
      await mkdir(join(target, ".."), { recursive: true });
      await writeFile(target, "");
    }),
  );
  return root;
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

describe("documentation surface", () => {
  it("rejects missing website even when local planning docs exist", async () => {
    const root = await fixture(["docs/development-plan.md"]);

    await expect(inspectDocumentationSurface(root)).rejects.toThrow(
      `Documentation surface is incomplete; missing: ${requiredDocumentationPaths.join(", ")}.`,
    );
  });

  it("rejects partial website input", async () => {
    const root = await fixture(["website/src/index.md"]);

    await expect(inspectDocumentationSurface(root)).rejects.toThrow(
      "Documentation surface is incomplete",
    );
  });

  it("rejects required website paths with the wrong file types", async () => {
    const root = await fixture(requiredDocumentationPaths);
    await rm(join(root, "website/src"), { recursive: true });
    await writeFile(join(root, "website/src"), "");
    await rm(join(root, "website/check.mjs"));
    await mkdir(join(root, "website/check.mjs"));

    await expect(inspectDocumentationSurface(root)).rejects.toThrow(
      "missing: website/src, website/check.mjs",
    );
  });

  it("runs the required documentation check only for a complete surface", async () => {
    const root = await fixture(requiredDocumentationPaths);
    const calls = [];

    await expect(
      runDocumentationChecks(root, async (command, options) => {
        calls.push({ command, options });
      }),
    ).resolves.toEqual({ status: "checked" });
    expect(calls).toEqual([
      { command: ["pnpm", "check:docs"], options: { cwd: root } },
    ]);
  });

  it("propagates a failing documentation check", async () => {
    const root = await fixture(requiredDocumentationPaths);

    await expect(
      runDocumentationChecks(root, async () => {
        throw new Error("documentation check failed");
      }),
    ).rejects.toThrow("documentation check failed");
  });
});

describe("documentation command", () => {
  it("resolves after a successful child process", async () => {
    await expect(
      runDocumentationCommand([process.execPath, "-e", "process.exit(0)"], {
        cwd: process.cwd(),
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects a nonzero child process", async () => {
    await expect(
      runDocumentationCommand([process.execPath, "-e", "process.exit(7)"], {
        cwd: process.cwd(),
      }),
    ).rejects.toMatchObject({
      code: 7,
      message: expect.stringContaining("exit code 7"),
    });
  });

  it("rejects when the child process cannot start", async () => {
    await expect(
      runDocumentationCommand(["documentation-command-that-does-not-exist"], {
        cwd: process.cwd(),
      }),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
