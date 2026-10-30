import {
  defineVaporComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Breadcrumb from "../../packages/semi-ui-vue/src/components/breadcrumb/index.js";
import { breadcrumbEntries } from "../../packages/semi-ui-vue/src/components/breadcrumb/data.js";
import { nativeBreadcrumbContent } from "../../packages/semi-ui-vue/src/components/breadcrumb/render.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import type {
  BreadcrumbContent,
  BreadcrumbItemSlots,
  BreadcrumbProps,
  BreadcrumbRenderResult,
  RouteProps,
} from "../../packages/semi-ui-vue/src/components/breadcrumb/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test("Breadcrumb native adapters preserve sparse sources, route identities and reject unsupported output", async () => {
  const route = { name: "a", key: 0 };
  expect(breadcrumbEntries([route])[0]?.origin).toBe(route);
  expect(breadcrumbEntries([route])[0]?.key).toBe("item-a-0");
  expect(breadcrumbEntries(["a"])[0]?.origin).toEqual({ name: "a" });
  expect(breadcrumbEntries(Array(3))).toEqual([]);
  for (const invalid of [[null], "abc", { length: 1 }])
    expect(() => breadcrumbEntries(invalid as unknown as RouteProps[])).toThrow(
      TypeError,
    );
  const node = document.createElement("b");
  expect(nativeBreadcrumbContent(node)).toBe(node);
  expect((nativeBreadcrumbContent(0) as Text).textContent).toBe("0");
  expect((nativeBreadcrumbContent("<safe>") as Text).textContent).toBe(
    "<safe>",
  );
  expect(nativeBreadcrumbContent([null, false, [,]])).toEqual([[], [], [[]]]);
  for (const invalid of [{}, h("b"), Symbol("x"), 1n, () => null])
    expect(() =>
      nativeBreadcrumbContent(invalid as BreadcrumbRenderResult),
    ).toThrow(/supported native/);
  for (const promise of [
    Promise.resolve(null),
    Promise.reject(new Error("expected")),
  ])
    expect(() =>
      nativeBreadcrumbContent(promise as unknown as BreadcrumbRenderResult),
    ).toThrow(/synchronous/);
  await Promise.resolve();
});
test("Breadcrumb Item keyed native content retains context, identity, focus and lifecycle", async () => {
  const ids = shallowRef(["a", "b", "c"]);
  const shown = shallowRef(true);
  const label = shallowRef("one");
  const compact = shallowRef(true);
  const source = shallowRef(false);
  let mounts = 0,
    unmounts = 0;
  const Owned = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      const value = inject("breadcrumb-context");
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <>
          <input
            data-id={props.id}
            value={`${value}:${props.id}:${label.value}`}
          />
          <b>{props.id}</b>
        </>
      );
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-owned");
      provide("breadcrumb-context", "provided");
      return (
        <Breadcrumb
          autoCollapse={false}
          compact={compact.value}
          routes={source.value ? ["route"] : []}
        >
          {() => (
            <>
              {shown.value ? (
                <For getKey={(id: string) => id} in={ids.value}>
                  {(id: ShallowRef<string>) => (
                    <Breadcrumb.Item>
                      {() => <Owned id={id.value} />}
                    </Breadcrumb.Item>
                  )}
                </For>
              ) : null}
              <Breadcrumb.Item>
                {() => (
                  <Breadcrumb>
                    {() => <Breadcrumb.Item children="nested" />}
                  </Breadcrumb>
                )}
              </Breadcrumb.Item>
            </>
          )}
        </Breadcrumb>
      );
    }),
  );
  try {
    await settle();
    const input =
      fixture.host.querySelector<HTMLInputElement>('[data-id="a"]')!;
    input.focus();
    expect(input.value).toBe("provided:a:one");
    label.value = "two";
    compact.value = false;
    ids.value = ["a", "c", "b", "d"];
    await settle();
    expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
    expect(input.value).toBe("provided:a:two");
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    expect(
      [...fixture.host.querySelectorAll("input")].map(
        (node) => node.dataset.id,
      ),
    ).toEqual(ids.value);
    ids.value = ["d", "b", "c", "a"];
    await settle();
    expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    ids.value = ["a", "c"];
    await settle();
    expect(unmounts).toBe(2);
    shown.value = false;
    await settle();
    expect(unmounts).toBe(4);
    shown.value = true;
    await settle();
    expect(mounts).toBe(6);
    source.value = true;
    await settle();
    expect(fixture.host.textContent).toBe("route");
    expect(unmounts).toBe(6);
    source.value = false;
    await settle();
    expect(mounts).toBe(8);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(mounts);
  expect(fixture.host.childNodes).toHaveLength(0);
});
test.each(["children", "icon", "separator"] as const)(
  "Breadcrumb Item %s factory owns native conditional content without coercion",
  async (field: "children" | "icon" | "separator") => {
    const label = shallowRef("one");
    const shown = shallowRef(true);
    let mounts = 0,
      unmounts = 0;
    const Child = defineVaporComponent(() => {
      const value = inject("breadcrumb-factory");
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <button>
          {value}:{label.value}
        </button>
      );
    });
    const render = vi.fn(() => (
      <>
        {shown.value ? <Child /> : null}
        <i>tail</i>
      </>
    ));
    const content = shallowRef<BreadcrumbContent>(render);
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provideAriaIdScope(`breadcrumb-${field}`);
        provide("breadcrumb-factory", "context");
        return (
          <Breadcrumb autoCollapse={false}>
            {() => (
              <>
                <Breadcrumb.Item {...{ [field]: content.value }} />
                <Breadcrumb.Item children="end" />
              </>
            )}
          </Breadcrumb>
        );
      }),
    );
    try {
      await settle();
      const button = fixture.host.querySelector("button")!;
      button.focus();
      label.value = "two";
      await settle();
      expect(button.textContent).toBe("context:two");
      expect(fixture.host.querySelector("button")).toBe(button);
      expect(document.activeElement).toBe(button);
      expect(render).toHaveBeenCalledTimes(1);
      shown.value = false;
      await settle();
      expect(unmounts).toBe(1);
      shown.value = true;
      await settle();
      expect(mounts).toBe(2);
      content.value = () => <b>replacement</b>;
      await settle();
      expect(unmounts).toBe(2);
      expect(fixture.host.querySelector("b")?.textContent).toBe("replacement");
    } finally {
      fixture.unmount();
    }
    expect(unmounts).toBe(mounts);
  },
);
test("Breadcrumb declared empty slots win and dynamic removal restores scalar content", async () => {
  const present = shallowRef(true);
  const compact = shallowRef(true);
  const defaultSlot = vi.fn(() => null);
  const separator = vi.fn(() => false);
  const icon = vi.fn((scope) => (
    <b class={scope.className} data-size={scope.size}>
      icon
    </b>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-empty-slots");
      return (
        <Breadcrumb compact={compact.value}>
          {() => (
            <>
              <Breadcrumb.Item
                children="fallback"
                icon="fallback-icon"
                separator="fallback-separator"
                v-slots={
                  present.value
                    ? ({
                        default: defaultSlot,
                        separator,
                        icon,
                      } as unknown as BreadcrumbItemSlots)
                    : {}
                }
              />
              <Breadcrumb.Item children="last" />
            </>
          )}
        </Breadcrumb>
      );
    }),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("iconlast");
    expect(defaultSlot).toHaveBeenCalledTimes(1);
    expect(separator).toHaveBeenCalledTimes(1);
    expect(icon).toHaveBeenCalledTimes(1);
    expect(fixture.host.querySelector("b")?.getAttribute("data-size")).toBe(
      "small",
    );
    compact.value = false;
    await settle();
    expect(fixture.host.querySelector("b")?.getAttribute("data-size")).toBe(
      "default",
    );
    present.value = false;
    await settle();
    expect(fixture.host.textContent).toBe(
      "fallback-iconfallbackfallback-separatorlast",
    );
    present.value = true;
    await settle();
    expect(fixture.host.textContent).toBe("iconlast");
  } finally {
    fixture.unmount();
  }
});
test("Breadcrumb custom more receives lazy item factories and preserved callback sequence", async () => {
  let mounts = 0,
    unmounts = 0;
  const itemClick = vi.fn();
  const parentClick = vi.fn();
  const used = shallowRef(false);
  const more = vi.fn((rest) => (
    <section data-rest={rest.length}>
      {used.value ? (
        rest.map((render: () => BreadcrumbRenderResult) => render())
      ) : (
        <b>summary</b>
      )}
    </section>
  ));
  const Owned = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <button>hidden-owned</button>;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-more-owned");
      return (
        <Breadcrumb maxItemCount={2} onClick={parentClick} renderMore={more}>
          {() => (
            <>
              <Breadcrumb.Item children="first" />
              <Breadcrumb.Item onClick={itemClick}>
                {() => <Owned />}
              </Breadcrumb.Item>
              <Breadcrumb.Item children="last" />
            </>
          )}
        </Breadcrumb>
      );
    }),
  );
  try {
    await settle();
    expect(mounts).toBe(0);
    expect(fixture.host.querySelector("section")?.dataset.rest).toBe("1");
    expect(more).toHaveBeenCalledTimes(1);
    used.value = true;
    await settle();
    expect(mounts).toBe(1);
    const event = new MouseEvent("click", { bubbles: true });
    fixture.host.querySelector("button")!.dispatchEvent(event);
    await settle();
    expect(itemClick).toHaveBeenCalledTimes(1);
    expect(parentClick).toHaveBeenCalledTimes(1);
    expect(fixture.host.querySelector(".semi-breadcrumb-collapse")).toBeNull();
    expect(mounts).toBe(2);
    expect(unmounts).toBe(1);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(mounts);
});
test("Breadcrumb observes only root order and stops queued observers on unmount", async () => {
  const Native = window.MutationObserver;
  const records: Array<{
    callback: MutationCallback;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const spy = vi
    .spyOn(window, "MutationObserver")
    .mockImplementation(function (callback) {
      const record = { callback, observe: vi.fn(), disconnect: vi.fn() };
      records.push(record);
      return {
        ...record,
        takeRecords: () => [],
      } as unknown as MutationObserver;
    });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Breadcrumb>
        {() => (
          <>
            <Breadcrumb.Item>{() => <b>a</b>}</Breadcrumb.Item>
            <Breadcrumb.Item>{() => <b>b</b>}</Breadcrumb.Item>
          </>
        )}
      </Breadcrumb>
    )),
  );
  try {
    await settle();
    expect(records).toHaveLength(1);
    expect(records[0]!.observe.mock.calls[0]?.[1]).toEqual({ childList: true });
    const native = new Native(() => {});
    fixture.unmount();
    expect(records[0]!.disconnect).toHaveBeenCalledTimes(1);
    records[0]!.callback([], native);
    await settle();
    expect(fixture.host.childNodes).toHaveLength(0);
    native.disconnect();
  } finally {
    spy.mockRestore();
  }
});
test("Breadcrumb without MutationObserver still registers mounting Items", async () => {
  const native = window.MutationObserver;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Breadcrumb>
        {() => <Breadcrumb.Item>{() => <b>native</b>}</Breadcrumb.Item>}
      </Breadcrumb>
    )),
  );
  try {
    await settle();
    expect(
      fixture.host.querySelector('[aria-current="page"]')?.textContent,
    ).toBe("native");
  } finally {
    fixture.unmount();
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      value: native,
    });
  }
});

test("Breadcrumb stable route renderer keeps identity on compact changes and tail append", async () => {
  const first = { name: "a", key: "a" };
  const routes = shallowRef<RouteProps[]>([first, { name: "b", key: "b" }]);
  const compact = shallowRef(true);
  let mounts = 0,
    unmounts = 0;
  const Child = defineVaporComponent<{ name: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return <input data-route={props.name} value={props.name} />;
    },
    { props: ["name"] },
  );
  const render = (route: RouteProps) => <Child name={route.name!} />;
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-stable-route");
      return (
        <Breadcrumb
          autoCollapse={false}
          compact={compact.value}
          renderItem={render}
          routes={routes.value}
        />
      );
    }),
  );
  try {
    await settle();
    const input =
      fixture.host.querySelector<HTMLInputElement>('[data-route="a"]')!;
    input.focus();
    compact.value = false;
    await settle();
    expect(fixture.host.querySelector('[data-route="a"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(2);
    expect(unmounts).toBe(0);
    routes.value = [...routes.value, { name: "c", key: "c" }];
    await settle();
    expect(fixture.host.querySelector('[data-route="a"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(3);
    expect(unmounts).toBe(0);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(3);
});
test("Breadcrumb non-direct nested Item preserves caller content without participating in outer order", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-nested-item");
      return (
        <Breadcrumb>
          {() => (
            <>
              <Breadcrumb.Item>
                {() => (
                  <div>
                    <Breadcrumb.Item
                      children="inner"
                      shouldRenderSeparator={false}
                    />
                  </div>
                )}
              </Breadcrumb.Item>
              <Breadcrumb.Item children="outer-last" />
            </>
          )}
        </Breadcrumb>
      );
    }),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("inner/outer-last");
    expect(fixture.host.querySelectorAll('[aria-current="page"]')).toHaveLength(
      1,
    );
    expect(
      fixture.host.querySelector('[aria-current="page"]')?.textContent,
    ).toBe("outer-last");
  } finally {
    fixture.unmount();
  }
});

test("Breadcrumb stable renderMore survives unrelated compact updates with native focus and lifecycle", async () => {
  const compact = shallowRef(true);
  let mounts = 0,
    unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <input data-more-owned="" value="stable" />;
  });
  const renderMore = () => <Child />;
  const routes = ["first", "hidden", "last"];
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-more-identity");
      return (
        <Breadcrumb
          compact={compact.value}
          maxItemCount={2}
          renderMore={renderMore}
          routes={routes}
        />
      );
    }),
  );
  try {
    await settle();
    const input = fixture.host.querySelector("input")!;
    input.focus();
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
    const mountedBaseline = mounts;
    const unmountedBaseline = unmounts;
    compact.value = false;
    await settle();
    expect(fixture.host.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(mountedBaseline);
    expect(unmounts).toBe(unmountedBaseline);
    compact.value = true;
    await settle();
    expect(fixture.host.querySelector("input")).toBe(input);
    expect(mounts).toBe(mountedBaseline);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(mounts);
});

test("Breadcrumb stable root separator factory preserves DOM focus and lifecycle on compact changes", async () => {
  const compact = shallowRef(true);
  let mounts = 0,
    unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <input data-root-separator="" value="separator" />;
  });
  const separator = () => <Child />;
  const routes = ["first", "last"];
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-separator-identity");
      return (
        <Breadcrumb
          compact={compact.value}
          routes={routes}
          separator={separator}
        />
      );
    }),
  );
  try {
    await settle();
    const input = fixture.host.querySelector("input")!;
    input.focus();
    expect(mounts).toBe(1);
    compact.value = false;
    await settle();
    expect(fixture.host.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(1);
});
