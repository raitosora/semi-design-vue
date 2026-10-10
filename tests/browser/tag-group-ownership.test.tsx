import {
  createComponent,
  provide,
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import TagGroup from "../../packages/semi-ui-vue/src/components/tag/group.js";
import { createTagGroupEntries } from "../../packages/semi-ui-vue/src/components/tag/group-input.js";
import type { TagGroupProps } from "../../packages/semi-ui-vue/src/components/tag/group-types.js";
import type {
  TagContent,
  TagProps,
} from "../../packages/semi-ui-vue/src/components/tag/types.js";
import { mountVapor } from "../support/mount-vapor.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
const scopedMount = (component: Parameters<typeof mountVapor>[0]) =>
  mountVapor(
    defineVaporComponent(() => {
      provide(ariaIdScopeKey, createAriaIdScope("tag-group"));
      return createComponent(component);
    }),
  );
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 30));
  await nextTick();
};

test("TagGroup custom renderers own each mounted branch and release hidden Popover content", async () => {
  const label = shallowRef("rest");
  const mounted = vi.fn();
  const disposed = vi.fn();
  const Rest = defineVaporComponent(() => {
    onMounted(mounted);
    onUnmounted(disposed);
    return (
      <>
        <input data-owned-input value={label.value} />
        <span>{label.value}</span>
      </>
    );
  });
  const first = () => <button data-first>first</button>;
  const rest = vi.fn(() => <Rest />);
  const items = shallowRef<readonly TagContent[]>([first, rest]);
  const open = shallowRef(false);
  const fixture = scopedMount(
    defineVaporComponent(() => (
      <TagGroup
        maxTagCount={1}
        mode="custom"
        popoverProps={{ trigger: "custom", visible: open.value, motion: false }}
        showPopover
        tagList={items.value}
      />
    )),
  );
  try {
    await settle();
    expect(rest).not.toHaveBeenCalled();
    const original = fixture.host.querySelector("[data-first]");
    open.value = true;
    await settle();
    expect(rest).toHaveBeenCalledTimes(1);
    expect(mounted).toHaveBeenCalledTimes(1);
    const input =
      document.querySelector<HTMLInputElement>("[data-owned-input]")!;
    input.focus();
    label.value = "updated";
    await settle();
    expect(document.querySelector("[data-owned-input]")).toBe(input);
    expect(input.value).toBe("updated");
    expect(document.activeElement).toBe(input);
    expect(rest).toHaveBeenCalledTimes(1);
    open.value = false;
    await settle();
    expect(disposed).toHaveBeenCalledTimes(1);
    expect(input.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(input);
    open.value = true;
    await settle();
    expect(mounted).toHaveBeenCalledTimes(2);
    items.value = [first];
    await settle();
    expect(disposed).toHaveBeenCalledTimes(2);
    expect(fixture.host.querySelector("[data-first]")).toBe(original);
    expect(document.querySelector("[data-owned-input]")).toBeNull();
  } finally {
    fixture.unmount();
  }
  expect(mounted.mock.calls.length).toBe(disposed.mock.calls.length);
});

test("TagGroup count trigger forwards Popover interaction and explicit content override", async () => {
  const enter = vi.fn();
  const popup = shallowRef<TagGroupProps["popoverProps"]>({
    trigger: "click",
    motion: false,
    content: "override",
  });
  const pointerTarget = document.createElement("div");
  Object.assign(pointerTarget.style, {
    position: "fixed",
    right: "0px",
    bottom: "0px",
    width: "24px",
    height: "24px",
  });
  document.body.append(pointerTarget);
  let fixture: ReturnType<typeof scopedMount> | undefined;
  try {
    // Keep physical pointer input separate from the explicit synthetic event.
    await page.elementLocator(pointerTarget).hover();
    fixture = scopedMount(
      defineVaporComponent(() => (
        <TagGroup
          maxTagCount={1}
          onPlusNMouseEnter={enter}
          popoverProps={popup.value}
          showPopover
          tagList={[{ children: "shown" }, { children: "hidden" }]}
        />
      )),
    );
    await settle();
    const plus = fixture.host.querySelectorAll<HTMLElement>(".semi-tag")[1]!;
    const syntheticEnter = new MouseEvent("mouseenter");
    plus.dispatchEvent(syntheticEnter);
    await settle();
    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledWith(syntheticEnter);
    expect(enter.mock.calls[0]![0].isTrusted).toBe(false);
    plus.click();
    await settle();
    expect(document.querySelector(".semi-popover-content")?.textContent).toBe(
      "override",
    );
    popup.value = {
      trigger: "custom",
      visible: true,
      motion: false,
      content: undefined,
    };
    await settle();
    expect(document.querySelector(".semi-popover-content")?.textContent).toBe(
      "",
    );
    popup.value = { trigger: "custom", visible: true, motion: false };
    await settle();
    expect(document.querySelector(".semi-popover-content")?.textContent).toBe(
      "hidden",
    );
  } finally {
    fixture?.unmount();
    pointerTarget.remove();
  }
});

test("TagGroup stable fallback identity, explicit zero key fallback, custom values and duplicate rejection", () => {
  const entries = createTagGroupEntries();
  const rich: TagProps = { children: () => <b>rich</b> };
  const list = { tagList: [rich, { tagKey: 0, children: "zero" }] };
  const first = entries(list);
  expect(entries(list)[0]!.key).toBe(first[0]!.key);
  expect(first[1]!.key).toBe("zero");
  expect(entries({})).toEqual([]);
  expect(
    entries({ mode: "custom", tagList: [null, undefined, false, 0, "a"] }),
  ).toHaveLength(5);
  for (const props of [
    { tagList: null },
    { tagList: [null] },
    { tagList: [[]] },
    { tagList: [{ tagKey: {} }] },
    { tagList: [{ children: "same" }, { children: "same" }] },
    { mode: "custom", tagList: [{}] },
    { mode: "custom", tagList: [false, false] },
    { onTagClose: "bad" },
    { onPlusNMouseEnter: "bad" },
    { maxTagCount: "1" },
    { restCount: null },
    { mode: "other" },
    { size: "wrong" },
    { avatarShape: "wrong" },
    { showPopover: "true" },
    { popoverProps: [] },
    { tagList: [{ children: "x", onClose: "bad" }] },
  ])
    expect(() => entries(props as unknown as TagGroupProps)).toThrow(TypeError);
});

test("TagGroup unprovided defaults and readonly input survive additions, caller removal and independent apps", async () => {
  const items = shallowRef<readonly TagProps[]>(
    Object.freeze([
      { tagKey: "a", children: "a", closable: true },
      { tagKey: "b", children: "b", closable: true },
    ]),
  );
  const fixture = scopedMount(
    defineVaporComponent(() => (
      <TagGroup
        onTagClose={(_children, _event, key) => {
          items.value = items.value.filter((item) => item.tagKey !== key);
        }}
        size="small"
        tagList={items.value}
      />
    )),
  );
  const other = mountVapor(defineVaporComponent(() => <TagGroup />));
  try {
    await settle();
    const a = fixture.host.querySelector(".semi-tag")!;
    expect(a.classList.contains("semi-tag-small")).toBe(true);
    items.value = [
      ...items.value,
      { tagKey: "c", children: "c", closable: true },
    ];
    await settle();
    expect(fixture.host.querySelector(".semi-tag")).toBe(a);
    for (let remaining = 2; remaining >= 0; remaining--) {
      fixture.host.querySelector<HTMLElement>(".semi-tag-close")!.click();
      await settle();
      expect(fixture.host.querySelectorAll(".semi-tag")).toHaveLength(
        remaining,
      );
    }
    expect(other.host.textContent).toBe("");
  } finally {
    fixture.unmount();
    other.unmount();
  }
});

test("TagGroup custom keyed two-item reorder preserves nodes, focus and selection; removal releases focus", async () => {
  const a = () => <input data-move="a" value="selection" />;
  const b = () => <button data-move="b">b</button>;
  const items = shallowRef<readonly TagContent[]>([a, b]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <TagGroup mode="custom" tagList={items.value} />
    )),
  );
  try {
    await settle();
    const input = fixture.host.querySelector<HTMLInputElement>("input")!;
    input.focus();
    input.setSelectionRange(1, 4);
    items.value = [b, a];
    await settle();
    expect(fixture.host.querySelector("input")).toBe(input);
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(4);
    expect(document.activeElement).toBe(input);
    input.focus();
    items.value = [b];
    await settle();
    expect(input.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(input);
  } finally {
    fixture.unmount();
  }
});

test("TagGroup invokes merged callbacks once in original order and keeps removal caller-owned", async () => {
  const order: string[] = [];
  const tag = {
    tagKey: "x",
    children: "x",
    closable: true,
    onClose: [
      () => order.push("item1"),
      (_children: unknown, event: Event) => {
        order.push("item2");
        event.preventDefault();
      },
    ],
  } as unknown as TagProps;
  const props = {
    tagList: [tag],
    onTagClose: [
      (_children: unknown, event: Event) =>
        order.push(`group1:${event.defaultPrevented}`),
      () => order.push("group2"),
    ],
  } as unknown as TagGroupProps;
  const fixture = mountVapor(
    defineVaporComponent(() => <TagGroup {...props} />),
  );
  try {
    await settle();
    const close = fixture.host.querySelector<HTMLElement>(".semi-tag-close")!;
    close.click();
    close.click();
    await settle();
    expect(order).toEqual([
      "item1",
      "item2",
      "group1:true",
      "group2",
      "item1",
      "item2",
      "group1:true",
      "group2",
    ]);
    expect(close.isConnected).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("TagGroup changing Popover content presence preserves its native trigger and open state", async () => {
  const popup = shallowRef<TagGroupProps["popoverProps"]>({
    trigger: "click",
    motion: false,
  });
  const fixture = scopedMount(
    defineVaporComponent(() => (
      <TagGroup
        maxTagCount={1}
        popoverProps={popup.value}
        showPopover
        tagList={[{ children: "a" }, { children: "b" }]}
      />
    )),
  );
  try {
    await settle();
    const plus = fixture.host.querySelectorAll<HTMLElement>(".semi-tag")[1]!;
    plus.click();
    await settle();
    expect(plus.getAttribute("aria-expanded")).toBe("true");
    const id = plus.getAttribute("aria-describedby");
    popup.value = { trigger: "click", motion: false, content: "override" };
    await settle();
    expect(fixture.host.querySelectorAll(".semi-tag")[1]).toBe(plus);
    expect(plus.getAttribute("aria-expanded")).toBe("true");
    expect(plus.getAttribute("aria-describedby")).toBe(id);
    expect(document.querySelector(".semi-popover-content")?.textContent).toBe(
      "override",
    );
    popup.value = { trigger: "click", motion: false };
    await settle();
    expect(plus.getAttribute("aria-expanded")).toBe("true");
    expect(document.querySelector(".semi-popover-content")?.textContent).toBe(
      "b",
    );
  } finally {
    fixture.unmount();
  }
});
