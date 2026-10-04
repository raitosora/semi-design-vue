import {
  computed,
  defineVaporComponent,
  nextTick,
  provide,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Tag from "../../packages/semi-ui-vue/src/components/tag/Tag.js";
import { tagTriggerKey } from "../../packages/semi-ui-vue/src/components/tag/trigger-context.js";
import type { TagProps } from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

test("Tag avatar source updates retain face identity and stale image errors cannot replace new content", async () => {
  const props = shallowRef<TagProps>({ children: "name", avatarSrc: image });
  const fixture = mountVapor(
    defineVaporComponent(() => <Tag {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-tag")!;
    const avatar = root.querySelector(".semi-avatar")!;
    const oldImage = avatar.querySelector("img")!;
    expect(oldImage.alt).toBe("");
    expect(root.classList.contains("semi-tag-avatar-square")).toBe(true);
    props.value = {
      children: "updated",
      avatarSrc: image + "#new",
      avatarShape: "circle",
    };
    await nextTick();
    expect(fixture.host.querySelector(".semi-avatar")).toBe(avatar);
    const newImage = avatar.querySelector("img")!;
    oldImage.dispatchEvent(new Event("error"));
    await nextTick();
    expect(avatar.querySelector("img")).toBe(newImage);
    expect(root.classList.contains("semi-tag-avatar-circle")).toBe(true);
    props.value = { children: "removed", avatarSrc: "" };
    await nextTick();
    expect(fixture.host.querySelector(".semi-avatar")).toBeNull();
    props.value = { children: "again", avatarSrc: image };
    await nextTick();
    expect(fixture.host.querySelector(".semi-avatar")).not.toBe(avatar);
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Tag apps and instances isolate close state and retain native DOM until caller removal", async () => {
  const first = mountVapor(
    defineVaporComponent(() => <Tag children="first" closable />),
  );
  const shown = shallowRef(true);
  const second = mountVapor(
    defineVaporComponent(() => (
      <>{shown.value ? <Tag children="second" closable /> : null}</>
    )),
  );
  try {
    first.host.querySelector<HTMLElement>(".semi-tag-close")!.click();
    await nextTick();
    expect(first.host.querySelector(".semi-tag-invisible")).not.toBeNull();
    expect(second.host.querySelector(".semi-tag-invisible")).toBeNull();
    const previous = second.host.querySelector(".semi-tag")!;
    shown.value = false;
    await nextTick();
    expect(previous.isConnected).toBe(false);
    shown.value = true;
    await nextTick();
    expect(second.host.querySelector(".semi-tag")).not.toBe(previous);
    expect(second.host.querySelector(".semi-tag-invisible")).toBeNull();
  } finally {
    first.unmount();
    second.unmount();
  }
});

test("Tag private trigger binds only its root and merges events without leaking to descendants", async () => {
  const triggerRef = vi.fn();
  const triggerClick = vi.fn();
  const triggerEnter = vi.fn();
  const click = vi.fn();
  const enter = vi.fn();
  const attrs = shallowRef<Record<string, unknown>>({
    "aria-controls": "popup",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide(
        tagTriggerKey,
        computed(() => ({
          attrs: attrs.value,
          triggerRef,
          getTriggerRef: () => triggerRef,
          triggerProps: {
            tabIndex: 0,
            "data-popupid": "popup",
            onClick: triggerClick,
            onMouseenter: triggerEnter,
          },
        })),
      );
      return (
        <Tag
          children="outer"
          onClick={click}
          onMouseEnter={enter}
          prefixIcon={() => <Tag children="nested" />}
        />
      );
    }),
  );
  try {
    const outer = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    const inner = outer.querySelector<HTMLElement>(".semi-tag")!;
    expect(triggerRef.mock.calls.filter(([value]) => value !== null)).toEqual([
      [outer],
    ]);
    expect(inner.getAttribute("data-popupid")).toBeNull();
    expect(inner.getAttribute("aria-controls")).toBeNull();
    outer.click();
    outer.dispatchEvent(new MouseEvent("mouseenter"));
    expect(triggerClick).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(triggerEnter).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledTimes(1);
    attrs.value = { "aria-controls": "changed" };
    await nextTick();
    expect(outer.getAttribute("aria-controls")).toBe("changed");
  } finally {
    fixture.unmount();
  }
  expect(triggerRef.mock.calls.at(-1)).toEqual([null]);
});

test("Tag retained nodes cannot notify after unmount while hidden live tags retain close behavior", async () => {
  const shown = shallowRef(true);
  const close = vi.fn();
  const click = vi.fn();
  const keydown = vi.fn();
  const enter = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        {shown.value ? (
          <Tag
            children="live"
            closable
            onClick={click}
            onClose={close}
            onKeyDown={keydown}
            onMouseEnter={enter}
          />
        ) : null}
      </>
    )),
  );
  try {
    const oldRoot = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    const oldClose = oldRoot.querySelector<HTMLElement>(".semi-tag-close")!;
    shown.value = false;
    await nextTick();
    oldClose.click();
    oldRoot.click();
    oldRoot.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Delete", cancelable: true }),
    );
    oldRoot.dispatchEvent(new MouseEvent("mouseenter"));
    expect(close).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(keydown).not.toHaveBeenCalled();
    expect(enter).not.toHaveBeenCalled();
    shown.value = true;
    await nextTick();
    const newRoot = fixture.host.querySelector<HTMLElement>(".semi-tag")!;
    const newClose = newRoot.querySelector<HTMLElement>(".semi-tag-close")!;
    expect(newRoot).not.toBe(oldRoot);
    newClose.click();
    await nextTick();
    expect(newRoot.classList.contains("semi-tag-invisible")).toBe(true);
    newClose.click();
    expect(close).toHaveBeenCalledTimes(2);
  } finally {
    fixture.unmount();
  }
});
