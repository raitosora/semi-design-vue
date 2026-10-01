import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type {
  OverflowItem,
  OverflowListCollapseProps,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import { mountVapor } from "../support/mount-vapor.js";

const items: OverflowItem[] = [
  { key: "a", label: "Alpha" },
  { key: "b", label: "Beta" },
  { key: "c", label: "Gamma" },
  { key: "d", label: "Delta" },
];
const settle = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};
const ready = async () => {
  await expect
    .poll(async () => {
      await settle();
      return document.querySelectorAll("[inert]").length;
    })
    .toBe(0);
  await settle();
};
const renderItem = (item: OverflowItem, index: number) => (
  <button
    data-index={index}
    data-item={String(item.key)}
    style="width:40px;flex:none;padding:0;border:0;height:20px"
  >
    {String(item.label)}
  </button>
);
const visible = (host: Element) =>
  [...host.querySelectorAll<HTMLElement>("[data-item]")]
    .filter((node) => !node.closest("[inert]"))
    .map((node) => node.dataset.item);

test("OverflowList collapses from end with actual item and overflow widths and pivot-only notifications", async () => {
  const notify = vi.fn();
  const width = shallowRef(105);
  const props = shallowRef<OverflowListCollapseProps>({
    items,
    onOverflow: notify,
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...props.value}
        overflowRenderer={(overflow: OverflowItem[]) => (
          <span data-overflow style="width:20px;flex:none">
            {overflow.length}
          </span>
        )}
        style={{
          width: `${width.value}px`,
          display: "flex",
          flexWrap: "nowrap",
        }}
        visibleItemRenderer={renderItem}
      />
    )),
  );
  try {
    await expect.poll(() => visible(f.host)).toEqual(["a", "b"]);
    await ready();
    const root = f.host.querySelector<HTMLElement>(".semi-overflow-list")!;
    expect(root.getBoundingClientRect().width).toBe(105);
    expect(
      [...f.host.querySelectorAll<HTMLElement>("[data-item]")].map(
        (n) => n.getBoundingClientRect().width,
      ),
    ).toEqual([40, 40]);
    expect(notify).toHaveBeenLastCalledWith(items.slice(2));
    const calls = notify.mock.calls.length;
    width.value = 106;
    await ready();
    expect(notify).toHaveBeenCalledTimes(calls);
    width.value = 180;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b", "c", "d"]);
    expect(notify).toHaveBeenCalledTimes(calls);
  } finally {
    f.unmount();
  }
});

test("OverflowList start/end directions restore defaults after explicit undefined and prop removal", async () => {
  const props = shallowRef<OverflowListCollapseProps>({
    items,
    collapseFrom: "start",
    minVisibleItems: 2,
    className: "legacy",
    class: "native",
    id: "overflow-root",
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...props.value}
        aria-label="Items"
        data-owner="caller"
        overflowRenderer={(overflow: OverflowItem[]) => (
          <span data-overflow style="width:20px;flex:none">
            {overflow.length}
          </span>
        )}
        style="width:45px;display:flex;flex-wrap:nowrap"
        visibleItemRenderer={renderItem}
      />
    )),
  );
  try {
    await expect.poll(() => visible(f.host)).toEqual(["c", "d"]);
    await ready();
    const root = f.host.querySelector<HTMLElement>(".semi-overflow-list")!;
    expect(root.tagName).toBe("DIV");
    expect(root.id).toBe("overflow-root");
    expect(root.dataset.owner).toBe("caller");
    expect(root.getAttribute("aria-label")).toBe("Items");
    expect(root.classList.contains("legacy")).toBe(true);
    expect(root.classList.contains("native")).toBe(true);
    expect(root.style.maxWidth).toBe("100%");
    expect(
      root
        .querySelector("[data-overflow]")
        ?.compareDocumentPosition(root.querySelector("[data-item]")!)! &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    props.value = {
      items,
      collapseFrom: undefined,
      minVisibleItems: undefined,
    };
    await expect.poll(() => visible(f.host)).toEqual([]);
    await ready();
    expect(root.id).toBe("");
    expect(root.classList.contains("legacy")).toBe(false);
    expect(root.classList.contains("native")).toBe(false);
    props.value = { items, minVisibleItems: 9 };
    await expect.poll(() => visible(f.host)).toEqual(["a", "b", "c", "d"]);
    props.value = { items };
    await expect.poll(() => visible(f.host)).toEqual([]);
    props.value = { items: [] };
    await ready();
    expect(visible(f.host)).toEqual([]);
    expect(f.host.querySelector("[data-overflow]")?.textContent).toBe("0");
  } finally {
    f.unmount();
  }
});

test("OverflowList recalculates zero, hidden, container, content and overflow widths using real geometry", async () => {
  const width = shallowRef(0);
  const hidden = shallowRef(false);
  const itemWidth = shallowRef(40);
  const overflowWidth = shallowRef(20);
  const f = mountVapor(
    defineVaporComponent(() => (
      <section style={{ display: hidden.value ? "none" : "block" }}>
        <OverflowList
          items={items}
          overflowRenderer={(overflow: OverflowItem[]) => (
            <span
              data-overflow
              style={{
                display: "block",
                width: `${overflowWidth.value}px`,
                flex: "none",
              }}
            >
              {overflow.length}
            </span>
          )}
          style={{
            width: `${width.value}px`,
            display: "flex",
            flexWrap: "nowrap",
          }}
          visibleItemRenderer={(item: OverflowItem) => (
            <span
              data-item={String(item.key)}
              style={{
                display: "block",
                width: `${itemWidth.value}px`,
                flex: "none",
              }}
            >
              {String(item.label)}
            </span>
          )}
        />
      </section>
    )),
  );
  try {
    await expect.poll(() => visible(f.host)).toEqual([]);
    expect(
      f.host.querySelector(".semi-overflow-list")?.getBoundingClientRect()
        .width,
    ).toBe(0);
    for (const node of f.host.querySelectorAll<HTMLElement>("[data-item]")) {
      expect(node.closest("[inert][aria-hidden=true]")).not.toBeNull();
    }
    width.value = 100;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b"]);
    await ready();
    const a = f.host.querySelector("[data-item=a]");
    width.value = 99;
    await expect.poll(() => visible(f.host)).toEqual(["a"]);
    expect(f.host.querySelector("[data-item=a]")).toBe(a);
    width.value = 100;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b"]);
    overflowWidth.value = 21;
    await expect.poll(() => visible(f.host)).toEqual(["a"]);
    overflowWidth.value = 20;
    itemWidth.value = 30;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b"]);
    width.value = 110;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b", "c"]);
    hidden.value = true;
    await settle();
    expect(
      f.host.querySelector(".semi-overflow-list")?.getBoundingClientRect()
        .width,
    ).toBe(0);
    itemWidth.value = 40;
    hidden.value = false;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b"]);
    await ready();
    expect(
      f.host.querySelector("[data-item=a]")?.getBoundingClientRect().width,
    ).toBe(40);
    const nodes = [...f.host.querySelectorAll("[data-item]")];
    for (let i = 0; i < 4; i++) {
      window.dispatchEvent(new Event("resize"));
      await ready();
      expect([...f.host.querySelectorAll("[data-item]")]).toEqual(nodes);
    }
  } finally {
    f.unmount();
  }
});

test("OverflowList remeasures text after font metrics change and font loading completion", async () => {
  const font = shallowRef("10px monospace");
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={items}
        overflowRenderer={() => (
          <span data-overflow style="width:20px;display:block;flex:none">
            +
          </span>
        )}
        style="width:100px;display:flex;flex-wrap:nowrap"
        visibleItemRenderer={(item: OverflowItem) => (
          <span
            data-item={String(item.key)}
            style={{ display: "block", whiteSpace: "nowrap", font: font.value }}
          >
            MMMM
          </span>
        )}
      />
    )),
  );
  try {
    await expect.poll(() => visible(f.host).length).toBe(3);
    const before = f.host
      .querySelector("[data-item]")!
      .getBoundingClientRect().width;
    font.value = "20px monospace";
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await expect.poll(() => visible(f.host).length).toBe(1);
    expect(
      f.host.querySelector("[data-item]")!.getBoundingClientRect().width,
    ).toBeGreaterThan(before * 1.8);
  } finally {
    f.unmount();
  }
});

test("OverflowList synchronous primitive, array and multi-root renderer content remains native owned content", async () => {
  const source: OverflowItem[] = [
    { key: "text", content: "Text" },
    { key: "number", content: 12 },
    { key: "empty", content: null },
  ];
  const props = shallowRef<OverflowListCollapseProps>({
    items: source,
    visibleItemRenderer: (item) => item.content as string | number | null,
    overflowRenderer: () => ["Tail", 7, false, null, ["Nested"]],
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList {...props.value} style="width:500px;display:flex" />
    )),
  );
  try {
    await expect.poll(() => f.host.textContent).toBe("Text12Tail7Nested");
    expect(f.host.textContent).not.toContain("[object");
    props.value = {
      ...props.value,
      visibleItemRenderer: (item: OverflowItem) => (
        <>
          <button data-multi={String(item.key)}>{String(item.key)}</button>
          <span data-part>Part</span>
        </>
      ),
    };
    await expect
      .poll(() => f.host.querySelectorAll("[data-multi]").length)
      .toBe(3);
    expect(f.host.querySelectorAll("[data-part]")).toHaveLength(3);
    props.value = { ...props.value, items: [] };
    await expect
      .poll(() => f.host.querySelectorAll("[data-multi]").length)
      .toBe(0);
  } finally {
    f.unmount();
  }
});

test("OverflowList non-monotonic overflow widths reach a bounded stable native result", async () => {
  const notify = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={items.slice(0, 3)}
        onOverflow={notify}
        overflowRenderer={(folded: OverflowItem[]) => (
          <span
            data-cycle
            style={{
              display: "block",
              width: folded.length === 1 ? "150px" : "0px",
              flex: "none",
            }}
          >
            {folded.length}
          </span>
        )}
        style="width:100px;display:flex"
        visibleItemRenderer={renderItem}
      />
    )),
  );
  try {
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    await ready();
    expect(visible(f.host)).toEqual([]);
    expect(f.host.querySelector("[data-cycle]")?.textContent).toBe("3");
    const calls = notify.mock.calls.length;
    for (let i = 0; i < 3; i++) {
      window.dispatchEvent(new Event("resize"));
      await ready();
      expect(visible(f.host)).toEqual([]);
      expect(notify).toHaveBeenCalledTimes(calls);
    }
  } finally {
    f.unmount();
  }
});

test("OverflowList restores caller aria-hidden and inert attrs after measurement and follows their removal", async () => {
  const attrs = shallowRef<OverflowListCollapseProps>({
    items: items.slice(0, 2),
    "aria-hidden": "false",
    inert: false,
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...attrs.value}
        style="width:100px;display:flex"
        visibleItemRenderer={renderItem}
      />
    )),
  );
  try {
    const root = f.host.querySelector<HTMLElement>(".semi-overflow-list")!;
    await expect.poll(() => root.style.visibility).toBe("visible");
    await expect.poll(() => root.getAttribute("aria-hidden")).toBe("false");
    expect(root.inert).toBe(false);
    expect(
      root.querySelectorAll(".semi-overflow-list-item[inert]"),
    ).toHaveLength(0);
    attrs.value = { ...attrs.value, "aria-hidden": "true", inert: true };
    await expect.poll(() => root.inert).toBe(true);
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(
      root.querySelectorAll(".semi-overflow-list-item[inert]"),
    ).toHaveLength(0);
    attrs.value = {
      items: items.slice(0, 2),
      "aria-hidden": undefined,
      inert: undefined,
    };
    await expect.poll(() => root.hasAttribute("inert")).toBe(false);
    expect(root.hasAttribute("aria-hidden")).toBe(false);
    attrs.value = {
      items: items.slice(0, 2),
      "aria-hidden": "false",
      inert: false,
    };
    await expect.poll(() => root.getAttribute("aria-hidden")).toBe("false");
    attrs.value = { items: items.slice(0, 2) };
    await expect.poll(() => root.hasAttribute("aria-hidden")).toBe(false);
    expect(root.inert).toBe(false);
    expect(root.querySelectorAll(".semi-overflow-list-item")).toHaveLength(2);
    expect(root.getBoundingClientRect().width).toBe(100);
  } finally {
    f.unmount();
  }
});

test("OverflowList remeasures actual downloaded FontFace metrics without a synthetic loadingdone event", async () => {
  const family = "OverflowListRealFont";
  const face = new FontFace(
    family,
    `url(${new URL("../../node_modules/vitepress/dist/client/theme-default/fonts/inter-roman-latin.woff2", import.meta.url).href})`,
  );
  const font = shallowRef("20px monospace");
  const loaded = vi.fn();
  document.fonts.addEventListener("loadingdone", loaded);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={items}
        overflowRenderer={() => (
          <span style="width:20px;display:block;flex:none">+</span>
        )}
        style="width:160px;display:flex"
        visibleItemRenderer={(item: OverflowItem) => (
          <span
            data-item={String(item.key)}
            style={{ display: "block", whiteSpace: "nowrap", font: font.value }}
          >
            iiiiiiii
          </span>
        )}
      />
    )),
  );
  try {
    await expect.poll(() => visible(f.host).length).toBe(1);
    await ready();
    const before = f.host
      .querySelector("[data-item]")!
      .getBoundingClientRect().width;
    document.fonts.add(face);
    font.value = `20px ${family}, monospace`;
    await nextTick();
    const faces = await document.fonts.load(`20px ${family}`, "iiiiiiii");
    await document.fonts.ready;
    expect(faces).toContain(face);
    expect(face.status).toBe("loaded");
    await expect.poll(() => loaded.mock.calls.length).toBeGreaterThan(0);
    await expect.poll(() => visible(f.host).length).toBe(3);
    await ready();
    const after = f.host
      .querySelector("[data-item]")!
      .getBoundingClientRect().width;
    expect(after).toBeLessThan(before * 0.7);
    const integerItem = f.host.querySelector<HTMLElement>(
      ".semi-overflow-list-item",
    )!.clientWidth;
    const integerOverflow = f.host.querySelector<HTMLElement>(
      ".semi-overflow-list-overflow",
    )!.clientWidth;
    expect(integerOverflow).toBe(20);
    expect(integerItem * 3 + integerOverflow).toBeLessThanOrEqual(160);
    expect(integerItem * 4 + integerOverflow).toBeGreaterThan(160);
    expect(
      f.host.querySelector(".semi-overflow-list")!.getBoundingClientRect()
        .width,
    ).toBe(160);
  } finally {
    f.unmount();
    document.fonts.delete(face);
    document.fonts.removeEventListener("loadingdone", loaded);
  }
});

test("OverflowList retains upstream integer clientWidth arithmetic with padding, borders, gaps and child margins", async () => {
  const width = shallowRef(126.4);
  const itemWidth = shallowRef(40.4);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={items.slice(0, 3)}
        style={{
          width: `${width.value}px`,
          display: "flex",
          gap: "12px",
          padding: "0 10px",
          border: "2px solid",
          boxSizing: "content-box",
        }}
        visibleItemRenderer={(item: OverflowItem) => (
          <button
            data-item={String(item.key)}
            style={{
              width: `${itemWidth.value}px`,
              margin: "0 4px",
              border: "0",
              padding: "0",
              flex: "none",
            }}
          >
            {String(item.key)}
          </button>
        )}
      />
    )),
  );
  try {
    await expect.poll(() => visible(f.host)).toEqual(["a", "b", "c"]);
    await ready();
    const root = f.host.querySelector<HTMLElement>(".semi-overflow-list")!;
    const wrappers = () => [
      ...root.querySelectorAll<HTMLElement>(".semi-overflow-list-item"),
    ];
    expect(root.clientWidth).toBe(146);
    expect(root.getBoundingClientRect().width).toBeCloseTo(150.4, 1);
    expect(wrappers().map((node) => node.clientWidth)).toEqual([48, 48, 48]);
    expect(
      wrappers()[1]!.getBoundingClientRect().left -
        wrappers()[0]!.getBoundingClientRect().right,
    ).toBe(12);
    expect(wrappers()[2]!.getBoundingClientRect().right).toBeGreaterThan(
      root.getBoundingClientRect().right,
    );
    itemWidth.value = 40.6;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b"]);
    await ready();
    expect(wrappers().map((node) => node.clientWidth)).toEqual([49, 49]);
    width.value = 126.6;
    await expect.poll(() => visible(f.host)).toEqual(["a", "b", "c"]);
    await ready();
    expect(root.clientWidth).toBe(147);
    expect(root.getBoundingClientRect().width).toBeCloseTo(150.6, 1);
  } finally {
    f.unmount();
  }
});
