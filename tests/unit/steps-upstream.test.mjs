import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";
import { stepsState } from "../../packages/semi-ui-vue/src/components/steps/state.ts";

const snapshot = JSON.parse(
  readFileSync("resources/upstream/sources.json", "utf8"),
);
const baseline = JSON.parse(
  readFileSync("resources/upstream/baseline.json", "utf8"),
);
const paths = ["basicSteps", "fillSteps", "navSteps"].map(
  (file) => `packages/semi-ui/steps/${file}.tsx`,
);
const esm = (value) => ({ __esModule: true, default: value });
const createElement = (tag, props, ...children) => ({ tag, props, children });
const react = {
  createElement,
  useMemo: (fn) => fn(),
  isValidElement: (child) =>
    child !== null && typeof child === "object" && child.valid === true,
  Children: {
    toArray: (children) =>
      [children]
        .flat(Infinity)
        .filter((child) => child != null && typeof child !== "boolean"),
    map: (children, fn) => children.map(fn),
  },
  cloneElement: (child, props) => ({ ...child, props }),
};
const references = paths.map((path) => {
  const module = { exports: {} };
  const dependencies = {
    react: { ...esm(react), ...react },
    classnames: esm(() => ""),
    "prop-types": esm({}),
    "@douyinfe/semi-foundation/steps/constants": {
      stepsClasses: { PREFIX: "semi-steps", ITEM: "semi-steps-item" },
    },
    "@douyinfe/semi-foundation/utils/getDataAttr": esm(() => ({})),
    "../grid": { Row: "Row", Col: "Col" },
  };
  const code = ts.transpileModule(snapshot.files[path], {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;
  runInContext(
    code,
    createContext({
      module,
      exports: module.exports,
      require(name) {
        if (!(name in dependencies))
          throw new Error(`Unexpected Steps reference dependency: ${name}`);
        return dependencies[name];
      },
    }),
    { timeout: 1000 },
  );
  return module.exports.default;
});
function childrenOf(tree, fill) {
  return fill
    ? tree.children[0].children[0].map((col) => col.children[0])
    : tree.children[0];
}

test("Steps reference checks the exact fixed source hashes and genuine root exports", () => {
  expect(snapshot.upstream.commit).toBe(
    "8bed560dd3f36579f85b7a522f19762f2bace756",
  );
  const sourcePaths = [
    ...paths,
    ...["index", "step", "basicStep", "fillStep", "navStep"].map(
      (name) => `packages/semi-ui/steps/${name}.tsx`,
    ),
    "packages/semi-ui/steps/context.ts",
    "packages/semi-foundation/steps/constants.ts",
  ];
  for (const path of sourcePaths)
    expect(
      createHash("sha256").update(snapshot.files[path]).digest("hex"),
    ).toBe(baseline.inputs[path]);
  expect(snapshot.files["packages/semi-ui/index.ts"]).toMatch(
    /export \{ default as Step \} from '.\/steps\/step'/,
  );
  expect(snapshot.files["packages/semi-ui/index.ts"]).toMatch(
    /export \{ default as Steps \} from '.\/steps'/,
  );
  for (const path of sourcePaths)
    expect(snapshot.files[path]).not.toMatch(/new \w*Foundation\(/);
});

for (const [kind, reference] of references.entries()) {
  const name = ["basic", "fill", "nav"][kind];
  test(`Steps ${name} state and callbacks retain fixed undefined/null/false/zero/nonfinite arithmetic`, () => {
    const values = [
      undefined,
      null,
      false,
      0,
      -2,
      0.5,
      1,
      2,
      NaN,
      Infinity,
      -Infinity,
      "2",
    ];
    for (const current of values)
      for (const initial of values)
        for (const status of [
          undefined,
          null,
          false,
          "",
          "process",
          "error",
          "warning",
        ]) {
          const callbacks = [];
          const props = {
            current,
            initial,
            status,
            prefixCls: "custom",
            onChange: (value) => callbacks.push(value),
          };
          const items = [undefined, null, false, "", "warning"].map(
            (status) => ({
              valid: true,
              props: { status, className: "child" },
            }),
          );
          const output = childrenOf(
            reference({ ...props, children: items }),
            kind === 1,
          );
          for (const [index, item] of items.entries()) {
            const actual = stepsState(props, item.props, index);
            if (kind !== 2) {
              expect(actual.status).toBe(output[index].props.status);
              expect(actual.className).toBe(output[index].props.className);
              expect(`${actual.position + 1}`).toBe(
                output[index].props.stepNumber,
              );
            }
            if (kind === 0) {
              expect(actual.active).toBe(output[index].props.active);
              expect(actual.done).toBe(output[index].props.done);
            }
            if (kind === 2)
              expect(output[index].props.active).toBe(index === actual.current);
            callbacks.length = 0;
            output[index].props.onChange();
            expect(callbacks).toEqual(
              index !== actual.current ? [index + actual.initial] : [],
            );
          }
        }
  });
  test(`Steps ${name} reference ignores primitive/empty/sparse children and overrides explicit collaboration fields`, () => {
    for (const children of [
      undefined,
      null,
      false,
      0,
      [],
      Array(4),
      [false, null, , 0, "text"],
    ]) {
      expect(childrenOf(reference({ children }), kind === 1)).toEqual([]);
    }
    const item = {
      valid: true,
      props: {
        status: "warning",
        stepNumber: "custom",
        size: undefined,
        active: true,
        done: true,
        index: 7,
        total: 8,
        onChange: () => {
          throw new Error("must be overwritten");
        },
      },
    };
    const [result] = childrenOf(
      reference({
        children: [null, item],
        initial: 2,
        current: 0,
        size: "small",
      }),
      kind === 1,
    );
    expect(result.props.status).toBe("warning");
    expect(result.props.onChange).toBeUndefined();
    if (kind !== 2) expect(result.props.stepNumber).toBe("custom");
    if (kind === 0) {
      expect(result.props.size).toBeUndefined();
      expect(result.props.active).toBe(false);
      expect(result.props.done).toBe(false);
    }
    if (kind === 2) {
      expect(result.props.index).toBe(7);
      expect(result.props.total).toBe(8);
      expect(result.props.active).toBe(true);
    }
  });
}
