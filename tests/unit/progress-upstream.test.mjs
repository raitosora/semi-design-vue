import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { selectStroke } from "../../packages/semi-ui-vue/src/components/progress/color.ts";

const root = new URL("../../", import.meta.url);
const sha = "8bed560dd3f36579f85b7a522f19762f2bace756";
const sourcePath = "packages/semi-foundation/progress/generates.ts";
const sourceHash =
  "a422e33b92c749d33df5204ca7c0fa9f69ca047e96d24419b73a96c2cdfb2d24";
const inputs = JSON.parse(
  await readFile(new URL("resources/upstream/sources.json", root), "utf8"),
);
const baseline = JSON.parse(
  await readFile(new URL("resources/upstream/baseline.json", root), "utf8"),
);
const source = inputs.files[sourcePath];
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
const moduleRecord = { exports: {} };
const tokenValues = {
  "--semi-red-5": "249, 57, 32",
  "--semi-black": "0, 0, 0",
  "--semi-light-green-8": "12, 80, 16",
};
const getComputedStyle = () => ({
  getPropertyValue: (name) => tokenValues[name] ?? "",
});
const context = createContext({
  exports: moduleRecord.exports,
  module: moduleRecord,
  window: {},
  document: { body: {} },
  getComputedStyle,
  require(specifier) {
    if (specifier === "./constants")
      return { strings: { STROKE_DEFAULT: "var(--semi-color-success)" } };
    throw new Error(`Unexpected upstream import: ${specifier}`);
  },
});
runInContext(compiled, context, { timeout: 1000 });
const reference = (stroke, percent, gradient) =>
  moduleRecord.exports.generateColor(
    stroke?.map((entry) => entry && { ...entry }),
    percent,
    gradient,
  );

describe("Progress color adapter versus pinned Foundation source", () => {
  it("checks immutable source identity and local provenance", async () => {
    expect(inputs.upstream.commit).toBe(sha);
    expect(baseline.upstream.commit).toBe(sha);
    expect(createHash("sha256").update(source).digest("hex")).toBe(sourceHash);
    expect(baseline.inputs[sourcePath]).toBe(sourceHash);
    const local = await readFile(
      new URL("packages/semi-ui-vue/src/components/progress/color.ts", root),
      "utf8",
    );
    expect(local).toContain(sourcePath);
    expect(local).toContain(sha);
    expect(local).not.toMatch(
      /from\s+["'](?:lodash|react|@douyinfe\/semi-foundation)/,
    );
  });

  it("matches hex, RGB/HSL, legacy alpha, token and malformed color behavior", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { body: {} });
    vi.stubGlobal("getComputedStyle", getComputedStyle);
    try {
      for (const color of [
        "#123",
        "#123456",
        "#12345678",
        " #AABBCC ",
        "rgb(1, 2, 3)",
        "rgba(255, 0, 0, 0.5)",
        "rgba(0, 99, 167, 1)",
        "hsl(0, 50%, 50%)",
        "hsl(60, 50%, 50%)",
        "hsl(120, 50%, 50%)",
        "hsl(180, 50%, 50%)",
        "hsl(240, 50%, 50%)",
        "hsl(300, 50%, 50%)",
        "hsl(360, 50%, 50%)",
        "hsla(125, 50%, 46% / 1)",
        "hsla(5, 5%, 5% / 0.5)",
        "red",
        "black",
        "light-green-8",
        "unknown",
        "",
        "!",
        "#12",
        "rgba(999, 999, 999, 2)",
        null,
      ]) {
        const stroke = [{ percent: 0, color }];
        expect(selectStroke(stroke, 0, false), String(color)).toBe(
          reference(stroke, 0, false),
        );
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("matches numeric boundaries, duplicate thresholds and deterministic gradient intervals", () => {
    const inputs = [
      undefined,
      [],
      [{ percent: 0, color: "#12345678" }],
      [
        { percent: 50, color: "#fff" },
        { percent: 52, color: "rgba(0,0,0,0)" },
      ],
      [
        { percent: 60, color: "#ffffff" },
        { percent: -10, color: "#123456" },
        { percent: 60, color: "#987654" },
      ],
      [
        { percent: NaN, color: "#fff" },
        { percent: 0, color: "#000" },
      ],
    ];
    for (const stroke of inputs)
      for (const percent of [
        -Infinity,
        -20,
        -10,
        -0.1,
        0,
        0.5,
        49.5,
        50,
        51,
        52,
        59.5,
        60,
        100,
        101,
        Infinity,
        NaN,
      ])
        for (const gradient of [false, true])
          expect(selectStroke(stroke, percent, gradient)).toBe(
            reference(stroke, percent, gradient),
          );
    for (let index = 0; index < 120; index++) {
      const stroke = [
        {
          percent: -5 + (index % 7),
          color: `#${(index * 991 + 0x103020).toString(16).padStart(6, "0")}`,
        },
        {
          percent: 90 + (index % 13),
          color: index % 2 ? "#f9392080" : "#46259e",
        },
      ];
      const percent = index - 10 + (index % 3) / 3;
      for (const gradient of [false, true])
        expect(selectStroke(stroke, percent, gradient)).toBe(
          reference(stroke, percent, gradient),
        );
    }
  });
});
