import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const manifest = JSON.parse(
  await readFile(
    new URL("../../resources/locale/manifest.json", import.meta.url),
    "utf8",
  ),
);

describe("generated locale runtime data", () => {
  it("loads every manifest language with usable currency, code, and date-fns locale functions", async () => {
    const modules = import.meta.glob(
      "../../packages/semi-ui-vue/src/locale/source/*.ts",
      { eager: true, import: "default" },
    );
    const expected = manifest.files.map(
      (file) => `../../packages/semi-ui-vue/src/locale/${file.path}`,
    );
    expect(Object.keys(modules).sort()).toEqual([...expected].sort());
    for (const locale of Object.values(modules)) {
      expect(locale.code).toMatch(/\S/);
      expect(locale.currency).toMatch(/\S/);
      expect(locale.dateFnsLocale.localize.month(0, { width: "wide" })).toMatch(
        /\S/,
      );
      expect(locale.dateFnsLocale.formatLong.date({ width: "short" })).toMatch(
        /\S/,
      );
    }
  });
});
