import {
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import type { ShallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Layout from "../../packages/semi-ui-vue/src/components/layout/index.js";
import { layoutSiderRegistryKey } from "../../packages/semi-ui-vue/src/components/layout/context.js";
import type { LayoutSiderRegistry } from "../../packages/semi-ui-vue/src/components/layout/context.js";
import type {
  BasicLayoutProps,
  BasicProps,
  LayoutBreakpoint,
  SiderProps,
} from "../../packages/semi-ui-vue/src/components/layout/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("Layout and its four children use upstream roots, classes and native attributes", async () => {
  const props = shallowRef<BasicLayoutProps>({
    hasSider: false,
    className: "named",
    class: "native",
    style: { color: "red" },
    tagName: "article",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout {...props.value} aria-label="frame" data-layout="root">
        {() => (
          <>
            <Layout.Header data-layout="header" role="banner">
              {() => <span>header</span>}
            </Layout.Header>
            <Layout.Content aria-label="body" data-layout="content">
              {() => <span>content</span>}
            </Layout.Content>
            <Layout.Footer data-layout="footer" role="contentinfo">
              {() => <span>footer</span>}
            </Layout.Footer>
          </>
        )}
      </Layout>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(
      '[data-layout="root"]',
    )!;
    expect(root.tagName).toBe("ARTICLE");
    expect(root.classList.contains("semi-layout")).toBe(true);
    expect(root.classList.contains("named")).toBe(true);
    expect(root.classList.contains("native")).toBe(true);
    expect(root.classList.contains("semi-layout-has-sider")).toBe(false);
    expect(root.style.color).toBe("red");
    expect(root.getAttribute("aria-label")).toBe("frame");
    for (const [name, tag] of [
      ["header", "HEADER"],
      ["content", "MAIN"],
      ["footer", "FOOTER"],
    ]) {
      const node = fixture.host.querySelector<HTMLElement>(
        `[data-layout="${name}"]`,
      )!;
      expect(node.tagName).toBe(tag);
      expect(node.classList.contains(`semi-layout-${name}`)).toBe(true);
    }
    expect(
      fixture.host
        .querySelector('[data-layout="header"]')!
        .getAttribute("role"),
    ).toBe("banner");
    expect(
      fixture.host
        .querySelector('[data-layout="content"]')!
        .getAttribute("aria-label"),
    ).toBe("body");
    props.value = {
      hasSider: true,
      prefixCls: "custom-layout",
      tagName: "section",
      style: { color: "blue" },
    };
    await settle();
    const replacement = fixture.host.querySelector<HTMLElement>(
      '[data-layout="root"]',
    )!;
    expect(replacement.tagName).toBe("SECTION");
    expect(replacement.classList.contains("custom-layout-has-sider")).toBe(
      true,
    );
    expect(replacement.classList.contains("semi-layout")).toBe(false);
    expect(replacement.classList.contains("named")).toBe(false);
    expect(replacement.style.color).toBe("blue");
    props.value = { hasSider: undefined, tagName: undefined };
    await settle();
    expect(fixture.host.querySelector('[data-layout="root"]')?.tagName).toBe(
      "SECTION",
    );
    expect(
      fixture.host
        .querySelector('[data-layout="root"]')
        ?.classList.contains("semi-layout"),
    ).toBe(true);
    expect(fixture.host.querySelector(".semi-layout-has-sider")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Layout and Basic parts update native attrs, class, style and DOM handlers", async () => {
  const calls: string[] = [];
  const layoutProps = shallowRef<BasicLayoutProps>({
    id: "layout-one",
    title: "first",
    class: "native-one",
    className: "compat-one",
    style: { color: "red" },
    onClick: () => calls.push("layout-one"),
  });
  const headerProps = shallowRef<BasicProps>({
    title: "header-one",
    class: "header-native",
    className: "header-compat",
    style: { color: "blue" },
    onClick: (event) => {
      event.stopPropagation();
      calls.push("header-one");
    },
  });
  const contentProps = shallowRef<BasicProps>({
    title: "content-one",
    "aria-label": "content-label",
  });
  const footerProps = shallowRef<BasicProps>({ title: "footer-one" });
  const siderState = ref<string | undefined>("initial");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout {...layoutProps.value} data-native-layout="">
        {() => (
          <>
            <Layout.Header {...headerProps.value} data-native-header="" />
            <Layout.Content {...contentProps.value} data-native-content="" />
            <Layout.Footer {...footerProps.value} data-native-footer="" />
            <Layout.Sider data-native-sider="" data-state={siderState.value} />
          </>
        )}
      </Layout>
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLElement>(
      "[data-native-layout]",
    )!;
    const header = fixture.host.querySelector<HTMLElement>(
      "[data-native-header]",
    )!;
    const content = fixture.host.querySelector<HTMLElement>(
      "[data-native-content]",
    )!;
    const footer = fixture.host.querySelector<HTMLElement>(
      "[data-native-footer]",
    )!;
    const sider = fixture.host.querySelector<HTMLElement>(
      "[data-native-sider]",
    )!;
    expect(root.id).toBe("layout-one");
    expect(root.title).toBe("first");
    expect(root.classList.contains("native-one")).toBe(true);
    expect(root.classList.contains("compat-one")).toBe(true);
    expect(root.style.color).toBe("red");
    expect(header.title).toBe("header-one");
    expect(header.classList.contains("header-native")).toBe(true);
    expect(header.classList.contains("header-compat")).toBe(true);
    expect(header.style.color).toBe("blue");
    expect(content.getAttribute("aria-label")).toBe("content-label");
    expect(footer.title).toBe("footer-one");
    expect(sider.getAttribute("data-state")).toBe("initial");
    root.click();
    header.click();
    expect(calls).toEqual(["layout-one", "header-one"]);
    layoutProps.value = {
      title: "second",
      className: "compat-two",
      style: { color: "green" },
      onClick: () => calls.push("layout-two"),
    };
    headerProps.value = {
      title: "header-two",
      className: "header-next",
      style: { color: "purple" },
      onClick: (event) => {
        event.stopPropagation();
        calls.push("header-two");
      },
    };
    contentProps.value = { title: "content-two", "aria-label": undefined };
    footerProps.value = { title: undefined };
    siderState.value = "updated";
    await settle();
    expect(root.hasAttribute("id")).toBe(false);
    expect(root.title).toBe("second");
    expect(root.classList.contains("native-one")).toBe(false);
    expect(root.classList.contains("compat-one")).toBe(false);
    expect(root.classList.contains("compat-two")).toBe(true);
    expect(root.style.color).toBe("green");
    expect(header.title).toBe("header-two");
    expect(header.classList.contains("header-native")).toBe(false);
    expect(header.classList.contains("header-next")).toBe(true);
    expect(header.style.color).toBe("purple");
    expect(content.title).toBe("content-two");
    expect(content.hasAttribute("aria-label")).toBe(false);
    expect(footer.hasAttribute("title")).toBe(false);
    expect(sider.getAttribute("data-state")).toBe("updated");
    root.click();
    header.click();
    expect(calls).toEqual([
      "layout-one",
      "header-one",
      "layout-two",
      "header-two",
    ]);
    siderState.value = undefined;
    await settle();
    expect(sider.hasAttribute("data-state")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("changing Layout tagName remounts owned stateful content and restores Sider registration", async () => {
  const tag = ref<keyof HTMLElementTagNameMap>("section");
  let mounts = 0;
  let unmounts = 0;
  const Stateful = defineVaporComponent(() => {
    const count = ref(0);
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return (
      <button data-tag-state="" onClick={() => count.value++}>
        State {count.value}
      </button>
    );
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout data-tag-layout="" tagName={tag.value}>
        {() => (
          <>
            <Layout.Sider data-tag-sider="">
              {() => <span>Sider</span>}
            </Layout.Sider>
            <Layout.Content>{() => <Stateful />}</Layout.Content>
          </>
        )}
      </Layout>
    )),
  );
  try {
    await settle();
    const before =
      fixture.host.querySelector<HTMLElement>("[data-tag-layout]")!;
    const button = before.querySelector<HTMLButtonElement>("[data-tag-state]")!;
    const sider = before.querySelector<HTMLElement>("[data-tag-sider]")!;
    expect(before.tagName).toBe("SECTION");
    expect(before.classList.contains("semi-layout-has-sider")).toBe(true);
    button.click();
    button.focus();
    await settle();
    expect(button.textContent).toBe("State 1");
    expect(document.activeElement).toBe(button);
    tag.value = "article";
    await settle();
    const after = fixture.host.querySelector<HTMLElement>("[data-tag-layout]")!;
    const newButton =
      after.querySelector<HTMLButtonElement>("[data-tag-state]")!;
    expect(before.isConnected).toBe(false);
    expect(after.tagName).toBe("ARTICLE");
    expect(after.classList.contains("semi-layout-has-sider")).toBe(true);
    expect(after.querySelectorAll("[data-tag-sider]")).toHaveLength(1);
    expect(after.querySelector("[data-tag-sider]")).not.toBe(sider);
    expect(newButton).not.toBe(button);
    expect(newButton.textContent).toBe("State 0");
    expect(document.activeElement).toBe(document.body);
    expect(mounts).toBe(2);
    expect(unmounts).toBe(1);
  } finally {
    fixture.unmount();
  }
  expect(mounts).toBe(unmounts);
});

test("dynamic Siders register by instance, nested Layouts stay isolated and false does not mask a Sider", async () => {
  const first = ref(true);
  const second = ref(true);
  const nested = ref(true);
  const explicit = ref<boolean | undefined>(false);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout data-layout="outer" hasSider={explicit.value}>
        {() => (
          <>
            {first.value && (
              <Layout.Sider data-sider="first">
                {() => <span>first</span>}
              </Layout.Sider>
            )}
            {second.value && (
              <Layout.Sider data-sider="second">
                {() => <span>second</span>}
              </Layout.Sider>
            )}
            {nested.value && (
              <Layout data-layout="inner">
                {() => <Layout.Sider data-sider="nested" />}
              </Layout>
            )}
          </>
        )}
      </Layout>
    )),
  );
  try {
    await settle();
    const outer = fixture.host.querySelector<HTMLElement>(
      '[data-layout="outer"]',
    )!;
    const inner = fixture.host.querySelector<HTMLElement>(
      '[data-layout="inner"]',
    )!;
    expect(outer.classList.contains("semi-layout-has-sider")).toBe(true);
    expect(inner.classList.contains("semi-layout-has-sider")).toBe(true);
    first.value = false;
    await settle();
    expect(outer.classList.contains("semi-layout-has-sider")).toBe(true);
    nested.value = false;
    await settle();
    expect(outer.classList.contains("semi-layout-has-sider")).toBe(true);
    second.value = false;
    await settle();
    expect(outer.classList.contains("semi-layout-has-sider")).toBe(false);
    explicit.value = true;
    await settle();
    expect(outer.classList.contains("semi-layout-has-sider")).toBe(true);
    explicit.value = undefined;
    second.value = true;
    await settle();
    expect(outer.classList.contains("semi-layout-has-sider")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Layout registry ignores duplicate instance registration and unknown removal", async () => {
  let registry: LayoutSiderRegistry | undefined;
  const Probe = defineVaporComponent(() => {
    registry = inject(layoutSiderRegistryKey);
    return <span data-registry-probe="" />;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout data-registry-layout="">{() => <Probe />}</Layout>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(
      "[data-registry-layout]",
    )!;
    const probe = root.querySelector("[data-registry-probe]");
    expect(registry).toBeDefined();
    expect(root.classList.contains("semi-layout-has-sider")).toBe(false);
    const first = Symbol("first");
    const second = Symbol("second");
    registry!.remove(first);
    registry!.add(first);
    registry!.add(first);
    await settle();
    expect(root.classList.contains("semi-layout-has-sider")).toBe(true);
    registry!.add(second);
    registry!.remove(first);
    registry!.remove(first);
    await settle();
    expect(root.classList.contains("semi-layout-has-sider")).toBe(true);
    expect(root.querySelector("[data-registry-probe]")).toBe(probe);
    registry!.remove(second);
    await settle();
    expect(root.classList.contains("semi-layout-has-sider")).toBe(false);
    registry!.remove(second);
    await settle();
    expect(root.classList.contains("semi-layout-has-sider")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("each layout child also renders independently with custom prefix, native class and zero size", async () => {
  const headerTag = ref<keyof HTMLElementTagNameMap | undefined>("div");
  const custom = shallowRef({
    prefixCls: "custom-layout" as string | undefined,
    className: "compat" as string | undefined,
    style: { width: 0 },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div>
        <Layout.Header
          {...custom.value}
          class="native"
          data-part="header"
          tagName={headerTag.value}
        />
        <Layout.Content
          {...custom.value}
          data-part="content"
          tagName="article"
        />
        <Layout.Footer {...custom.value} data-part="footer" tagName="div" />
        <Layout.Sider {...custom.value} data-part="sider">
          {() => <span>standalone</span>}
        </Layout.Sider>
      </div>
    )),
  );
  try {
    const nodes = ["header", "content", "footer", "sider"].map(
      (part) =>
        fixture.host.querySelector<HTMLElement>(`[data-part="${part}"]`)!,
    );
    expect(nodes.map((node) => node.tagName)).toEqual([
      "DIV",
      "ARTICLE",
      "DIV",
      "ASIDE",
    ]);
    for (const [part, node] of ["header", "content", "footer", "sider"].map(
      (part, index) => [part, nodes[index]!] as const,
    )) {
      expect(node.classList.contains(`custom-layout-${part}`)).toBe(true);
      expect(node.classList.contains("compat")).toBe(true);
      expect(node.style.width).toBe("0px");
    }
    expect(nodes[0]!.classList.contains("native")).toBe(true);
    expect(
      nodes[3]!.querySelector(".custom-layout-sider-children > span")
        ?.textContent,
    ).toBe("standalone");
    headerTag.value = "nav";
    await settle();
    expect(fixture.host.querySelector('[data-part="header"]')?.tagName).toBe(
      "NAV",
    );
    headerTag.value = undefined;
    await settle();
    expect(fixture.host.querySelector('[data-part="header"]')?.tagName).toBe(
      "HEADER",
    );
    custom.value = {
      prefixCls: undefined,
      className: undefined,
      style: { width: 0 },
    };
    await settle();
    const header = fixture.host.querySelector<HTMLElement>(
      '[data-part="header"]',
    )!;
    expect(header.classList.contains("semi-layout-header")).toBe(true);
    expect(header.classList.contains("custom-layout-header")).toBe(false);
    expect(nodes[3]!.classList.contains("semi-layout-sider")).toBe(true);
    expect(nodes[3]!.classList.contains("compat")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("fragment, wrapper and keyed Sider updates retain child state and focus", async () => {
  const items = shallowRef(["a", "b"]);
  let mounts = 0;
  let unmounts = 0;
  const Stateful = defineVaporComponent<{ id: string }>(
    (props) => {
      const clicks = ref(0);
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <button data-id={props.id} onClick={() => clicks.value++}>
          {props.id}:{clicks.value}
        </button>
      );
    },
    { props: ["id"] },
  );
  const WrappedSider = defineVaporComponent(() => (
    <Layout.Sider data-sider="wrapped">
      {() => <span>wrapped</span>}
    </Layout.Sider>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout data-layout="keyed">
        {() => (
          <>
            <WrappedSider />
            <Layout.Content>
              {() => (
                <For getKey={(id: string) => id} in={items.value}>
                  {{
                    default: (id: ShallowRef<unknown>) => (
                      <Stateful id={id.value as string} />
                    ),
                  }}
                </For>
              )}
            </Layout.Content>
          </>
        )}
      </Layout>
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLElement>(
      '[data-layout="keyed"]',
    )!;
    expect(root.classList.contains("semi-layout-has-sider")).toBe(true);
    const button =
      fixture.host.querySelector<HTMLButtonElement>('[data-id="b"]')!;
    button.click();
    button.focus();
    items.value = ["a", "b", "c"];
    await settle();
    expect(fixture.host.querySelector('[data-id="b"]')).toBe(button);
    expect(button.textContent).toBe("b:1");
    expect(document.activeElement).toBe(button);
    expect(mounts).toBe(3);
    expect(unmounts).toBe(0);
    items.value = ["c", "b", "a"];
    await settle();
    expect(fixture.host.querySelector('[data-id="b"]')).toBe(button);
    expect(button.textContent).toBe("b:1");
    items.value = ["c"];
    await settle();
    expect(unmounts).toBe(2);
  } finally {
    fixture.unmount();
  }
});

test("keyed Sider lists add, reorder and remove instances without recursive registration", async () => {
  const ids = shallowRef(["a", "b"]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Layout data-list-layout="">
        {() => (
          <For getKey={(id: string) => id} in={ids.value}>
            {{
              default: (id: ShallowRef<unknown>) => (
                <Layout.Sider data-list-sider={id.value as string}>
                  {() => <span>{id.value as string}</span>}
                </Layout.Sider>
              ),
            }}
          </For>
        )}
      </Layout>
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLElement>("[data-list-layout]")!;
    const labels = () =>
      [...root.querySelectorAll<HTMLElement>("[data-list-sider]")].map((node) =>
        node.getAttribute("data-list-sider"),
      );
    expect(labels()).toEqual(["a", "b"]);
    expect(root.classList.contains("semi-layout-has-sider")).toBe(true);
    ids.value = ["a", "b", "c"];
    await settle();
    expect(labels()).toEqual(["a", "b", "c"]);
    ids.value = ["c", "b", "a"];
    await settle();
    expect(labels()).toEqual(["c", "b", "a"]);
    ids.value = ["c"];
    await settle();
    expect(labels()).toEqual(["c"]);
    expect(root.classList.contains("semi-layout-has-sider")).toBe(true);
    ids.value = [];
    await settle();
    expect(labels()).toEqual([]);
    expect(root.classList.contains("semi-layout-has-sider")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Sider forwards only data attributes, keeps its owned children and unregisters media listeners", async () => {
  const queries = [
    "(max-width: 575px)",
    "(min-width: 576px)",
    "(min-width: 768px)",
    "(min-width: 992px)",
    "(min-width: 1200px)",
    "(min-width: 1600px)",
  ];
  const records: Array<{
    query: string;
    removed: boolean;
    listener?: (event: { matches: boolean }) => void;
  }> = [];
  const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const record = { query, removed: false } as (typeof records)[number];
    records.push(record);
    return {
      matches: query === queries[2],
      addEventListener: (_name: string, listener: EventListener) => {
        record.listener = listener as unknown as (event: {
          matches: boolean;
        }) => void;
      },
      removeEventListener: () => {
        record.removed = true;
      },
    } as unknown as MediaQueryList;
  });
  const visible = ref(true);
  const callback = vi.fn();
  const nextCallback = vi.fn();
  const selected = shallowRef<LayoutBreakpoint[]>(["xs", "md"]);
  const activeCallback = shallowRef(callback);
  const unsupportedNative = {
    id: "not-forwarded",
    title: "not-forwarded",
  } as unknown as SiderProps;
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Layout>
          {() => (
            <Layout.Sider
              v-if={visible.value}
              {...unsupportedNative}
              aria-label="Navigation"
              breakpoint={selected.value}
              className="extra"
              data-sider="media"
              onBreakpoint={activeCallback.value}
              role="navigation"
              style={{ width: "96px" }}
            >
              {() => <button>inside</button>}
            </Layout.Sider>
          )}
        </Layout>
      )),
    );
    await settle();
    const sider = fixture.host.querySelector<HTMLElement>(
      '[data-sider="media"]',
    )!;
    expect(sider.tagName).toBe("ASIDE");
    expect(sider.classList.contains("semi-layout-sider")).toBe(true);
    expect(sider.classList.contains("extra")).toBe(true);
    expect(sider.style.width).toBe("96px");
    expect(sider.getAttribute("aria-label")).toBe("Navigation");
    expect(sider.hasAttribute("id")).toBe(false);
    expect(sider.hasAttribute("role")).toBe(false);
    expect(
      sider.querySelector(".semi-layout-sider-children > button")?.textContent,
    ).toBe("inside");
    expect(records.map(({ query }) => query)).toEqual([queries[0], queries[2]]);
    records[0]!.listener?.({ matches: true });
    expect(callback).toHaveBeenCalledWith("xs", true);
    selected.value = ["lg"];
    activeCallback.value = nextCallback;
    await settle();
    expect(records.map(({ query }) => query)).toEqual([
      queries[0],
      queries[2],
      queries[3],
    ]);
    expect(records.slice(0, 2).every(({ removed }) => removed)).toBe(true);
    records[2]!.listener?.({ matches: true });
    expect(nextCallback).toHaveBeenCalledWith("lg", true);
    visible.value = false;
    await settle();
    expect(fixture.host.querySelector('[data-sider="media"]')).toBeNull();
    expect(records.map(({ removed }) => removed)).toEqual([true, true, true]);
  } finally {
    fixture?.unmount();
    media.mockRestore();
  }
});

test("Sider uses the legacy MediaQueryList listener pair and cleans it on unmount", async () => {
  const listeners: Array<(event: { matches: boolean }) => void> = [];
  const removed: Array<(event: { matches: boolean }) => void> = [];
  const media = vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        media: query,
        matches: false,
        addListener: (listener: (event: { matches: boolean }) => void) =>
          listeners.push(listener),
        removeListener: (listener: (event: { matches: boolean }) => void) =>
          removed.push(listener),
      }) as unknown as MediaQueryList,
  );
  const callback = vi.fn();
  const visible = ref(true);
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Layout>
          {() => (
            <Layout.Sider
              v-if={visible.value}
              breakpoint={["xxl"]}
              onBreakpoint={callback}
            />
          )}
        </Layout>
      )),
    );
    await settle();
    expect(media).toHaveBeenCalledWith("(min-width: 1600px)");
    expect(callback).toHaveBeenCalledWith("xxl", false);
    expect(listeners).toHaveLength(1);
    listeners[0]!({ matches: true });
    expect(callback).toHaveBeenCalledWith("xxl", true);
    visible.value = false;
    await settle();
    expect(removed).toEqual(listeners);
  } finally {
    fixture?.unmount();
    media.mockRestore();
  }
});
