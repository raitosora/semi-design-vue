import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";
import {
  breadcrumbCollapse,
  genBreadcrumbRoutes,
  notifyBreadcrumbItem,
  expandBreadcrumbOnKeyPress,
} from "../../packages/semi-ui-vue/src/components/breadcrumb/input.ts";

const snapshot = JSON.parse(
  readFileSync("resources/upstream/sources.json", "utf8"),
);
const baseline = JSON.parse(
  readFileSync("resources/upstream/baseline.json", "utf8"),
);
const paths = [
  "packages/semi-foundation/breadcrumb/foundation.ts",
  "packages/semi-foundation/breadcrumb/itemFoundation.ts",
  "packages/semi-foundation/utils/isEnterPress.ts",
  "packages/semi-ui/breadcrumb/index.tsx",
];
const compiled = new Map(
  paths.map((path) => [
    path,
    ts.transpileModule(snapshot.files[path], {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
      },
    }).outputText,
  ]),
);
class Base {
  constructor(adapter) {
    this._adapter = adapter;
  }
}
const esm = (value) => ({ __esModule: true, default: value });
function evaluate(path, dependencies) {
  const module = { exports: {} };
  runInContext(
    compiled.get(path),
    createContext({
      exports: module.exports,
      module,
      require(name) {
        if (!(name in dependencies))
          throw new Error(`Unexpected fixed source dependency: ${name}`);
        return dependencies[name];
      },
    }),
    { timeout: 1000 },
  );
  return module.exports.default;
}
function foundations() {
  const enter = evaluate(paths[2], {
    lodash: { get: (event, key) => (event == null ? undefined : event[key]) },
    "./keyCode": { ENTER_KEY: "Enter" },
  });
  return {
    Root: evaluate(paths[0], {
      "../base/foundation": esm(Base),
      "../utils/isEnterPress": esm(enter),
    }),
    Item: evaluate(paths[1], { "../base/foundation": esm(Base) }),
  };
}
function rootReference(props) {
  const type = new Proxy(() => undefined, { get: () => () => undefined });
  const createElement = (tag, props, ...children) => ({ tag, props, children });
  const Root = evaluate(paths[3], {
    react: esm({ createElement, createContext: () => ({}) }),
    classnames: esm(() => ""),
    "prop-types": esm(type),
    "@douyinfe/semi-foundation/breadcrumb/constants": {
      cssClasses: { PREFIX: "semi-breadcrumb" },
      strings: { MORE_TYPE: [] },
    },
    "@douyinfe/semi-foundation/breadcrumb/foundation": esm(foundations().Root),
    "@douyinfe/semi-foundation/utils/warning": esm(() => undefined),
    lodash: { isFunction: (value) => typeof value === "function" },
    "@douyinfe/semi-foundation/breadcrumb/breadcrumb.scss": {},
    "@douyinfe/semi-foundation/utils/function": { noop: () => undefined },
    "../_base/baseComponent": esm(
      class {
        constructor(props) {
          this.props = props;
        }
      },
    ),
    "../popover": esm("Popover"),
    "./item": esm("Item"),
    "./bread-context": esm({}),
    "@douyinfe/semi-icons": { IconMore: "IconMore" },
  });
  return new Root(props);
}
const plain = (value) => JSON.parse(JSON.stringify(value));
function outcome(call) {
  try {
    return { value: plain(call()) };
  } catch (error) {
    return { error: error.name };
  }
}

test("Breadcrumb reference inputs retain the fixed SHA and exact source bytes", () => {
  expect(snapshot.upstream.commit).toBe(
    "8bed560dd3f36579f85b7a522f19762f2bace756",
  );
  for (const path of paths)
    expect(
      createHash("sha256").update(snapshot.files[path]).digest("hex"),
    ).toBe(baseline.inputs[path]);
  expect(snapshot.files[paths[2]]).toContain("from 'lodash'");
  expect(snapshot.files[paths[3]]).not.toContain("OverflowList");
});

test("Breadcrumb route normalization matches the fixed Foundation, including holes and invalid runtime values", () => {
  const { Root } = foundations();
  const source = new Root({});
  const inherited = Object.create({ name: "prototype" });
  for (const value of [
    [],
    Array(3),
    ["a", , "b"],
    [{ name: "x", href: "#x", key: "x" }],
    [null],
    [undefined],
    [false, 0, "", NaN],
    [{ _origin: { name: "override" }, name: "outer" }],
    [inherited],
    null,
    undefined,
    false,
    0,
    "abc",
    { length: 2 },
  ]) {
    expect(outcome(() => genBreadcrumbRoutes(value))).toEqual(
      outcome(() => source.genRoutes(value)),
    );
  }
  const route = { name: "identity" };
  expect(genBreadcrumbRoutes([route])[0]._origin).toBe(route);
  const sparse = genBreadcrumbRoutes([, "x"]);
  expect(0 in sparse).toBe(false);
});

for (const maximum of [
  4,
  1,
  0,
  -1,
  2.5,
  -0.5,
  NaN,
  Infinity,
  -Infinity,
  null,
  false,
  "2",
  undefined,
]) {
  test(`Breadcrumb collapse follows fixed slice/splice semantics for limit ${String(maximum)}`, () => {
    for (const length of [0, 1, 3, 6]) {
      const all = Array.from({ length }, (_, index) => index);
      let rest;
      const source = rootReference({
        maxItemCount: maximum,
        renderMore: (value) => {
          rest = value;
          return null;
        },
      });
      const result = breadcrumbCollapse(length, maximum, true, true);
      expect(result.collapsed).toBe(length > maximum);
      if (result.collapsed) {
        const output = source.handleCollapse([...all], length);
        expect(result.rest).toEqual(rest);
        expect(result.removed).toEqual(
          all.filter((index) => !output.includes(index)),
        );
      } else expect(result.rest).toEqual([]);
      expect(breadcrumbCollapse(length, maximum, false, true).collapsed).toBe(
        false,
      );
      expect(breadcrumbCollapse(length, maximum, true, false).collapsed).toBe(
        false,
      );
    }
  });
}

test("Breadcrumb Item calls its own listener before parent with the same info and native event", () => {
  const { Item } = foundations();
  const info = { name: "item" };
  const event = { type: "click", defaultPrevented: false };
  const expected = [];
  const actual = [];
  new Item({
    notifyClick: (...args) => expected.push(["own", ...args]),
    notifyParent: (...args) => expected.push(["parent", ...args]),
  }).handleClick(info, event);
  notifyBreadcrumbItem(
    info,
    event,
    (...args) => actual.push(["own", ...args]),
    (...args) => actual.push(["parent", ...args]),
  );
  expect(actual).toEqual(expected);
  expect(actual[0][1]).toBe(info);
  expect(actual[1][2]).toBe(event);
  const calls = [];
  expect(() =>
    notifyBreadcrumbItem(
      info,
      event,
      () => {
        throw new Error("stop");
      },
      () => calls.push("parent"),
    ),
  ).toThrow("stop");
  expect(calls).toEqual([]);
});

test("Breadcrumb expansion recognizes only the fixed Enter keypress predicate", () => {
  const { Root } = foundations();
  for (const event of [
    { key: "Enter" },
    { key: " " },
    { key: "Escape" },
    { keyCode: 13 },
    { key: "Enter", defaultPrevented: true },
    { key: "Enter", ctrlKey: true },
  ]) {
    let expected = 0;
    let actual = 0;
    new Root({ expandCollapsed: () => expected++ }).handleExpandEnterPress(
      event,
    );
    expandBreadcrumbOnKeyPress(event, () => actual++);
    expect(actual).toBe(expected);
  }
});
