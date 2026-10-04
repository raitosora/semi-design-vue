import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";

const files = JSON.parse(
  readFileSync("resources/upstream/sources.json", "utf8"),
).files;
const hashes = {
  "index.tsx":
    "697fa6c15441aa536c0699fdbc434ade6e66f61681263083189fd6f7e629a782",
  "group.tsx":
    "a9ac11ecc436d0753d996bceb88b912dbd6265be692a8d7ef25a78ea321dc318",
};
function reference(file) {
  const source = files[`packages/semi-ui/tag/${file}`];
  expect(createHash("sha256").update(source).digest("hex")).toBe(hashes[file]);
  class Component {
    constructor(props) {
      this.props = props;
    }
    setState(next) {
      this.state = { ...this.state, ...next };
    }
  }
  const exported = {};
  const realm = createContext({
    exports: exported,
    require(name) {
      if (name === "react")
        return { default: {}, Component, PureComponent: Component };
      if (name === "prop-types")
        return { default: new Proxy({}, { get: () => () => undefined }) };
      if (name === "classnames") return { default: () => "" };
      if (name === "lodash")
        return { isString: (value) => typeof value === "string" };
      if (name === "../_utils")
        return {
          getDefaultPropsFromGlobalConfig: (_name, defaults) => defaults,
        };
      if (name.endsWith("/constants"))
        return {
          cssClasses: { PREFIX: "semi-tag" },
          strings: {
            TAG_COLOR: ["grey"],
            TAG_SIZE: ["default", "small", "large"],
            TAG_TYPE: ["light", "solid", "ghost"],
            AVATAR_SHAPE: ["square", "circle"],
          },
        };
      if (name.endsWith("/a11y"))
        return {
          handlePrevent: (event) => {
            event.stopPropagation();
            event.preventDefault();
          },
        };
      if (
        [
          "../avatar/index",
          "../popover/index",
          "./index",
          "./interface",
          "@douyinfe/semi-icons",
          "@douyinfe/semi-foundation/tag/tag.scss",
        ].includes(name)
      )
        return { default: {} };
      throw new Error(`Unexpected reference dependency: ${name}`);
    },
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
  return exported.default;
}

test("fixed Tag close stops both propagation paths, ignores returns and uses defaultPrevented", () => {
  const Tag = reference("index.tsx");
  expect(Tag.defaultProps.size).toBe("default");
  for (const result of [undefined, false, true, null, 0]) {
    for (const prevent of [false, true]) {
      const calls = [];
      const event = {
        defaultPrevented: false,
        stopPropagation: () => calls.push("stop"),
        nativeEvent: {
          stopImmediatePropagation: () => calls.push("immediate"),
        },
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      const tag = new Tag({
        onClose: (...args) => {
          calls.push(args);
          if (prevent) event.preventDefault();
          return result;
        },
      });
      tag.close(event, "text", 0);
      expect(calls).toEqual(["stop", "immediate", ["text", event, 0]]);
      expect(tag.state.visible).toBe(prevent);
    }
  }
});

test("fixed Tag controlled undefined stays controlled and close errors interrupt hiding", () => {
  const Tag = reference("index.tsx");
  expect(Tag.getDerivedStateFromProps({ visible: undefined })).toEqual({
    visible: undefined,
  });
  expect(Tag.getDerivedStateFromProps({})).toBeNull();
  const event = {
    stopPropagation() {},
    nativeEvent: { stopImmediatePropagation() {} },
  };
  const tag = new Tag({ visible: true });
  tag.close(event, null, undefined);
  expect(tag.state.visible).toBe(true);
  const failure = new Error("callback");
  const throwing = new Tag({
    onClose() {
      throw failure;
    },
  });
  expect(() => throwing.close(event, null, undefined)).toThrow(failure);
  expect(throwing.state.visible).toBe(true);
});

test("fixed Tag keyboard callback order prevents only after close and has no Space activation", () => {
  const Tag = reference("index.tsx");
  for (const key of [
    "Delete",
    "Backspace",
    "Enter",
    "Escape",
    " ",
    "ArrowRight",
  ]) {
    const calls = [];
    const event = {
      key,
      defaultPrevented: false,
      stopPropagation() {},
      nativeEvent: { stopImmediatePropagation() {} },
      preventDefault() {
        this.defaultPrevented = true;
      },
      target: { blur: () => calls.push("blur") },
    };
    const tag = new Tag({
      closable: true,
      children: "text",
      tagKey: "k",
      onClose: (_value, e) => calls.push(["close", e.defaultPrevented]),
      onClick: (e) => calls.push(["click", e.defaultPrevented]),
      onKeyDown: (e) => calls.push(["key", e.defaultPrevented]),
    });
    tag.handleKeyDown(event);
    expect(calls).toEqual(
      key === "Escape"
        ? ["blur", ["key", false]]
        : ["Delete", "Backspace", "Enter"].includes(key)
          ? [
              [key === "Enter" ? "click" : "close", false],
              ["key", true],
            ]
          : [["key", false]],
    );
  }
});

test("fixed Group folds by count arithmetic and never removes caller data", () => {
  const Group = reference("group.tsx");
  for (const max of [0, 1, 3, 5, -1, 1.5, NaN, Infinity, null]) {
    for (const rest of [undefined, 0, 2, -1, NaN]) {
      const tags = ["a", "b", "c"];
      const group = new Group({
        tagList: tags,
        maxTagCount: max,
        restCount: rest,
      });
      group.renderNTag = (n, hidden) => ({ n, hidden });
      const n = rest ? rest : tags.length - max;
      expect(group.renderMergeTags(tags)).toEqual(
        n > 0 ? [...tags.slice(0, max), { n, hidden: tags.slice(max) }] : tags,
      );
      expect(tags).toEqual(["a", "b", "c"]);
    }
  }
});
