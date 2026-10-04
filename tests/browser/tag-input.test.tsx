import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Tag from "../../packages/semi-ui-vue/src/components/tag/Tag.js";
import {
  safeTagAttrs,
  tagCallbacks,
  validateTagProps,
} from "../../packages/semi-ui-vue/src/components/tag/input.js";
import type { TagProps } from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Tag rejects invalid runtime input at its boundary", () => {
  for (const props of [
    { size: 1 },
    { color: "tomato" },
    { type: "bad" },
    { shape: null },
    { avatarShape: "bad" },
    { closable: "yes" },
    { visible: null },
    { colorful: 1 },
    { gradient: [] },
    { children: {} },
    { prefixIcon: [] },
    { suffixIcon: Symbol() },
    { onClose: [() => undefined, 1] },
    { onClick: false },
    { onKeyDown: "bad" },
    { onMouseEnter: {} },
    { avatarSrc: 1 },
    { tagKey: NaN },
    { tagKey: {} },
    { tabIndex: Infinity },
    { tabIndex: "0" },
  ])
    expect(() => validateTagProps(props as unknown as TagProps)).toThrow();
  for (const props of [
    {},
    { children: null, prefixIcon: false, suffixIcon: 0 },
    { tagKey: 0, tabIndex: -1 },
    { avatarSrc: null },
    { onClick: [() => undefined, () => undefined] },
  ])
    expect(() => validateTagProps(props as unknown as TagProps)).not.toThrow();
  expect(tagCallbacks(undefined)).toEqual([]);
  expect(tagCallbacks(null)).toEqual([]);
});

test("Tag filters forced unsafe DOM attributes and rejects string event injection", () => {
  const callback = vi.fn();
  expect(
    safeTagAttrs({
      ".innerHTML": "unsafe",
      "^text-content": "unsafe",
      outerHTML: "unsafe",
      ref: callback,
      visible: true,
      onclick: "bad",
      onBlur: [callback, "bad"],
      onFocus: [callback],
      onClick: callback,
      id: "safe",
      "aria-label": "safe",
    }),
  ).toEqual({
    onFocus: [callback],
    onClick: callback,
    id: "safe",
    "aria-label": "safe",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag
        {...({
          ".innerHTML": "<b>unsafe</b>",
          onclick: "bad",
          "^outerHTML": "bad",
        } as TagProps)}
        children="safe"
      />
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("safe");
    expect(fixture.host.querySelector("b")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Tag captures global defaults per instance and merges native callback arrays exactly once", async () => {
  const previous = semiGlobal.config;
  const first = vi.fn();
  const second = vi.fn();
  const enter = vi.fn();
  semiGlobal.configure({
    overrideDefaultProps: { Tag: { size: "large", color: "blue" } },
  });
  const props = shallowRef<TagProps>({ children: "one" });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Tag
        {...props.value}
        {...{ onClick: first }}
        {...{ onClick: second }}
        onMouseEnter={enter}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(root.classList.contains("semi-tag-large")).toBe(true);
    semiGlobal.configure({ overrideDefaultProps: { Tag: { size: "small" } } });
    props.value = { children: "two", size: undefined, color: undefined };
    await nextTick();
    expect(root.classList.contains("semi-tag-large")).toBe(true);
    expect(root.classList.contains("semi-tag-blue-light")).toBe(true);
    root.click();
    root.dispatchEvent(new MouseEvent("mouseenter"));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(Tag.__SemiComponentName__).toBe("Tag");
  } finally {
    fixture.unmount();
    semiGlobal.configure(previous);
  }
});

test("Tag compares clickability with its captured global default callback identity", async () => {
  const previous = semiGlobal.config;
  const captured = vi.fn();
  const replacement = vi.fn();
  const explicit = vi.fn();
  semiGlobal.configure({
    overrideDefaultProps: { Tag: { onClick: captured } },
  });
  const props = shallowRef<TagProps>({ children: "defaults" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  let secondFixture: ReturnType<typeof mountVapor> | undefined;
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(root.getAttribute("role")).toBeNull();
    expect(root.hasAttribute("tabindex")).toBe(false);
    root.click();
    expect(captured).toHaveBeenCalledTimes(1);
    const passive = new KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
    });
    root.dispatchEvent(passive);
    expect(passive.defaultPrevented).toBe(false);
    expect(captured).toHaveBeenCalledTimes(1);
    props.value = { children: "explicit", onClick: explicit };
    await nextTick();
    expect(root.getAttribute("role")).toBe("button");
    const active = new KeyboardEvent("keydown", {
      key: "Enter",
      cancelable: true,
    });
    root.dispatchEvent(active);
    expect(active.defaultPrevented).toBe(true);
    expect(explicit.mock.calls).toEqual([[active]]);
    semiGlobal.configure({
      overrideDefaultProps: { Tag: { onClick: replacement } },
    });
    props.value = { children: "same captured callback", onClick: captured };
    await nextTick();
    expect(root.getAttribute("role")).toBeNull();
    for (const nextProps of [
      { children: "undefined", onClick: undefined },
      { children: "removed" },
    ]) {
      props.value = nextProps;
      await nextTick();
      expect(root.getAttribute("role")).toBeNull();
      expect(root.hasAttribute("tabindex")).toBe(false);
      root.click();
    }
    expect(captured).toHaveBeenCalledTimes(3);
    expect(replacement).not.toHaveBeenCalled();
    props.value = { children: "closable", closable: true };
    await nextTick();
    expect(root.getAttribute("role")).toBe("button");
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", cancelable: true }),
    );
    expect(captured).toHaveBeenCalledTimes(4);
    secondFixture = mountVapor(
      defineVaporComponent(() => <Tag children="new instance" />),
    );
    const secondRoot =
      secondFixture.host.querySelector<HTMLElement>(".semi-tag")!;
    expect(secondRoot.getAttribute("role")).toBeNull();
    secondRoot.click();
    expect(replacement).toHaveBeenCalledTimes(1);
  } finally {
    secondFixture?.unmount();
    fixture.unmount();
    semiGlobal.configure(previous);
  }
});

test.each([undefined, null])(
  "Tag captured empty global click default %s stays passive",
  (onClick) => {
    const previous = semiGlobal.config;
    semiGlobal.configure({
      overrideDefaultProps: {
        Tag: { onClick: onClick as TagProps["onClick"] },
      },
    });
    const fixture = mountVapor(
      defineVaporComponent(() => <Tag children="empty callback" />),
    );
    try {
      const root = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
      expect(root.getAttribute("role")).toBeNull();
      expect(root.hasAttribute("tabindex")).toBe(false);
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        cancelable: true,
      });
      root.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      root.click();
    } finally {
      fixture.unmount();
      semiGlobal.configure(previous);
    }
  },
);
