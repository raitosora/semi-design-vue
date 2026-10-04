import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import type {
  AvatarProps,
  AvatarRenderResult,
} from "../../packages/semi-ui-vue/src/components/avatar/types.js";
import {
  AvatarContentView,
  nativeAvatarContent,
} from "../../packages/semi-ui-vue/src/components/avatar/render.js";
import {
  avatarScale,
  validateAvatarProps,
} from "../../packages/semi-ui-vue/src/components/avatar/input.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Avatar validates malformed public inputs without allocating DOM resources", () => {
  for (const props of [
    { size: 4 },
    { shape: null },
    { color: "white" },
    { gap: -1 },
    { gap: NaN },
    { gap: Infinity },
    { src: 4 },
    { srcSet: {} },
    { alt: 4 },
    { children: {} },
    { onError: [] },
    { onClick: [() => undefined, 3] },
    { onMouseEnter: "bad" },
    { onMouseLeave: true },
    { imgAttr: [] },
    { topSlot: 3 },
    { bottomSlot: "bad" },
    { topSlot: { render: 3 } },
    { bottomSlot: { render: false } },
    { border: [] },
    { border: "bad" },
  ]) {
    expect(() =>
      validateAvatarProps(props as unknown as AvatarProps),
    ).toThrow();
  }
  for (const props of [
    {},
    { gap: 0 },
    { children: 0 },
    { src: null, srcSet: null, alt: null },
    { topSlot: null, bottomSlot: null, border: null },
    { onClick: [() => undefined, () => undefined] },
  ])
    expect(() =>
      validateAvatarProps(props as unknown as AvatarProps),
    ).not.toThrow();
});

test("Avatar fixed Foundation scaling formula keeps zero and over-gap boundaries", () => {
  expect(avatarScale(0, 50, 3, 0.4)).toBe(0.4);
  expect(avatarScale(50, 0, 3, 0.4)).toBe(0.4);
  expect(avatarScale(6, 40, 3, 0.4)).toBe(0.4);
  expect(avatarScale(5, 40, 3, 0.4)).toBe(0.4);
  expect(avatarScale(50, 44, 3, 0.4)).toBe(1);
  expect(avatarScale(50, 20, 3, 0.4)).toBe(1);
  expect(avatarScale(50, 88, 3, 1)).toBe(0.5);
});

test("Avatar default overrides are captured and undefined restores the captured value", async () => {
  const previous = semiGlobal.config;
  semiGlobal.configure({
    overrideDefaultProps: { Avatar: { size: "small", color: "blue", gap: 5 } },
  });
  const props = shallowRef<AvatarProps>({ children: "A" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-avatar")!;
    expect(root.classList.contains("semi-avatar-small")).toBe(true);
    semiGlobal.configure({
      overrideDefaultProps: { Avatar: { size: "large" } },
    });
    props.value = { children: "B", size: "default", color: "red" };
    await nextTick();
    expect(root.classList.contains("semi-avatar-default")).toBe(true);
    props.value = { children: "C", size: undefined, color: undefined };
    await nextTick();
    expect(root.classList.contains("semi-avatar-small")).toBe(true);
    expect(root.classList.contains("semi-avatar-blue")).toBe(true);
    expect(Avatar.elementType).toBe("Avatar");
    expect("Group" in Avatar).toBe(false);
  } finally {
    fixture.unmount();
    semiGlobal.configure(previous);
  }
});

test("Avatar top bottom border defaults and supported size gates are live", async () => {
  const props = shallowRef<AvatarProps>({
    children: "A",
    border: { color: "red", motion: true },
    contentMotion: true,
    topSlot: {
      text: "top",
      className: "top",
      textColor: "blue",
      style: { opacity: 0.7 },
    },
    bottomSlot: {
      text: "bottom",
      shape: "square",
      bgColor: "red",
      textColor: "white",
      className: "bottom",
      style: { opacity: 0.5 },
    },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    expect(
      fixture.host.querySelectorAll(".semi-avatar-additionalBorder"),
    ).toHaveLength(2);
    expect(
      fixture.host.querySelector<HTMLElement>(".semi-avatar-additionalBorder")
        ?.style.borderColor,
    ).toBe("red");
    expect(
      fixture.host.querySelector(".semi-avatar-top_slot-content")?.textContent,
    ).toBe("top");
    expect(
      fixture.host.querySelector(".semi-avatar-bottom_slot")?.textContent,
    ).toBe("bottom");
    const id = fixture.host.querySelector("linearGradient")!.id;
    expect(fixture.host.querySelector("path")!.getAttribute("fill")).toBe(
      `url(#${id})`,
    );
    props.value = { ...props.value, shape: "square", border: true };
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-avatar-top_slot-wrapper"),
    ).toBeNull();
    expect(
      fixture.host.querySelectorAll(".semi-avatar-additionalBorder"),
    ).toHaveLength(1);
    expect(
      fixture.host.querySelector(".semi-avatar-bottom_slot"),
    ).not.toBeNull();
    for (const size of ["extra-extra-small", "70px"]) {
      props.value = { ...props.value, size };
      await nextTick();
      expect(fixture.host.querySelector(".semi-avatar-bottom_slot")).toBeNull();
    }
    props.value = { children: 0 };
    await nextTick();
    expect(fixture.host.textContent).toBe("0");
    expect(fixture.host.querySelector(".semi-avatar-wrapper")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Avatar renderer replacement disposes only its owned native tree", async () => {
  let mounts = 0;
  let unmounts = 0;
  const text = ref("one");
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <button>{text.value}</button>;
  });
  const render = shallowRef<() => AvatarRenderResult>(() => (
    <>
      <Child />
      <i>tail</i>
    </>
  ));
  const props = shallowRef<AvatarProps>({ children: "A" });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Avatar {...props.value} topSlot={{ render: render.value }} />
    )),
  );
  try {
    const button = fixture.host.querySelector("button");
    expect(mounts).toBe(1);
    text.value = "two";
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(button?.textContent).toBe("two");
    render.value = () => <em>replacement</em>;
    await nextTick();
    expect(unmounts).toBe(1);
    expect(fixture.host.querySelector("button")).toBeNull();
    expect(fixture.host.querySelector("em")?.textContent).toBe("replacement");
  } finally {
    fixture.unmount();
  }
});

test("Avatar native renderer primitives remain text and asynchronous values are rejected", async () => {
  const content = shallowRef<() => AvatarRenderResult>(() => [
    "<img src=x>",
    0,
    null,
    false,
    ["tail"],
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => <AvatarContentView content={content.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("<img src=x>0tail");
    expect(fixture.host.querySelector("img")).toBeNull();
    content.value = () => undefined;
    await nextTick();
    expect(fixture.host.textContent).toBe("");
    expect(() =>
      nativeAvatarContent(
        Promise.resolve("bad") as unknown as AvatarRenderResult,
      ),
    ).toThrow("synchronous");
    expect(() =>
      nativeAvatarContent(
        Promise.reject(new Error("bad")) as unknown as AvatarRenderResult,
      ),
    ).toThrow("synchronous");
    await Promise.resolve();
  } finally {
    fixture.unmount();
  }
});

test("Avatar hover callback observes the committed mask and merged listeners are ordered", async () => {
  const calls: string[] = [];
  const first = vi.fn(() => calls.push("first"));
  const second = vi.fn(() => calls.push("second"));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Avatar
        children="A"
        hoverMask="mask"
        {...{ onMouseEnter: first }}
        {...{ onMouseEnter: second }}
        onMouseLeave={() => calls.push("leave")}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-avatar")!;
    root.dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    expect(calls).toEqual(["first", "second"]);
    expect(fixture.host.querySelector(".semi-avatar-hover")?.textContent).toBe(
      "mask",
    );
    root.dispatchEvent(new MouseEvent("mouseleave"));
    await nextTick();
    expect(calls).toEqual(["first", "second", "leave"]);
  } finally {
    fixture.unmount();
  }
});

test("Avatar image native keyboard and focus overrides are called once", async () => {
  const source =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
  const click = vi.fn();
  const key = vi.fn();
  const focus = vi.fn();
  const blur = vi.fn();
  const props = shallowRef<AvatarProps>({
    src: source,
    alt: "avatar",
    onClick: click,
    imgAttr: {
      alt: "override",
      tabindex: 3,
      onKeydown: key,
      onFocus: focus,
      onBlur: blur,
    },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    const image = fixture.host.querySelector("img")!;
    expect(image.alt).toBe("override");
    expect(image.tabIndex).toBe(0);
    image.focus();
    image.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(click).toHaveBeenCalledTimes(1);
    image.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Space", bubbles: true }),
    );
    expect(click).toHaveBeenCalledTimes(1);
    image.blur();
    expect(key).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    expect(blur).not.toHaveBeenCalled();
    props.value = { ...props.value, onClick: undefined };
    await nextTick();
    expect(fixture.host.querySelector("img")).toBe(image);
    expect(image.tabIndex).toBe(3);
    image.focus();
    image.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    image.blur();
    expect(key).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
});

test("Avatar decorative SVG identifiers are unique across apps and stable on updates", async () => {
  const text = ref("first");
  const Component = defineVaporComponent(() => (
    <Avatar
      children="A"
      topSlot={{ text: text.value, gradientStart: "red", gradientEnd: "blue" }}
    />
  ));
  const first = mountVapor(Component);
  const second = mountVapor(Component);
  try {
    const ids = [
      ...first.host.querySelectorAll("[id]"),
      ...second.host.querySelectorAll("[id]"),
    ].map((node) => node.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    text.value = "updated";
    await nextTick();
    expect(
      first.host.querySelector(".semi-avatar-top_slot-content")?.textContent,
    ).toBe("updated");
    expect(
      [
        ...first.host.querySelectorAll("[id]"),
        ...second.host.querySelectorAll("[id]"),
      ].map((node) => node.id),
    ).toEqual(ids);
    expect(first.host.querySelector("stop")?.getAttribute("stop-color")).toBe(
      "red",
    );
  } finally {
    first.unmount();
    second.unmount();
  }
});

test("Avatar decorative IDs work without secure-context randomUUID", async () => {
  const { avatarDecorationId } =
    await import("../../packages/semi-ui-vue/src/components/avatar/decorations.js");
  const original = globalThis.crypto;
  vi.stubGlobal("crypto", {
    getRandomValues: original.getRandomValues.bind(original),
  });
  try {
    const values = Array.from({ length: 20 }, () => avatarDecorationId());
    expect(values.every((value) => value.length > 20)).toBe(true);
    expect(new Set(values).size).toBe(20);
  } finally {
    vi.unstubAllGlobals();
  }
});
