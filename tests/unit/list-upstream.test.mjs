import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test, vi } from "vitest";
const files = JSON.parse(
  readFileSync("resources/upstream/sources.json", "utf8"),
).files;
const hashes = {
  "index.tsx":
    "c8be1d2cb6c5936547979215c556d8df2a31af108029b20a087f5b7a389478a2",
  "item.tsx":
    "e3a2a05a2c44ad4deb06cd0255c08ac33411b2bfdf2eba01763f44380dd8a40d",
};
// Minimal host records the source-created element tree; it is not a React renderer.
function reference(file) {
  const source = files[`packages/semi-ui/list/${file}`];
  expect(createHash("sha256").update(source).digest("hex")).toBe(hashes[file]);
  class Component {
    constructor(props) {
      this.props = props;
    }
    getDataAttr(props) {
      return Object.fromEntries(
        Object.entries(props).filter(([key]) => key.startsWith("data-")),
      );
    }
  }
  const createElement = (type, props, ...children) => ({
    type,
    props: { ...props, children },
  });
  const React = {
    createElement,
    createContext: () => ({ Provider: "Provider" }),
    Children: {
      forEach(items, visit) {
        let index = 0;
        const walk = (item) => {
          if (Array.isArray(item)) {
            for (const value of item) walk(value);
          } else
            visit(
              item == null || typeof item === "boolean" ? null : item,
              index++,
            );
        };
        walk(items);
      },
    },
    cloneElement: (child, props) => ({ ...child, key: props.key }),
  };
  const exports = {};
  runInContext(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
      },
    }).outputText,
    createContext({
      exports,
      require(name) {
        if (name === "react")
          return { default: React, PureComponent: Component };
        if (name === "prop-types")
          return { default: new Proxy({}, { get: () => () => undefined }) };
        if (name === "classnames") return { default: (...parts) => parts };
        if (name === "lodash") return { noop() {} };
        if (name.endsWith("/constants"))
          return {
            cssClasses: { PREFIX: "semi-list" },
            strings: { ALIGN: [], LAYOUT: [], SIZE: [] },
          };
        if (name.endsWith("/getDataAttr"))
          return { default: Component.prototype.getDataAttr };
        if (name === "../_base/baseComponent") return { default: Component };
        if (name === "../grid") return { Row: "Row", Col: "Col" };
        if (name === "./list-context")
          return { default: { Provider: "Provider" } };
        if (["./item", "../spin", "../locale/localeConsumer"].includes(name))
          return { default: name };
        if (name.endsWith(".scss")) return {};
        throw new Error(`Unexpected List source dependency: ${name}`);
      },
    }),
    { timeout: 1000 },
  );
  return exports.default;
}
function list(props = {}) {
  const List = reference("index.tsx");
  return new List({ ...List.defaultProps, ...props });
}
function body(tree) {
  return tree.props.children[1].props.children[0].props.children[0];
}
test("fixed List defaults, no Foundation and data then children ordering", () => {
  const List = reference("index.tsx");
  expect(List.defaultProps).toMatchObject({
    bordered: false,
    split: true,
    loading: false,
    layout: "vertical",
    size: "default",
  });
  const renderItem = vi.fn((value, index) => ({
    key: index === 0 ? "custom" : "",
    value,
  }));
  const tree = list({
    dataSource: ["a", "b"],
    renderItem,
    children: "tail",
  }).render();
  expect(renderItem.mock.calls).toEqual([
    ["a", 0],
    ["b", 1],
  ]);
  expect(body(tree).props.children).toEqual([
    [
      { key: "custom", value: "a" },
      { key: "list-item-1", value: "b" },
    ],
    "tail",
  ]);
  expect(tree.props.children[1].type).toBe("Provider");
  expect(tree.props.children[1].props.children[0].props).toMatchObject({
    size: "large",
    spinning: false,
  });
});
test("fixed List truthy region gates, children zero and nonempty data without renderer", () => {
  for (const value of [null, false, 0, "", undefined]) {
    const instance = list({
      header: value,
      footer: value,
      loadMore: value,
      emptyContent: value,
      children: value,
    });
    const tree = instance.render();
    expect(tree.props.children[0]).toBeNull();
    expect(tree.props.children[2]).toBeNull();
    expect(tree.props.children[3]).toBeNull();
    expect(body(tree).props.children[0].type).toBe("../locale/localeConsumer");
    expect(body(tree).props.children[1]).toBe(value);
  }
  for (const value of [[], [1]]) {
    const tree = list({
      header: value,
      footer: value,
      loadMore: value,
      emptyContent: value,
    }).render();
    expect(tree.props.children[0].type).toBe("div");
    expect(tree.props.children[2].type).toBe("div");
    expect(body(tree).props.children[0].props["x-semi-prop"]).toBe(
      "emptyContent",
    );
  }
  expect(
    body(list({ dataSource: Array(2) }).render()).props.children[0],
  ).toEqual([]);
});
test("fixed List map and child.key expressions reject holes, empty leaves and invalid map inputs", () => {
  const renderItem = (item) => item;
  for (const dataSource of [
    Array(2),
    [null],
    [undefined],
    [false],
    [true],
    { length: 1 },
    "abc",
  ])
    expect(() => list({ dataSource, renderItem }).render()).toThrow();
  expect(() => list({ dataSource: [1], renderItem: true }).render()).toThrow();
  expect(
    body(list({ dataSource: [1], renderItem: () => [] }).render()).props
      .children[0],
  ).toEqual([]);
});
test("fixed List grid uses inherited row fields and explicit undefined while Item removes those four from Col", () => {
  const grid = Object.assign(Object.create({ gutter: 8 }), {
    type: undefined,
    span: 12,
    style: { padding: 1 },
  });
  const row = list({ grid }).wrapChildren("data", "children");
  expect(row.type).toBe("Row");
  expect(row.props).toMatchObject({
    type: undefined,
    gutter: 8,
    children: ["data", "children"],
  });
  expect(row.props.span).toBeUndefined();
  for (const value of [true, 1, "grid"])
    expect(() => list({ grid: value }).wrapChildren(null, null)).toThrow();
  const Item = reference("item.tsx");
  const item = new Item({});
  item.context = { grid };
  const col = item.wrapWithGrid("item");
  expect(col.props).toEqual({
    span: 12,
    style: { padding: 1 },
    children: ["item"],
  });
});
test("fixed Item uses own truthy callbacks, data-only attrs, truthy body/extra and context requirement", () => {
  const Item = reference("item.tsx");
  const parent = vi.fn();
  const own = vi.fn();
  const item = new Item({
    ...Item.defaultProps,
    onClick: own,
    onRightClick: null,
    header: 0,
    main: false,
    extra: 0,
    children: 0,
    id: "ignored",
    "data-test": "item",
  });
  item.context = { onClick: parent, onRightClick: parent };
  const li = item.render();
  expect(li.type).toBe("li");
  expect(li.props.onClick).toBe(own);
  expect(li.props.onContextMenu).toBe(parent);
  expect(li.props.children).toEqual([null, 0, null]);
  expect(li.props.id).toBeUndefined();
  expect(li.props["data-test"]).toBe("item");
  item.props = { header: [], main: [], extra: [] };
  expect(item.render().props.children[0].type).toBe("div");
  expect(item.render().props.children[2].type).toBe("div");
  item.context = null;
  expect(() => item.render()).toThrow();
});
