import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import {
  generateResources,
  checkGeneratedResources,
} from "../../scripts/generate-resources.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
test("SVG generation is repeatable, matches committed outputs and rejects output drift", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "semi-svg-generation-"));
  try {
    const first = await generateResources({ outputRoot: temporary });
    const second = await generateResources({ outputRoot: temporary });
    expect(second).toEqual(first);
    await checkGeneratedResources(root, first);
    await checkGeneratedResources(temporary, first);
    const file = [...first.keys()].find((name) => name.endsWith(".tsx"));
    await writeFile(join(temporary, file), "changed");
    await expect(checkGeneratedResources(temporary, first)).rejects.toThrow(
      /drift/,
    );
    await writeFile(join(temporary, file), first.get(file));
    const extra = join(temporary, "packages/semi-icons-vue/src/icons/extra");
    await mkdir(extra);
    await expect(checkGeneratedResources(temporary, first)).rejects.toThrow(
      /drift/,
    );
    await rm(extra, { recursive: true });
    await rm(join(temporary, file));
    await expect(checkGeneratedResources(temporary, first)).rejects.toThrow(
      /drift/,
    );
    expect(
      await readFile(join(root, "resources/svg/manifest.json"), "utf8"),
    ).toContain("2.103.0");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}, 120_000);
