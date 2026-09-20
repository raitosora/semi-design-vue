import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildUpstreamInventory } from "../../scripts/upstream-inventory.mjs";

describe("buildUpstreamInventory", () => {
  it("reports invalid, empty, duplicate and syntactically invalid inputs without inventing coverage", () => {
    expect(() => buildUpstreamInventory()).toThrow(
      "files must be a plain object",
    );
    expect(() => buildUpstreamInventory({})).toThrow("root entrypoint");
    expect(() =>
      buildUpstreamInventory({ "../escape.ts": "export {}" }),
    ).toThrow("invalid repository-relative");
    expect(() =>
      buildUpstreamInventory({
        "packages/semi-ui/index.ts":
          "export { default as One } from './one'; export { default as One } from './one';",
        "packages/semi-ui/one.ts": "export default One;",
      }),
    ).toThrow("duplicate root export");
    expect(() =>
      buildUpstreamInventory({
        "packages/semi-ui/index.ts": "export const = ;",
      }),
    ).toThrow("unable to parse");
    expect(() =>
      buildUpstreamInventory({
        "packages/semi-ui/index.ts": "export {}",
        "packages/semi-ui/package.json": "{",
      }),
    ).toThrow("invalid package manifest");
  });

  it("resolves aliases and re-exports, identifies families, types, static APIs and resource/package surfaces", () => {
    const inventory = buildUpstreamInventory({
      "packages/semi-ui/index.ts": [
        "export { default as Form } from './form';",
        "export { Widget as Renamed } from './widget';",
        "export type { RootType } from './types';",
      ].join("\n"),
      "packages/semi-ui/form/index.tsx": [
        "import Input from './input';",
        "export class FormCore { static useForm() {} static defaultProps = {}; }",
        "const Form = Object.assign(FormCore, { Input, useForm: FormCore.useForm });",
        "Form.Section = Input;",
        "export default Form;",
      ].join("\n"),
      "packages/semi-ui/form/input.tsx": "export default function Input() {}",
      "packages/semi-ui/widget.ts": "export { Widget } from './widget-base';",
      "packages/semi-ui/widget-base.ts": "export const Widget = () => null;",
      "packages/semi-ui/types.ts":
        "export interface RootType { a: string }; export type Props = { x?: number };",
      "packages/semi-ui/package.json": JSON.stringify({
        exports: {
          ".": { types: "./index.d.ts", import: "./index.js" },
          "./locale/*": {
            types: "./locale/*.d.ts",
            import: { node: "./locale/*.node.js", default: "./locale/*.js" },
            require: null,
          },
        },
        typesVersions: { "*": { "locale/*": ["locale/*.d.ts"] } },
        main: "./legacy.cjs",
        module: "./index.js",
        types: "./index.d.ts",
      }),
      "packages/semi-ui/form/form.scss": ".form {}",
      "packages/semi-icons/icon.svg": "<svg />",
    });
    expect(inventory.root.namedExports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Form",
          resolvedPath: "packages/semi-ui/form/index.tsx",
        }),
        expect.objectContaining({
          name: "Renamed",
          localName: "Widget",
          resolvedPath: "packages/semi-ui/widget-base.ts",
        }),
      ]),
    );
    expect(inventory.root.typeExports).toEqual([
      expect.objectContaining({ name: "RootType" }),
    ]);
    expect(inventory.moduleFamilies.map((family) => family.name)).toEqual([
      "form",
      "types",
      "widget",
    ]);
    expect(inventory.staticApis.Form.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Input",
          category: "subcomponent",
          syntax: "Object.assign",
        }),
        expect.objectContaining({
          name: "Section",
          category: "subcomponent",
          syntax: "assignment",
        }),
        expect.objectContaining({ name: "useForm", category: "api" }),
      ]),
    );
    expect(
      inventory.staticApis.Form.members.map((item) => item.name),
    ).not.toContain("defaultProps");
    expect(inventory.typeDeclarations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "RootType",
          declarationKind: "interface",
        }),
        expect.objectContaining({ name: "Props", declarationKind: "type" }),
      ]),
    );
    expect(inventory.packageSurfaces[0].exports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subpath: "./locale/*",
          conditions: expect.arrayContaining(["types", "import"]),
          leaves: expect.arrayContaining([
            expect.objectContaining({
              conditions: ["import", "node"],
              target: "./locale/*.node.js",
            }),
            expect.objectContaining({
              conditions: ["require"],
              target: null,
              blocked: true,
            }),
          ]),
        }),
      ]),
    );
    expect(inventory.packageSurfaces[0].legacyEntrypoints).toEqual({
      main: "./legacy.cjs",
      module: "./index.js",
      types: "./index.d.ts",
      typings: null,
    });
  });

  it("preserves conditional export target pairing and rejects invalid condition trees", () => {
    const base = { "packages/semi-ui/index.ts": "export {}" };
    const left = buildUpstreamInventory({
      ...base,
      "packages/semi-ui/package.json": JSON.stringify({
        exports: { ".": { import: "./a.js", require: "./b.cjs" } },
      }),
    });
    const right = buildUpstreamInventory({
      ...base,
      "packages/semi-ui/package.json": JSON.stringify({
        exports: { ".": { import: "./b.cjs", require: "./a.js" } },
      }),
    });
    expect(left.packageSurfaces[0].exports[0].leaves).not.toEqual(
      right.packageSurfaces[0].exports[0].leaves,
    );
    expect(() =>
      buildUpstreamInventory({
        ...base,
        "packages/semi-ui/package.json": JSON.stringify({
          exports: { ".": ["./bad.js"] },
        }),
      }),
    ).toThrow("invalid package export");
  });

  it("parses the locked official root snapshot without executing upstream code", () => {
    const snapshot = JSON.parse(
      readFileSync(
        new URL("../../resources/upstream/sources.json", import.meta.url),
        "utf8",
      ),
    );
    const files = snapshot.files ?? snapshot.upstream?.files;
    expect(files).toBeTruthy();
    const inventory = buildUpstreamInventory(files);
    expect(inventory.root.namedExports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Form" }),
        expect.objectContaining({ name: "Toast" }),
        expect.objectContaining({ name: "semiGlobal" }),
      ]),
    );
    expect(inventory.moduleFamilies.length).toBeGreaterThan(70);
    expect(inventory.staticApis.Form.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "useForm",
          category: "api",
          syntax: "assignment",
        }),
        expect.objectContaining({ name: "Input", category: "subcomponent" }),
      ]),
    );
    expect(inventory.staticApis.getConfigureItem).toBeUndefined();
    expect(inventory.staticApis.Modal.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "confirm", category: "api" }),
        expect.objectContaining({
          name: "__SemiComponentName__",
          category: "metadata",
        }),
        expect.objectContaining({
          name: "getDerivedStateFromProps",
          category: "lifecycle",
        }),
      ]),
    );
    expect(inventory.staticApis.Toast.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "create", syntax: "factory-return" }),
      ]),
    );
  }, 30000);
});
