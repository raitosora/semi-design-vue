import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onScopeDispose,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type {
  OverflowListScrollProps,
  OverflowListScrollSlots,
  OverflowListCollapseSlots,
  OverflowItem,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import { mountVapor } from "../support/mount-vapor.js";

const flush = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};

// Keep the tuple argument stable: changing a named outlet must exercise slot
// ownership rather than incidentally replace the callback through an IO event.
function silenceIntersection() {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("IntersectionObserver", Observer);
}

test.each(["start", "end"] as const)(
  "OverflowList scroll toggling only the %s slot preserves the opposite raw part owner",
  async (side: "start" | "end") => {
    silenceIntersection();
    const opposite = side === "start" ? "end" : "start";
    const signal = ref("initial");
    const mounted = vi.fn();
    const disposed = vi.fn();
    const slots = shallowRef<OverflowListScrollSlots>({});
    const Part = defineVaporComponent((props: { side: string }) => {
      const ownedSide = props.side;
      const clicks = ref(0);
      onMounted(() => mounted(ownedSide));
      onUnmounted(() => disposed(ownedSide));
      return (
        <button
          data-raw-part={ownedSide}
          onClick={() => clicks.value++}
          style="width:40px;flex:none;padding:0;border:0"
        >
          {signal.value}:{clicks.value}
        </button>
      );
    });
    const renderer = vi.fn<
      NonNullable<OverflowListScrollProps["overflowRenderer"]>
    >(() => [<Part side="start" />, <Part side="end" />]);
    const f = mountVapor(
      defineVaporComponent(() => (
        <OverflowList
          items={[{ key: "a" }]}
          overflowRenderer={renderer}
          renderMode="scroll"
          style="width:180px;display:flex"
          v-slots={slots.value}
          visibleItemRenderer={() => <span style="width:40px">Item</span>}
          wrapperStyle="width:100px;flex:none;display:flex;overflow-x:scroll"
        />
      )),
    );
    let unmounted = false;
    try {
      await flush();
      expect(renderer).toHaveBeenCalledTimes(1);
      expect(mounted.mock.calls.map(([value]) => value).sort()).toEqual([
        "end",
        "start",
      ]);
      const other = f.host.querySelector<HTMLButtonElement>(
        `[data-raw-part="${opposite}"]`,
      )!;
      other.click();
      await flush();
      expect(other.textContent).toBe("initial:1");

      slots.value = {
        [side === "start" ? "overflowStart" : "overflowEnd"]: () => (
          <span data-named-part={side} style="width:40px;display:block">
            Named
          </span>
        ),
      };
      await flush();
      expect(
        f.host.querySelector(`[data-named-part="${side}"]`),
      ).not.toBeNull();
      expect(f.host.querySelector(`[data-raw-part="${opposite}"]`)).toBe(other);
      expect(disposed.mock.calls.map(([value]) => value)).not.toContain(
        opposite,
      );
      signal.value = "changed";
      other.click();
      await flush();
      expect(other.textContent).toBe("changed:2");

      slots.value = {};
      await flush();
      const returned = f.host.querySelector<HTMLButtonElement>(
        `[data-raw-part="${side}"]`,
      )!;
      expect(returned).not.toBeNull();
      signal.value = "returned";
      returned.click();
      await flush();
      expect(returned.textContent).toBe("returned:1");
      expect(other.textContent).toBe("returned:2");
      expect(f.host.querySelectorAll("[data-raw-part]")).toHaveLength(2);
      expect(f.host.querySelectorAll("[data-named-part]")).toHaveLength(0);

      f.unmount();
      unmounted = true;
      expect(f.host.childNodes.length).toBe(0);
      expect(disposed.mock.calls.map(([value]) => value).sort()).toEqual(
        mounted.mock.calls.map(([value]) => value).sort(),
      );
    } finally {
      if (!unmounted) f.unmount();
      vi.unstubAllGlobals();
    }
  },
);

test("OverflowList scroll two native side slots leave the raw callback unexecuted", async () => {
  silenceIntersection();
  const renderer = vi.fn<
    NonNullable<OverflowListScrollProps["overflowRenderer"]>
  >(() => [<button>Unused start</button>, <button>Unused end</button>]);
  const startSlot = vi.fn(() => <button data-named-part="start">Start</button>);
  const endSlot = vi.fn(() => <button data-named-part="end">End</button>);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={[{ key: "a" }]}
        overflowRenderer={renderer}
        renderMode="scroll"
        style="width:180px;display:flex"
        v-slots={{ overflowStart: startSlot, overflowEnd: endSlot }}
      />
    )),
  );
  try {
    await flush();
    expect(renderer).not.toHaveBeenCalled();
    expect(startSlot).toHaveBeenCalledTimes(1);
    expect(endSlot).toHaveBeenCalledTimes(1);
    expect(f.host.querySelectorAll("[data-named-part]")).toHaveLength(2);
    expect(f.host.querySelectorAll("button")).toHaveLength(2);
  } finally {
    f.unmount();
    vi.unstubAllGlobals();
  }
});

test("OverflowList scroll initially overridden side releases every lazily allocated raw part scope", async () => {
  silenceIntersection();
  const allocated: string[] = [];
  const released: string[] = [];
  const Part = defineVaporComponent((props: { side: string }) => {
    const ownedSide = props.side;
    allocated.push(ownedSide);
    onScopeDispose(() => released.push(ownedSide));
    return <button data-raw-part={ownedSide}>{ownedSide}</button>;
  });
  const renderer = vi.fn<
    NonNullable<OverflowListScrollProps["overflowRenderer"]>
  >(() => [<Part side="start" />, <Part side="end" />]);
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={[{ key: "a" }]}
        overflowRenderer={renderer}
        renderMode="scroll"
        style="width:180px;display:flex"
        v-slots={{
          overflowStart: () => <span data-named-part="start">Named start</span>,
        }}
      />
    )),
  );
  let unmounted = false;
  try {
    await flush();
    expect(renderer).toHaveBeenCalledTimes(1);
    expect([...allocated].sort()).toEqual(["end", "start"]);
    expect(f.host.querySelector('[data-raw-part="start"]')).toBeNull();
    expect(f.host.querySelector('[data-raw-part="end"]')).not.toBeNull();
    f.unmount();
    unmounted = true;
    expect(f.host.childNodes.length).toBe(0);
    expect([...released].sort()).toEqual(["end", "start"]);
  } finally {
    if (!unmounted) f.unmount();
    vi.unstubAllGlobals();
  }
});

test("OverflowList public slot scope rejects runtime replacement and deletion while live getters and caller item identity stay intact", async () => {
  const first = { key: "a", label: "A" };
  const second = { key: "b", label: "B" };
  const items = shallowRef<OverflowItem[]>([first, second]);
  let itemScope!: Parameters<
    NonNullable<OverflowListCollapseSlots["visibleItem"]>
  >[0];
  let overflowScope!: Parameters<
    NonNullable<OverflowListCollapseSlots["overflow"]>
  >[0];
  const diagnostics: unknown[][] = [];
  const warning = vi.spyOn(console, "warn").mockImplementation((...args) => {
    diagnostics.push(args);
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={items.value}
        style="width:60px;display:flex"
        v-slots={{
          visibleItem: (scope) => {
            if (scope.item.key === "a") itemScope = scope;
            return (
              <button
                data-scope-item={String(scope.item.key)}
                style="width:40px;padding:0;border:0"
              >
                {String(scope.item.label)}:{scope.index}
              </button>
            );
          },
          overflow: (scope) => {
            overflowScope = scope;
            return (
              <span data-scope-overflow style="width:20px;display:block">
                {scope.items.length}
              </span>
            );
          },
        }}
      />
    )),
  );
  try {
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    expect(itemScope.item).toBe(first);
    expect(itemScope.index).toBe(0);
    expect(overflowScope.items).toEqual([second]);
    Reflect.set(itemScope, "index", 999);
    Reflect.deleteProperty(itemScope, "index");
    Reflect.set(overflowScope, "items", []);
    Reflect.deleteProperty(overflowScope, "items");
    expect(Reflect.has(itemScope, "index")).toBe(true);
    expect(Reflect.get(itemScope, "index")).toBe(0);
    expect(Reflect.has(overflowScope, "items")).toBe(true);
    expect(Reflect.get(overflowScope, "items")).toEqual([second]);
    expect(Object.getOwnPropertyDescriptor(itemScope, "index")?.get).toBeTypeOf(
      "function",
    );
    expect(
      Object.getOwnPropertyDescriptor(overflowScope, "items")?.get,
    ).toBeTypeOf("function");

    // The scope's properties are readonly; caller-owned records retain the
    // upstream object identity and are not converted into deep readonly data.
    itemScope.item.label = "Caller mutation";
    expect(first.label).toBe("Caller mutation");
    const replacement = { key: "a", label: "Replaced" };
    const newSecond = { key: "b", label: "New B" };
    const third = { key: "c", label: "C" };
    items.value = [replacement, newSecond, third];
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    await expect
      .poll(() => f.host.querySelector("[data-scope-item=a]")?.textContent)
      .toBe("Replaced:0");
    expect(itemScope.item).toBe(replacement);
    expect(overflowScope.items).toEqual([newSecond, third]);
    expect(f.host.querySelector("[data-scope-overflow]")?.textContent).toBe(
      "2",
    );
    expect(diagnostics.every((args) => /readonly/i.test(String(args[0])))).toBe(
      true,
    );
  } finally {
    f.unmount();
    warning.mockRestore();
  }
});

test("OverflowList both scroll outlet scopes ignore runtime writes and deletion without deep readonly item conversion", async () => {
  let deliver!: () => void;
  class Observer {
    readonly targets = new Set<Element>();
    constructor(callback: IntersectionObserverCallback) {
      deliver = () => {
        callback(
          [...this.targets].map(
            (target) =>
              ({
                target,
                isIntersecting:
                  (target as HTMLElement).dataset.scrollkey === "a",
                boundingClientRect: target.getBoundingClientRect(),
              }) as IntersectionObserverEntry,
          ),
          this as unknown as IntersectionObserver,
        );
      };
    }
    observe(target: Element) {
      this.targets.add(target);
    }
    unobserve(target: Element) {
      this.targets.delete(target);
    }
    disconnect() {
      this.targets.clear();
    }
  }
  vi.stubGlobal("IntersectionObserver", Observer);
  const first = { key: "a", label: "A" };
  const second = { key: "b", label: "B" };
  const items = shallowRef<OverflowItem[]>([first, second]);
  const scopes = new Map<"start" | "end", { readonly items: OverflowItem[] }>();
  const diagnostics: unknown[][] = [];
  const warning = vi.spyOn(console, "warn").mockImplementation((...args) => {
    diagnostics.push(args);
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={items.value}
        renderMode="scroll"
        style="width:120px;display:flex"
        v-slots={{
          visibleItem: (scope) => (
            <span style="width:40px;display:block">
              {String(scope.item.label)}
            </span>
          ),
          overflowStart: (scope) => {
            scopes.set("start", scope);
            return (
              <span data-scope-start style="width:20px;display:block">
                {scope.items.length}
              </span>
            );
          },
          overflowEnd: (scope) => {
            scopes.set("end", scope);
            return (
              <span data-scope-end style="width:20px;display:block">
                {scope.items.length}
              </span>
            );
          },
        }}
        wrapperStyle="width:80px;flex:none;display:flex"
      />
    )),
  );
  try {
    await flush();
    deliver();
    await flush();
    const start = scopes.get("start")!;
    const end = scopes.get("end")!;
    expect(start.items).toEqual([]);
    expect(end.items).toEqual([second]);
    expect(end.items[0]).toBe(second);
    for (const scope of [start, end]) {
      const before = scope.items;
      Reflect.set(scope, "items", [{ key: "wrong" }]);
      Reflect.deleteProperty(scope, "items");
      expect(Reflect.has(scope, "items")).toBe(true);
      expect(Reflect.get(scope, "items")).toBe(before);
      expect(Object.getOwnPropertyDescriptor(scope, "items")?.get).toBeTypeOf(
        "function",
      );
    }
    end.items[0]!.label = "Caller mutation";
    expect(second.label).toBe("Caller mutation");
    const replacement = { key: "b", label: "Replaced" };
    items.value = [first, replacement];
    await flush();
    deliver();
    await flush();
    expect(end.items).toEqual([replacement]);
    expect(end.items[0]).toBe(replacement);
    expect(start.items).toEqual([]);
    expect(f.host.querySelector("[data-scope-end]")?.textContent).toBe("1");
    expect(diagnostics.every((args) => /readonly/i.test(String(args[0])))).toBe(
      true,
    );
  } finally {
    f.unmount();
    warning.mockRestore();
    vi.unstubAllGlobals();
  }
});
