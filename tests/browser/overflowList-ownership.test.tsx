import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type {
  OverflowItem,
  OverflowListCollapseProps,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import { mountVapor } from "../support/mount-vapor.js";

const original: OverflowItem[] = ["a", "b", "c"].map((key) => ({
  key,
  text: key,
}));
const flush = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};

test("OverflowList owns one native fragment tree per key and retains keyed wrappers across raw renderer argument changes", async () => {
  const active = new Map<string, number>();
  const duplicate = vi.fn();
  const clicked = vi.fn();
  const references: Array<{ key: string; node: Element | null }> = [];
  const Child = defineVaporComponent<{ item: OverflowItem; index: number }>(
    (props) => {
      const key = String(props.item.key);
      onMounted(() => {
        const next = (active.get(key) ?? 0) + 1;
        active.set(key, next);
        if (next > 1) duplicate(key);
      });
      onUnmounted(() => active.set(key, (active.get(key) ?? 0) - 1));
      return (
        <>
          <button
            data-index={props.index}
            data-owned={key}
            onClick={() => clicked(key)}
            ref={(node: Element | null) => references.push({ key, node })}
            style="width:30px;padding:0;border:0;flex:none"
          >
            {String(props.item.text)}
          </button>
          <span data-suffix={key} style="display:inline-block;width:10px">
            !
          </span>
        </>
      );
    },
  );
  const input = shallowRef<OverflowListCollapseProps>({ items: original });
  const width = shallowRef(100);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        overflowRenderer={(items: OverflowItem[]) => (
          <span data-overflow style="display:block;width:20px;flex:none">
            {items.length}
          </span>
        )}
        style={{ width: `${width.value}px`, display: "flex" }}
        visibleItemRenderer={(item: OverflowItem, index: number) => (
          <Child index={index} item={item} />
        )}
      />
    )),
  );
  const nodes = () =>
    [...f.host.querySelectorAll<HTMLButtonElement>("[data-owned]")].filter(
      (node) => !node.closest("[inert]"),
    );
  try {
    await expect
      .poll(() => nodes().map((node) => node.dataset.owned))
      .toEqual(["a", "b"]);
    await flush();
    const a = nodes()[0]!;
    const b = nodes()[1]!;
    const aWrapper = a.closest(".semi-overflow-list-item");
    const bWrapper = b.closest(".semi-overflow-list-item");
    expect(duplicate).not.toHaveBeenCalled();
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    expect(active.get("c")).toBe(0);
    b.focus();
    b.click();
    expect(clicked).toHaveBeenCalledExactlyOnceWith("b");
    input.value = { items: [original[1]!, original[0]!, original[2]!] };
    await expect
      .poll(() => nodes().map((node) => node.dataset.owned))
      .toEqual(["b", "a"]);
    expect(nodes()[0]?.closest(".semi-overflow-list-item")).toBe(bWrapper);
    expect(nodes()[1]?.closest(".semi-overflow-list-item")).toBe(aWrapper);
    expect(
      b.closest(".semi-overflow-list-item")?.querySelector("[data-suffix=b]"),
    ).not.toBeNull();
    width.value = 140;
    await expect
      .poll(() => nodes().map((node) => node.dataset.owned))
      .toEqual(["b", "a", "c"]);
    expect(nodes()[0]?.closest(".semi-overflow-list-item")).toBe(bWrapper);
    expect(nodes()[1]?.closest(".semi-overflow-list-item")).toBe(aWrapper);
    const cWrapper = nodes()[2]!.closest(".semi-overflow-list-item");
    input.value = { items: [original[1]!, original[2]!] };
    await expect
      .poll(() => nodes().map((node) => node.dataset.owned))
      .toEqual(["b", "c"]);
    expect(nodes()[0]?.closest(".semi-overflow-list-item")).toBe(bWrapper);
    expect(nodes()[1]?.closest(".semi-overflow-list-item")).toBe(cWrapper);
    expect(a.isConnected).toBe(false);
    expect(
      references.filter((entry) => entry.key === "a" && entry.node === null)
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(duplicate).not.toHaveBeenCalled();
  } finally {
    f.unmount();
  }
  expect([...active.values()].every((count) => count === 0)).toBe(true);
  expect(f.host.childElementCount).toBe(0);
});

test("OverflowList owned slots override prop renderers and update conditional, nested and same-key content", async () => {
  const fallbackItem = vi.fn(() => "fallback item");
  const fallbackOverflow = vi.fn(() => "fallback overflow");
  const input = shallowRef<OverflowListCollapseProps>({
    items: [{ key: "only", text: "First" }],
  });
  const detail = shallowRef(false);
  const mounted = shallowRef(true);
  const f = mountVapor(
    defineVaporComponent(() => (
      <div>
        {mounted.value && (
          <OverflowList
            {...input.value}
            overflowRenderer={fallbackOverflow}
            style="width:160px;display:flex"
            v-slots={{
              visibleItem: (scope: {
                readonly item: OverflowItem;
                readonly index: number;
              }) => (
                <>
                  <button data-slotted style="width:40px">
                    {String(scope.item.text)}
                  </button>
                  {detail.value && (
                    <OverflowList
                      items={[{ key: "nested", text: "Nested" }]}
                      style="width:60px;display:flex"
                      visibleItemRenderer={(item: OverflowItem) => (
                        <span data-nested style="display:block;width:20px">
                          {String(item.text)}
                        </span>
                      )}
                    />
                  )}
                </>
              ),
              overflow: (scope: { items: OverflowItem[] }) => (
                <span data-slot-overflow style="width:10px">
                  {scope.items.length}
                </span>
              ),
            }}
            visibleItemRenderer={fallbackItem}
          />
        )}
      </div>
    )),
  );
  try {
    await expect
      .poll(() => f.host.querySelector("[data-slotted]")?.textContent)
      .toBe("First");
    expect(fallbackItem).not.toHaveBeenCalled();
    expect(fallbackOverflow).not.toHaveBeenCalled();
    detail.value = true;
    await expect
      .poll(() => f.host.querySelector("[data-nested]")?.textContent)
      .toBe("Nested");
    input.value = { items: [{ key: "only", text: "Replaced" }] };
    await expect
      .poll(() => f.host.querySelector("[data-slotted]")?.textContent)
      .toBe("Replaced");
    detail.value = false;
    await expect.poll(() => f.host.querySelector("[data-nested]")).toBeNull();
    const before = f.host.querySelector("[data-slotted]");
    mounted.value = false;
    await flush();
    expect(f.host.querySelectorAll(".semi-overflow-list")).toHaveLength(0);
    mounted.value = true;
    await expect
      .poll(() => f.host.querySelector("[data-slotted]")?.textContent)
      .toBe("Replaced");
    expect(f.host.querySelector("[data-slotted]")).not.toBe(before);
  } finally {
    f.unmount();
  }
});

test("OverflowList renderer supports native For ownership without inspecting or cloning its output", async () => {
  const ids = shallowRef(["a", "b", "c"]);
  const calls: Array<{ id: string; node: Element | null }> = [];
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={[{ key: "for" }]}
        style="width:160px;display:flex"
        visibleItemRenderer={() => (
          <For getKey={(id: string) => id} in={ids.value}>
            {{
              default: (id: ShallowRef<unknown>) => (
                <button
                  data-for={String(id.value)}
                  ref={(node: Element | null) =>
                    calls.push({ id: String(id.value), node })
                  }
                  style="width:20px;padding:0;border:0"
                >
                  {String(id.value)}
                </button>
              ),
            }}
          </For>
        )}
      />
    )),
  );
  try {
    await expect
      .poll(() => f.host.querySelectorAll("[data-for]").length)
      .toBe(3);
    const a = f.host.querySelector("[data-for=a]");
    const b = f.host.querySelector("[data-for=b]");
    ids.value = ["b", "a", "d"];
    await flush();
    expect(f.host.querySelector("[data-for=a]")).toBe(a);
    expect(f.host.querySelector("[data-for=b]")).toBe(b);
    expect(f.host.querySelector("[data-for=c]")).toBeNull();
    expect(f.host.querySelector("[data-for=d]")).not.toBeNull();
    expect(
      calls.filter((entry) => entry.id === "c" && entry.node === null),
    ).toHaveLength(1);
  } finally {
    f.unmount();
  }
  expect(
    calls.filter((entry) => entry.id === "a" && entry.node === null),
  ).toHaveLength(1);
  expect(
    calls.filter((entry) => entry.id === "b" && entry.node === null),
  ).toHaveLength(1);
  expect(
    calls.filter((entry) => entry.id === "d" && entry.node === null),
  ).toHaveLength(1);
});

test("OverflowList live native slot retains input identity and updates local index after same-key replacement and reorder", async () => {
  const input = shallowRef<OverflowListCollapseProps>({ items: original });
  const width = shallowRef(180);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        style={{ width: `${width.value}px`, display: "flex" }}
        v-slots={{
          visibleItem: (scope: { item: OverflowItem; index: number }) => (
            <input
              data-index={scope.index}
              data-live={String(scope.item.key)}
              style="width:40px;box-sizing:border-box"
              value={String(scope.item.text)}
            />
          ),
        }}
      />
    )),
  );
  try {
    await expect
      .poll(() => f.host.querySelectorAll("[data-live]").length)
      .toBe(3);
    const a = f.host.querySelector<HTMLInputElement>("[data-live=a]")!;
    const b = f.host.querySelector<HTMLInputElement>("[data-live=b]")!;
    input.value = {
      items: [{ key: "b", text: "New B" }, original[0]!, original[2]!],
    };
    await expect
      .poll(
        () => f.host.querySelector<HTMLInputElement>("[data-live=b]")?.value,
      )
      .toBe("New B");
    expect(f.host.querySelector("[data-live=b]")).toBe(b);
    expect(f.host.querySelector("[data-live=a]")).toBe(a);
    expect(b.dataset.index).toBe("0");
    expect(a.dataset.index).toBe("1");
    input.value = {
      ...input.value,
      items: [input.value.items![0]!, original[2]!],
    };
    await expect
      .poll(() => f.host.querySelectorAll("[data-live]").length)
      .toBe(2);
    expect(a.isConnected).toBe(false);
    expect(f.host.querySelector("[data-live=b]")).toBe(b);
    width.value = 30;
    input.value = {
      ...input.value,
      collapseFrom: "start",
      minVisibleItems: 1,
      style: { width: "30px" },
    };
    await expect
      .poll(() =>
        f.host.querySelector("[data-live=c]")?.getAttribute("data-index"),
      )
      .toBe("0");
    try {
      await expect
        .poll(() => f.host.querySelectorAll("[inert]").length)
        .toBe(0);
    } catch (error) {
      throw new Error(
        `${String(error)}\nFinal owned DOM: ${f.host.outerHTML}\nRects: ${JSON.stringify([...f.host.querySelectorAll<HTMLElement>(".semi-overflow-list, .semi-overflow-list-item")].map((node) => ({ cls: node.className, width: node.getBoundingClientRect().width, inert: node.inert, html: node.outerHTML })))}`,
      );
    }
  } finally {
    f.unmount();
  }
});

test("native Vapor For control retains nodes and records browser focus loss during DOM movement", async () => {
  const ids = shallowRef(["a", "b"]);
  const f = mountVapor(
    defineVaporComponent(() => (
      <For getKey={(id: string) => id} in={ids.value}>
        {{
          default: (id: ShallowRef<unknown>) => (
            <button data-control={String(id.value)}>{String(id.value)}</button>
          ),
        }}
      </For>
    )),
  );
  try {
    const b = f.host.querySelector<HTMLButtonElement>("[data-control=b]")!;
    b.focus();
    expect(document.activeElement).toBe(b);
    ids.value = ["b", "a"];
    await flush();
    expect(f.host.querySelector("[data-control=b]")).toBe(b);
    expect(document.activeElement).toBe(document.body);
    b.focus();
    expect(document.activeElement).toBe(b);
  } finally {
    f.unmount();
  }
});

test("OverflowList start measurement uses valid renderer indices and visible suffix indices reset locally", async () => {
  const calls: Array<{ item: OverflowItem; index: number }> = [];
  const width = shallowRef(60);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        collapseFrom="start"
        items={original}
        minVisibleItems={1}
        overflowRenderer={() => (
          <span style="display:block;width:20px;flex:none">+</span>
        )}
        style={{ width: `${width.value}px`, display: "flex" }}
        visibleItemRenderer={(item, index) => {
          calls.push({ item, index });
          return (
            <button
              data-safe-index={index}
              data-safe-key={String(item.key)}
              style="width:40px;flex:none;padding:0;border:0"
            >
              {String(item.key)}
            </button>
          );
        }}
      />
    )),
  );
  try {
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    expect(
      [...f.host.querySelectorAll<HTMLElement>("[data-safe-key]")].map(
        (node) => [node.dataset.safeKey, node.dataset.safeIndex],
      ),
    ).toEqual([["c", "0"]]);
    expect(calls.length).toBeGreaterThan(3);
    expect(
      calls.every(
        (call) =>
          original.includes(call.item) &&
          Number.isInteger(call.index) &&
          call.index >= 0 &&
          call.index < original.length,
      ),
    ).toBe(true);
    expect(
      calls.some((call) => call.item === original[2] && call.index === 2),
    ).toBe(true);
    expect(
      calls.some((call) => call.item === original[2] && call.index === 0),
    ).toBe(true);
    width.value = 160;
    await expect
      .poll(() =>
        [...f.host.querySelectorAll<HTMLElement>("[data-safe-key]")]
          .filter((node) => !node.closest("[inert]"))
          .map((node) => [node.dataset.safeKey, node.dataset.safeIndex]),
      )
      .toEqual([
        ["a", "0"],
        ["b", "1"],
        ["c", "2"],
      ]);
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    expect(
      calls.every((call) => call.index >= 0 && call.index < original.length),
    ).toBe(true);
  } finally {
    f.unmount();
  }
});
