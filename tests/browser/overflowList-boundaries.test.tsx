import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import OverflowList from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import type {
  OverflowItem,
  OverflowListCollapseProps,
  OverflowListProps,
} from "../../packages/semi-ui-vue/src/components/overflowList/index.js";
import ConfigProvider, {
  type ConfigProviderProps,
} from "../../packages/semi-ui-vue/src/components/configProvider/index.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import { mountVapor } from "../support/mount-vapor.js";

const flush = async () => {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
};
const source = [{ key: "a" }, { key: "b" }, { key: "c" }];
const renderer = (item: OverflowItem) => (
  <button
    data-key={String(item.key)}
    style="width:40px;padding:0;border:0;flex:none"
  >
    {String(item.key)}
  </button>
);

async function invalid(input: unknown) {
  const errors: unknown[] = [];
  const diagnostics: string[] = [];
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <OverflowList {...(input as OverflowListProps)} />
    )),
  );
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = (message) => diagnostics.push(message);
  try {
    app.mount(host);
    await nextTick();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(Error);
    expect(diagnostics).toEqual([
      "Vapor component setup() returned non-block value, and has no render function.",
    ]);
    expect(
      host.querySelectorAll("[data-scrollkey], [inert], button"),
    ).toHaveLength(0);
    return errors[0] as Error;
  } finally {
    app.unmount();
    host.remove();
  }
}

test("OverflowList rejects malformed runtime items, keys, dimensions, modes and callbacks before creating content", async () => {
  for (const [input, pattern] of [
    [{ items: null }, /array/],
    [{ items: "text" }, /array/],
    [{ items: [null] }, /records/],
    [{ items: ["text"] }, /records/],
    [{ items: [[]] }, /records/],
    [{ items: [{ key: null }] }, /keys/],
    [{ items: [{ key: {} }] }, /keys/],
    [{ items: [{ key: Infinity }] }, /keys/],
    [{ items: [{ key: 1 }, { key: "1" }] }, /unique/],
    [{ items: [{ key: "a" }, { key: "a" }] }, /unique/],
    [{ minVisibleItems: -1 }, /minVisibleItems/],
    [{ minVisibleItems: Infinity }, /minVisibleItems/],
    [{ minVisibleItems: NaN }, /minVisibleItems/],
    [{ threshold: -0.1 }, /threshold/],
    [{ threshold: 1.1 }, /threshold/],
    [{ threshold: NaN }, /threshold/],
    [{ itemKey: {} }, /itemKey/],
    [{ visibleItemRenderer: "function" }, /visibleItemRenderer/],
    [{ overflowRenderer: {} }, /overflowRenderer/],
    [{ onOverflow: 1 }, /onOverflow/],
    [{ onIntersect: {} }, /onIntersect/],
    [{ onVisibleStateChange: [1] }, /onVisibleStateChange/],
    [{ renderMode: "invalid" }, /renderMode/],
    [{ collapseFrom: "middle" }, /collapseFrom/],
    [{ overflowRenderDirection: "invalid" }, /overflowRenderDirection/],
  ] as const) {
    expect((await invalid(input)).message).toMatch(pattern);
  }
});

test("OverflowList absent items, explicit undefined and null default renderers produce safe empty native content", async () => {
  const input = shallowRef<OverflowListProps>({});
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList {...input.value} style="width:100px;display:flex" />
    )),
  );
  try {
    await flush();
    expect(f.host.querySelector(".semi-overflow-list")).not.toBeNull();
    expect(f.host.textContent).toBe("");
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    input.value = {
      items: source,
      visibleItemRenderer: undefined,
      overflowRenderer: undefined,
    };
    await expect
      .poll(() => f.host.querySelectorAll(".semi-overflow-list-item").length)
      .toBe(3);
    expect(f.host.textContent).toBe("");
    input.value = { items: undefined };
    await expect
      .poll(() => f.host.querySelectorAll(".semi-overflow-list-item").length)
      .toBe(0);
    input.value = {};
    await flush();
    await expect.poll(() => f.host.querySelectorAll("[inert]").length).toBe(0);
    expect(
      f.host.querySelector(".semi-overflow-list")?.getAttribute("role"),
    ).toBeNull();
    expect(
      f.host.querySelector(".semi-overflow-list")?.getAttribute("tabindex"),
    ).toBeNull();
  } finally {
    f.unmount();
  }
});

test("OverflowList captures global defaults and explicit undefined restores them without duplicate native notification", async () => {
  const notified = vi.fn();
  semiGlobal.configure({
    overrideDefaultProps: {
      OverflowList: {
        collapseFrom: "start",
        minVisibleItems: 2,
        onOverflow: notified,
      },
    },
  });
  const input = shallowRef<OverflowListProps>({
    items: source,
    collapseFrom: undefined,
    minVisibleItems: undefined,
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        style="width:40px;display:flex"
        visibleItemRenderer={renderer}
      />
    )),
  );
  const visible = () =>
    [...f.host.querySelectorAll<HTMLElement>("[data-key]")]
      .filter((node) => !node.closest("[inert]"))
      .map((node) => node.dataset.key);
  try {
    semiGlobal.configure({});
    await expect.poll(visible).toEqual(["b", "c"]);
    expect(notified).toHaveBeenCalledExactlyOnceWith([{ key: "a" }]);
    input.value = { items: source, collapseFrom: "end", minVisibleItems: 0 };
    await expect.poll(visible).toEqual(["a"]);
    input.value = { items: source };
    await expect.poll(visible).toEqual(["b", "c"]);
    expect(notified.mock.calls).toHaveLength(3);
  } finally {
    f.unmount();
    semiGlobal.configure({});
  }
});

test("OverflowList direct property and callback keys retain native nodes and missing keys use index fallback", async () => {
  const source = [
    { id: "a", metadata: { id: "a" }, text: "A" },
    { id: "b", metadata: { id: "b" }, text: "B" },
  ];
  const input = shallowRef<OverflowListProps>({ items: source, itemKey: "id" });
  const f = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...input.value}
        style="width:200px;display:flex"
        visibleItemRenderer={(item: OverflowItem) => (
          <span data-direct={String(item.id)} style="display:block;width:30px">
            {String(item.text)}
          </span>
        )}
      />
    )),
  );
  try {
    await expect
      .poll(() => f.host.querySelectorAll("[data-direct]").length)
      .toBe(2);
    const a = f.host
      .querySelector("[data-direct=a]")
      ?.closest(".semi-overflow-list-item");
    input.value = { items: [source[1]!, source[0]!], itemKey: "id" };
    await flush();
    expect(
      f.host
        .querySelector("[data-direct=a]")
        ?.closest(".semi-overflow-list-item"),
    ).toBe(a);
    input.value = {
      ...input.value,
      itemKey: (item) => (item.metadata as { id: string }).id,
    };
    await flush();
    expect(
      f.host
        .querySelector("[data-direct=a]")
        ?.closest(".semi-overflow-list-item"),
    ).toBe(a);
    input.value = {
      items: [{ text: "Index zero" }, { key: undefined, text: "Index one" }],
    };
    await expect
      .poll(() => f.host.textContent)
      .toContain("Index zeroIndex one");
  } finally {
    f.unmount();
  }
});

test("OverflowList rejects asynchronous renderer output through the owning app error boundary and clears partial DOM on unmount", async () => {
  const errors: unknown[] = [];
  const diagnostics: string[] = [];
  const host = document.createElement("div");
  document.body.append(host);
  const asyncProps = {
    items: [{ key: "async" }],
    visibleItemRenderer: () => Promise.resolve("unsupported"),
  } as unknown as OverflowListProps;
  const app = createVaporApp(
    defineVaporComponent(() => <OverflowList {...asyncProps} />),
  );
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = (message) => diagnostics.push(message);
  try {
    app.mount(host);
    await nextTick();
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toMatch(/synchronous native content/);
    expect(
      diagnostics.every(
        (message) =>
          message ===
          "Vapor component setup() returned non-block value, and has no render function.",
      ),
    ).toBe(true);
    expect(host.querySelector("button")).toBeNull();
    expect(host.textContent).not.toContain("unsupported");
    app.unmount();
    await nextTick();
    expect(host.childElementCount).toBe(0);
  } finally {
    if (host.childElementCount) app.unmount();
    host.remove();
  }
});

test("OverflowList inside actual ConfigProvider preserves captured defaults and isolates apps during provider and caller changes", async () => {
  const provider = shallowRef<ConfigProviderProps>({ direction: "rtl" });
  const input = shallowRef<OverflowListCollapseProps>({ items: source });
  semiGlobal.configure({
    overrideDefaultProps: {
      OverflowList: { collapseFrom: "start", minVisibleItems: 2 },
    },
  });
  const first = mountVapor(
    defineVaporComponent(() => (
      <ConfigProvider {...provider.value}>
        {() => (
          <OverflowList
            {...input.value}
            style="width:40px;display:flex"
            visibleItemRenderer={renderer}
          />
        )}
      </ConfigProvider>
    )),
  );
  semiGlobal.configure({});
  const second = mountVapor(
    defineVaporComponent(() => (
      <ConfigProvider direction="ltr">
        {() => (
          <OverflowList
            items={source}
            style="width:40px;display:flex"
            visibleItemRenderer={renderer}
          />
        )}
      </ConfigProvider>
    )),
  );
  const visible = (host: Element) =>
    [...host.querySelectorAll<HTMLElement>("[data-key]")]
      .filter((node) => !node.closest("[inert]"))
      .map((node) => node.dataset.key);
  try {
    await expect.poll(() => visible(first.host)).toEqual(["b", "c"]);
    await expect.poll(() => visible(second.host)).toEqual(["a"]);
    const root = first.host.querySelector<HTMLElement>(".semi-overflow-list")!;
    expect(getComputedStyle(root).direction).toBe("rtl");
    input.value = { items: source, collapseFrom: "end", minVisibleItems: 0 };
    await expect.poll(() => visible(first.host)).toEqual(["a"]);
    provider.value = { direction: "ltr" };
    await expect.poll(() => getComputedStyle(root).direction).toBe("ltr");
    input.value = {
      items: source,
      collapseFrom: undefined,
      minVisibleItems: undefined,
    };
    await expect.poll(() => visible(first.host)).toEqual(["b", "c"]);
    provider.value = { direction: undefined };
    await expect.poll(() => first.host.querySelector("[dir]")).toBeNull();
    expect(getComputedStyle(root).direction).toBe("ltr");
    input.value = { items: source };
    provider.value = {};
    await expect
      .poll(() => first.host.querySelector("[dir]")?.getAttribute("dir"))
      .toBe("ltr");
    expect(visible(first.host)).toEqual(["b", "c"]);
    expect(visible(second.host)).toEqual(["a"]);
    expect(first.host.querySelector(".semi-overflow-list")).toBe(root);
    expect(root.clientWidth).toBe(40);
  } finally {
    first.unmount();
    second.unmount();
    semiGlobal.configure({});
  }
});

test("OverflowList invokes Vue merged event listeners and runtime global callback arrays without duplicate notifications", async () => {
  const order: string[] = [];
  const left = vi.fn((_items: OverflowItem[]) => order.push("left"));
  const right = vi.fn((_items: OverflowItem[]) => order.push("right"));
  const merged = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        {...{ onOverflow: left }}
        {...{ onOverflow: right }}
        {...{ onOverflow: left }}
        items={source}
        style="width:40px;display:flex"
        visibleItemRenderer={renderer}
      />
    )),
  );
  try {
    await expect.poll(() => left.mock.calls.length).toBe(1);
    expect(right).toHaveBeenCalledExactlyOnceWith(source.slice(1));
    expect(left).toHaveBeenCalledExactlyOnceWith(source.slice(1));
    expect(order).toEqual(["left", "right"]);
  } finally {
    merged.unmount();
  }
  const first = vi.fn();
  const second = vi.fn();
  semiGlobal.configure({
    overrideDefaultProps: {
      OverflowList: {
        onOverflow: [first, second] as unknown as (
          items: OverflowItem[],
        ) => void,
      },
    },
  });
  const defaults = mountVapor(
    defineVaporComponent(() => (
      <OverflowList
        items={source}
        style="width:40px;display:flex"
        visibleItemRenderer={renderer}
      />
    )),
  );
  try {
    await expect.poll(() => first.mock.calls.length).toBe(1);
    expect(first).toHaveBeenCalledExactlyOnceWith(source.slice(1));
    expect(second).toHaveBeenCalledExactlyOnceWith(source.slice(1));
  } finally {
    defaults.unmount();
    semiGlobal.configure({});
  }
});
