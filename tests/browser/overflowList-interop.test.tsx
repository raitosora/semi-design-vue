import {
  type ComponentPublicInstance,
  createApp,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
  vaporInteropPlugin,
} from "vue";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type { OverflowItem } from "../../packages/semi-ui-vue/src/components/overflowList/index.js";

const items: OverflowItem[] = ["a", "b", "c"].map((key) => ({
  key,
  text: key,
}));
const flush = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};

test("OverflowList native collapse outlets own interop h fragments, events, refs and current item scope", async () => {
  const source = shallowRef(items);
  const clicked = vi.fn();
  const references: Array<{ key: string; node: Element | null }> = [];
  const fallbackItem = vi.fn(() => "unexpected item");
  const fallbackOverflow = vi.fn(() => "unexpected overflow");
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(
        OverflowList,
        {
          items: source.value,
          style: "width:100px;display:flex",
          visibleItemRenderer: fallbackItem,
          overflowRenderer: fallbackOverflow,
        },
        {
          visibleItem: (scope: { item: OverflowItem; index: number }) =>
            h(Fragment, [
              h(
                "button",
                {
                  "data-interop": String(scope.item.key),
                  "data-index": scope.index,
                  style: "width:30px;padding:0;border:0;flex:none",
                  onClick: () => clicked(scope.item.key),
                  ref: (node: Element | ComponentPublicInstance | null) => {
                    if (node !== null && !(node instanceof Element))
                      throw new Error("Expected native interop DOM ref");
                    references.push({ key: String(scope.item.key), node });
                  },
                },
                String(scope.item.text),
              ),
              h(
                "span",
                {
                  "data-tail": String(scope.item.key),
                  style: "display:inline-block;width:10px",
                },
                "!",
              ),
            ]),
          overflow: (scope: { items: OverflowItem[] }) =>
            h(
              "span",
              {
                "data-interop-overflow": "",
                style: "display:block;width:20px;flex:none",
              },
              scope.items.map((item) => String(item.key)).join(","),
            ),
        },
      ),
  });
  app.use(vaporInteropPlugin);
  document.body.append(host);
  try {
    app.mount(host);
    const visible = () =>
      [...host.querySelectorAll<HTMLElement>("[data-interop]")].filter(
        (node) => !node.closest("[inert]"),
      );
    await expect
      .poll(() => visible().map((node) => node.dataset.interop))
      .toEqual(["a", "b"]);
    await expect.poll(() => host.querySelectorAll("[inert]").length).toBe(0);
    expect(host.querySelector("[data-interop-overflow]")?.textContent).toBe(
      "c",
    );
    expect(host.querySelectorAll("[data-tail]")).toHaveLength(2);
    expect(fallbackItem).not.toHaveBeenCalled();
    expect(fallbackOverflow).not.toHaveBeenCalled();
    visible()[1]!.click();
    expect(clicked).toHaveBeenCalledExactlyOnceWith("b");
    source.value = [{ key: "b", text: "New B" }, items[0]!, items[2]!];
    await expect
      .poll(() =>
        visible().map((node) => [
          node.dataset.interop,
          node.dataset.index,
          node.textContent,
        ]),
      )
      .toEqual([
        ["b", "0", "New B"],
        ["a", "1", "a"],
      ]);
    await expect.poll(() => host.querySelectorAll("[inert]").length).toBe(0);
    const wrappers = [
      ...host.querySelectorAll<HTMLElement>(".semi-overflow-list-item"),
    ];
    expect(wrappers.map((node) => node.clientWidth)).toEqual([40, 40]);
    app.unmount();
    expect(host.childElementCount).toBe(0);
    for (const key of ["a", "b", "c"]) {
      expect(
        references.some((entry) => entry.key === key && entry.node === null),
      ).toBe(true);
    }
  } finally {
    if (host.childElementCount) app.unmount();
    host.remove();
  }
});

test("OverflowList separate scroll outlets adapt interop h content and dispose replaced stateful slot parts", async () => {
  const variant = shallowRef("initial");
  const mounted = vi.fn();
  const disposed = vi.fn();
  const clicked = vi.fn();
  const fallback = vi.fn(() => ["Fallback start", "Fallback end"]);
  const Part = defineComponent({
    props: { label: { type: String, required: true } },
    setup(props) {
      const label = props.label;
      onMounted(() => mounted(label));
      onUnmounted(() => disposed(label));
      return () =>
        h(
          "button",
          {
            "data-interop-part": props.label,
            onClick: () => clicked(props.label),
          },
          props.label,
        );
    },
  });
  const host = document.createElement("div");
  const app = createApp({
    render: () =>
      h(
        OverflowList,
        {
          items,
          renderMode: "scroll",
          style: "width:150px;display:flex",
          wrapperStyle:
            "width:100px;min-width:0;flex:none;display:flex;overflow-x:scroll",
          overflowRenderer: fallback,
        },
        {
          visibleItem: (scope: { item: OverflowItem }) =>
            h(
              "span",
              {
                "data-scroll-interop": String(scope.item.key),
                style: "display:block;width:50px;flex:none",
              },
              String(scope.item.text),
            ),
          ...(variant.value === "initial"
            ? {
                overflowStart: (scope: { items: OverflowItem[] }) =>
                  h(Part, {
                    key: "start",
                    label: `start:${scope.items.length}`,
                  }),
                overflowEnd: (scope: { items: OverflowItem[] }) =>
                  h(Part, { key: "end", label: `end:${scope.items.length}` }),
              }
            : variant.value === "replacement"
              ? {
                  overflowStart: () =>
                    h(Fragment, [
                      h("span", { "data-replacement": "start" }, "New start"),
                      " text",
                    ]),
                  overflowEnd: () =>
                    h("span", { "data-replacement": "end" }, "New end"),
                }
              : {}),
        },
      ),
  });
  app.use(vaporInteropPlugin);
  document.body.append(host);
  try {
    app.mount(host);
    await expect
      .poll(() => host.querySelectorAll("[data-interop-part]").length)
      .toBe(2);
    await flush();
    expect(host.querySelectorAll("[data-scroll-interop]")).toHaveLength(3);
    expect(fallback).not.toHaveBeenCalled();
    host.querySelector<HTMLElement>("[data-interop-part]")!.click();
    expect(clicked).toHaveBeenCalledTimes(1);
    variant.value = "replacement";
    await expect
      .poll(() => host.querySelectorAll("[data-replacement]").length)
      .toBe(2);
    expect(host.querySelectorAll("[data-interop-part]")).toHaveLength(0);
    expect(mounted.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(disposed.mock.calls.length).toBe(mounted.mock.calls.length);
    expect(
      host.querySelector(".semi-overflow-list-overflow-start")?.textContent,
    ).toBe("New start text");
    expect(
      host.querySelector(".semi-overflow-list-overflow-end")?.textContent,
    ).toBe("New end");
    variant.value = "removed";
    await expect
      .poll(
        () =>
          host.querySelector(".semi-overflow-list-overflow-start")?.textContent,
      )
      .toBe("Fallback start");
    expect(
      host.querySelector(".semi-overflow-list-overflow-end")?.textContent,
    ).toBe("Fallback end");
    expect(host.querySelectorAll("[data-replacement]")).toHaveLength(0);
    app.unmount();
    expect(host.childElementCount).toBe(0);
    expect(disposed.mock.calls.length).toBe(mounted.mock.calls.length);
  } finally {
    if (host.childElementCount) app.unmount();
    host.remove();
  }
});
