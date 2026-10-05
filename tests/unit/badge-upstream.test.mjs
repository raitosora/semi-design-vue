import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";

const snapshot = JSON.parse(
  readFileSync("resources/upstream/sources.json", "utf8"),
);
const upstream = snapshot.files["packages/semi-ui/badge/index.tsx"];
const expectedHash =
  "c72f1b007f803d4b1902ac1e5aee1ae9fb95c8b1ef4dfd4a53d7fa762f438483";
const native = readFileSync(
  "packages/semi-ui-vue/src/components/badge/Badge.tsx",
  "utf8",
);
const nativeInput = readFileSync(
  "packages/semi-ui-vue/src/components/badge/input.ts",
  "utf8",
);

// Test-only dependency shims record render expressions. They do not render DOM,
// emulate Vapor ownership, or duplicate Badge's classification/overflow rules.
function classes(...values) {
  return values
    .flatMap((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return classes(...value).split(" ");
      if (typeof value === "object")
        return Object.entries(value)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);
      return [String(value)];
    })
    .filter(Boolean)
    .join(" ");
}
function element(type, props, ...children) {
  return { type, props: props ?? {}, children };
}
function evaluate(source, dependencies, globals = {}) {
  const exported = {};
  const realm = createContext({
    exports: exported,
    React: { createElement: element },
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected Badge reference dependency: ${name}`);
    },
    ...globals,
  });
  runInContext(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
      },
    }).outputText,
    realm,
    { timeout: 1000 },
  );
  return exported;
}

class Component {
  constructor(props) {
    this.props = props;
  }
}
const Reference = evaluate(upstream, {
  react: { default: { createElement: element }, PureComponent: Component },
  "prop-types": {
    default: new Proxy({}, { get: () => () => undefined }),
  },
  classnames: { default: classes },
  lodash: {
    isNumber: (value) =>
      typeof value === "number" ||
      Object.prototype.toString.call(value) === "[object Number]",
    isString: (value) =>
      typeof value === "string" ||
      Object.prototype.toString.call(value) === "[object String]",
    noop: () => undefined,
  },
  "../configProvider/context": { default: {} },
  "@douyinfe/semi-foundation/badge/constants": {
    cssClasses: { PREFIX: "semi-badge" },
    strings: { TYPE_SET: [], THEME_SET: [], POS_SET: [] },
  },
  "@douyinfe/semi-foundation/badge/badge.scss": {},
}).default;
function reference(raw = {}, direction = "ltr") {
  const props = { ...Reference.defaultProps, ...raw };
  for (const [name, value] of Object.entries(Reference.defaultProps))
    if (props[name] === undefined) props[name] = value;
  const instance = new Reference(props);
  instance.context = { direction };
  return instance.render();
}
function candidate(props = {}, direction = "ltr", slots = {}) {
  const Native = evaluate(native, {
    vue: {
      computed: (getter) => ({
        get value() {
          return getter();
        },
      }),
      defineVaporComponent: (setup) => setup,
      onBeforeUnmount: () => undefined,
      useAttrs: () => ({}),
      useSlots: () => slots,
    },
    "../../context/index.js": {
      useSemiContext: () => ({ value: { direction } }),
    },
    "./input.js": evaluate(nativeInput, {}),
    "./render.js": { BadgeContentView: "OwnedBadgeContent" },
  }).default;
  return Native(props);
}
function countOf(root) {
  expect(root.type).toBe("span");
  expect(root.children).toHaveLength(2);
  const count = root.children[1];
  expect(count.type).toBe("span");
  expect(count.props["x-semi-prop"]).toBe("count");
  return count;
}
function view(root) {
  const count = countOf(root);
  const content = count.children[0];
  return {
    outer: classes(root.props.className ?? root.props.class),
    classes: classes(count.props.className ?? count.props.class)
      .split(" ")
      .sort(),
    style: count.props.style,
    content:
      content?.type === "OwnedBadgeContent" ? content.props.content : content,
  };
}

test("Badge oracle reads the fixed source and retains every actual default without a 99 threshold", () => {
  expect(snapshot.upstream.commit).toBe(
    "8bed560dd3f36579f85b7a522f19762f2bace756",
  );
  expect(snapshot.upstream.version).toBe("2.103.0");
  expect(createHash("sha256").update(upstream).digest("hex")).toBe(
    expectedHash,
  );
  expect(Object.keys(Reference.defaultProps).sort()).toEqual([
    "className",
    "dot",
    "onClick",
    "onMouseEnter",
    "onMouseLeave",
    "theme",
    "type",
  ]);
  expect(Reference.defaultProps).toMatchObject({
    dot: false,
    type: "primary",
    theme: "solid",
    className: "",
  });
  expect(view(reference({ count: 1000 })).content).toBe("1000");
  expect(view(candidate())).toEqual(view(reference()));
  expect(Object.getOwnPropertyNames(Reference.prototype)).toEqual([
    "constructor",
    "render",
  ]);
});

test("Badge native numeric expressions match the frozen render across signed, fractional and non-finite boundaries", () => {
  for (const count of [
    0,
    -0,
    -3,
    -0.5,
    0.5,
    1,
    98,
    99,
    100,
    NaN,
    Infinity,
    -Infinity,
  ])
    for (const overflowCount of [
      undefined,
      0,
      -0,
      -2,
      0.5,
      1,
      99,
      100,
      NaN,
      Infinity,
      -Infinity,
    ]) {
      const props = { count, overflowCount, children: "base" };
      expect(view(candidate(props)), `${count}/${overflowCount}`).toEqual(
        view(reference(props)),
      );
    }
  for (const [count, overflowCount, expected] of [
    [100, undefined, "100"],
    [100, 0, "100"],
    [99, 99, "99"],
    [100, 99, "99+"],
    [0, -1, "-1+"],
    [1.25, 1.2, "1.2+"],
    [NaN, 1, "NaN"],
    [Infinity, 99, "99+"],
    [Infinity, Infinity, "Infinity"],
    [-Infinity, -1, "-Infinity"],
    [0, -Infinity, "-Infinity+"],
  ])
    expect(view(reference({ count, overflowCount })).content).toBe(expected);
});

test("Badge null, boolean and text classification is independent of visible text and dot wins content", () => {
  const cases = [
    [undefined, false, false],
    [null, false, false],
    [false, true, false],
    [true, false, true],
    ["", true, false],
    ["100", true, false],
    [0, true, false],
  ];
  for (const [count, hasCount, custom] of cases)
    for (const dot of [false, true]) {
      const props = { count, dot, overflowCount: 1 };
      const expected = view(reference(props));
      expect(view(candidate(props))).toEqual(expected);
      expect(expected.classes.includes("semi-badge-count")).toBe(
        hasCount && !dot,
      );
      expect(expected.classes.includes("semi-badge-custom")).toBe(custom);
      expect(expected.classes.includes("semi-badge-primary")).toBe(!custom);
      expect(expected.classes.includes("semi-badge-solid")).toBe(!custom);
      expect(expected.classes.includes("semi-badge-dot")).toBe(dot);
      if (dot) expect(expected.content).toBeNull();
    }
  expect(view(reference({ count: "100", overflowCount: 1 })).content).toBe(
    "100",
  );
});

test("Badge custom input controls classes even with dot without probing a native renderer", () => {
  let calls = 0;
  const renderer = () => {
    calls += 1;
    return null;
  };
  const reactElement = Object.freeze({ type: "custom-node" });
  for (const dot of [false, true]) {
    const expected = view(reference({ count: reactElement, dot }));
    const actual = view(candidate({ count: renderer, dot }));
    expect(actual.classes).toEqual(expected.classes);
    expect(actual.classes).toContain("semi-badge-custom");
    expect(actual.classes).not.toContain("semi-badge-primary");
    expect(actual.classes).not.toContain("semi-badge-count");
    expect(actual.content).toBe(dot ? null : renderer);
    expect(expected.content).toBe(dot ? null : reactElement);
  }
  expect(calls).toBe(0);
});

test("Badge all six types and three themes match the fixed source with undefined defaults", () => {
  for (const type of [
    undefined,
    "primary",
    "secondary",
    "tertiary",
    "danger",
    "warning",
    "success",
  ])
    for (const theme of [undefined, "solid", "light", "inverted"])
      for (const dot of [undefined, false, true]) {
        const props = { count: 5, type, theme, dot, className: undefined };
        expect(view(candidate(props))).toEqual(view(reference(props)));
      }
});

test("Badge style belongs to the count span and truthy style completely overrides countStyle", () => {
  const countStyle = { backgroundColor: "red", color: "white" };
  const style = { color: "blue" };
  const empty = {};
  for (const [input, selected] of [
    [undefined, countStyle],
    [null, countStyle],
    [false, countStyle],
    ["", countStyle],
    [style, style],
    [empty, empty],
  ]) {
    const props = { count: 5, style: input, countStyle };
    const expectedRoot = reference(props);
    const actualRoot = candidate(props);
    expect(expectedRoot.props).not.toHaveProperty("style");
    expect(actualRoot.props).not.toHaveProperty("style");
    expect(countOf(expectedRoot).props.style).toBe(selected);
    expect(countOf(actualRoot).props.style).toBe(selected);
  }
  expect(style).toEqual({ color: "blue" });
  expect(countStyle).toEqual({ backgroundColor: "red", color: "white" });
});

test("Badge standalone classes use input truthiness and declared native slots remain anchored when empty", () => {
  for (const [children, anchored] of [
    [undefined, false],
    [null, false],
    [false, false],
    [0, false],
    ["", false],
    [true, true],
    [-1, true],
    ["base", true],
  ]) {
    const props = { children, count: 5 };
    const expected = view(reference(props));
    expect(view(candidate(props))).toEqual(expected);
    expect(expected.classes.includes("semi-badge-block")).toBe(!anchored);
    expect(expected.classes.includes("semi-badge-rightTop")).toBe(anchored);
  }
  let calls = 0;
  const emptySlot = () => {
    calls += 1;
    return null;
  };
  const expected = view(reference({ children: [], count: 5 }));
  expect(view(candidate({ count: 5 }, "ltr", { default: emptySlot }))).toEqual(
    expected,
  );
  expect(view(candidate({ children: emptySlot, count: 5 }))).toEqual(expected);
  expect(calls).toBe(0);
});

test("Badge undefined position follows context while all four explicit positions remain physical", () => {
  for (const direction of ["ltr", "rtl", undefined, null])
    for (const position of [
      undefined,
      "leftTop",
      "leftBottom",
      "rightTop",
      "rightBottom",
    ]) {
      const props = { children: "base", count: 5, position };
      expect(view(candidate(props, direction))).toEqual(
        view(reference(props, direction)),
      );
    }
  expect(view(reference({ children: "base" }, "rtl")).classes).toContain(
    "semi-badge-leftTop",
  );
  expect(
    view(reference({ children: "base", position: "rightTop" }, "rtl")).classes,
  ).toContain("semi-badge-rightTop");
  expect(
    view(reference({ children: "base", position: null })).classes,
  ).not.toContain("semi-badge-rightTop");
});

test("Badge preserves safe runtime coercions and boxed numeric/text classification from the fixed source", () => {
  for (const props of [
    { count: 100, overflowCount: "99" },
    { count: 5, overflowCount: null },
    { count: 5, type: null },
    { count: 5, theme: "unknown" },
    { count: 5, children: "base", position: null },
    { count: 5, children: "base", position: "" },
    { count: 5, dot: "yes" },
    { count: Object(5) },
  ])
    expect(view(candidate(props))).toEqual(view(reference(props)));
  expect(view(reference({ count: 100, overflowCount: "99" })).content).toBe(
    "99+",
  );
  expect(view(reference({ count: 5, overflowCount: null })).content).toBe("5");
  expect(view(reference({ count: 5, type: null })).classes).toContain(
    "semi-badge-null",
  );
  expect(view(reference({ count: Object(5) })).content).toBe("5");
  const boxedText = Object("x");
  const text = view(reference({ count: boxedText }));
  expect(text.classes).toContain("semi-badge-count");
  expect(text.content).toBe(boxedText);
  const nativeText = view(candidate({ count: boxedText }));
  expect(nativeText.classes).toEqual(text.classes);
  expect(nativeText.content).toBe(boxedText.valueOf());
});

test("Badge source forwards root callbacks and attrs without inventing a11y or keyboard behavior", () => {
  const calls = [];
  const callback = (event) => {
    calls.push(event);
    return false;
  };
  const root = reference({
    count: 5,
    onClick: callback,
    onMouseEnter: callback,
    onMouseLeave: callback,
    className: "outer",
    countClassName: "inner",
    id: "badge",
    "aria-label": "updates",
  });
  expect(root.props.onClick).toBe(callback);
  expect(root.props.onMouseEnter).toBe(callback);
  expect(root.props.onMouseLeave).toBe(callback);
  expect(root.props.id).toBe("badge");
  expect(root.props["aria-label"]).toBe("updates");
  expect(root.props.className).toBe("semi-badge outer");
  expect(view(root).classes).toContain("inner");
  expect(root.props).not.toHaveProperty("count");
  for (const name of [
    "role",
    "aria-live",
    "aria-hidden",
    "tabIndex",
    "onKeyDown",
    "title",
  ])
    expect(root.props).not.toHaveProperty(name);
  const event = {};
  expect(root.props.onClick(event)).toBe(false);
  expect(calls).toEqual([event]);
});
