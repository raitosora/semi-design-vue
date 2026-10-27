import { expect, test } from "vitest";
import { timelinePosition } from "../../packages/semi-ui-vue/src/components/timeline/position.ts";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
const inputs = JSON.parse(
  await readFile(
    new URL("../../resources/upstream/sources.json", import.meta.url),
    "utf8",
  ),
);
const source = inputs.files["packages/semi-ui/timeline/index.tsx"];
const record = { exports: {} };
class PureComponent {
  constructor(props) {
    this.props = props;
  }
}
runInContext(
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
    },
  }).outputText,
  createContext({
    exports: record.exports,
    module: record,
    require(specifier) {
      if (specifier === "react")
        return { __esModule: true, default: {}, PureComponent };
      if (specifier === "classnames")
        return { __esModule: true, default: () => "" };
      if (specifier === "prop-types")
        return { __esModule: true, default: { oneOf: () => undefined } };
      if (specifier.endsWith("timeline/constants"))
        return {
          cssClasses: { PREFIX: "semi-timeline" },
          strings: { MODE: [] },
        };
      if (specifier.endsWith("timeline.scss")) return {};
      if (
        specifier.endsWith("getDataAttr") ||
        specifier === "../configProvider/context" ||
        specifier === "./item"
      )
        return { __esModule: true, default: {} };
      throw new Error(specifier);
    },
  }),
  { timeout: 1000 },
);
function reference(mode, position, index) {
  return new record.exports.default({ mode }).getPosCls(
    { props: { position } },
    index,
  );
}
test("Timeline position reference is the exact fixed source", () => {
  expect(createHash("sha256").update(source).digest("hex")).toBe(
    "59c31583bf922ced8ff2ed1c478237f5c7f2842e9f867726138dece1b57a079a",
  );
});
for (const mode of [
  "left",
  "right",
  "center",
  "alternate",
  "invalid",
  undefined,
  null,
  false,
  0,
  "",
]) {
  test(`Timeline pinned position precedence for mode=${String(mode)}`, () => {
    for (const position of [
      "left",
      "right",
      "invalid",
      undefined,
      null,
      false,
      0,
      "",
    ]) {
      for (const index of [0, 1, 2, 3, 17]) {
        expect(timelinePosition(mode, position, index)).toBe(
          reference(mode, position, index),
        );
      }
    }
  });
}
