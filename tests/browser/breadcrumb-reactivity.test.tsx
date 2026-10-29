import {
  createVaporApp,
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onScopeDispose,
  onUnmounted,
  provide,
  shallowRef,
  watchEffect,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import Breadcrumb from "../../packages/semi-ui-vue/src/components/breadcrumb/index.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import type {
  BreadcrumbItemRenderer,
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

test.each(["renderItem", "children"] as const)(
  "Breadcrumb stable %s factory tracks scalar output and title branch changes",
  async (mode) => {
    const value = shallowRef<BreadcrumbRenderResult>("before");
    let runs = 0,
      disposals = 0;
    const render = () => {
      runs++;
      onScopeDispose(() => disposals++);
      return value.value;
    };
    const routes = [{ key: "route", name: "route" }];
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provideAriaIdScope(`breadcrumb-reactive-${mode}`);
        return mode === "renderItem" ? (
          <Breadcrumb renderItem={render} routes={routes} />
        ) : (
          <Breadcrumb>{() => <Breadcrumb.Item children={render} />}</Breadcrumb>
        );
      }),
    );
    try {
      await settle();
      expect(fixture.host.textContent).toBe("before");
      expect(fixture.host.querySelector(".semi-typography")).not.toBeNull();
      for (const next of [
        "after",
        2,
        0,
        null,
        false,
        undefined,
        "restored",
      ] as const) {
        value.value = next;
        await settle();
        expect(fixture.host.textContent).toBe(
          typeof next === "string" ? next : next === 2 ? "2" : "",
        );
        expect(!!fixture.host.querySelector(".semi-typography")).toBe(
          typeof next === "string",
        );
        expect(disposals).toBe(runs - 1);
      }
    } finally {
      fixture.unmount();
    }
    expect(disposals).toBe(runs);
  },
);

test("Breadcrumb native factory keeps For context DOM focus and lifecycle on unrelated options updates", async () => {
  const compact = shallowRef(true),
    label = shallowRef("before"),
    rows = shallowRef(["a", "b"]);
  const tooltip = shallowRef<BreadcrumbProps["showTooltip"]>(true);
  let mounts = 0,
    unmounts = 0;
  const Owned = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      const prefix = inject("breadcrumb-reactivity-context");
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <input
          data-owned-id={props.id}
          value={`${prefix}:${props.id}:${label.value}`}
        />
      );
    },
    { props: ["id"] },
  );
  const render = () => (
    <For getKey={(id: string) => id} in={rows.value}>
      {(id: ShallowRef<string>) => <Owned id={id.value} />}
    </For>
  );
  const routes = [{ key: "stable", name: "route" }];
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-reactive-native");
      provide("breadcrumb-reactivity-context", "provided");
      return (
        <Breadcrumb
          compact={compact.value}
          renderItem={render}
          routes={routes}
          showTooltip={tooltip.value}
        />
      );
    }),
  );
  try {
    await settle();
    const input = fixture.host.querySelector<HTMLInputElement>(
      '[data-owned-id="a"]',
    )!;
    input.focus();
    expect(input.value).toBe("provided:a:before");
    expect(mounts).toBe(2);
    compact.value = false;
    tooltip.value = { width: 71, opts: { position: "bottom" } };
    label.value = "after";
    await settle();
    expect(fixture.host.querySelector('[data-owned-id="a"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("provided:a:after");
    expect(mounts).toBe(2);
    expect(unmounts).toBe(0);
    rows.value = ["b", "a", "c"];
    await settle();
    expect(fixture.host.querySelector('[data-owned-id="a"]')).toBe(input);
    expect(
      [...fixture.host.querySelectorAll<HTMLInputElement>("input")].map(
        (node) => node.dataset.ownedId,
      ),
    ).toEqual(["b", "a", "c"]);
    expect(mounts).toBe(3);
    expect(unmounts).toBe(0);
    rows.value = ["a"];
    await settle();
    expect(unmounts).toBe(2);
    expect(fixture.host.querySelector("input")).toBe(input);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(mounts);
});

test("Breadcrumb open popup preserves unchanged hidden Item owner when only the limit changes", async () => {
  const max = shallowRef(2);
  const routes = ["A", "B", "C", "D"].map((name) => ({ key: name, name }));
  let mounts: Record<string, number> = {},
    unmounts: Record<string, number> = {};
  const Owned = defineVaporComponent<{ name: string }, {}, string, {}>(
    (props) => {
      const prefix = inject("breadcrumb-popup-reactivity");
      const name = props.name;
      onMounted(() => {
        mounts = { ...mounts, [name]: (mounts[name] ?? 0) + 1 };
      });
      onUnmounted(() => {
        unmounts = { ...unmounts, [name]: (unmounts[name] ?? 0) + 1 };
      });
      return (
        <input data-popup-id={props.name} value={`${prefix}:${props.name}`} />
      );
    },
    { props: ["name"] },
  );
  const render = (route: RouteProps) => <Owned name={route.name!} />;
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-popup-reactivity");
      provide("breadcrumb-popup-reactivity", "provided");
      return (
        <Breadcrumb
          maxItemCount={max.value}
          moreType="popover"
          renderItem={render}
          routes={routes}
        />
      );
    }),
  );
  try {
    await settle();
    await userEvent.hover(
      fixture.host.querySelector(".semi-breadcrumb-item-more span")!,
    );
    await vi.waitFor(() =>
      expect(
        document.querySelector('.semi-popover-content [data-popup-id="B"]'),
      ).not.toBeNull(),
    );
    const input = document.querySelector<HTMLInputElement>(
      '.semi-popover-content [data-popup-id="B"]',
    )!;
    input.focus();
    expect(input.value).toBe("provided:B");
    expect(mounts.B).toBe(1);
    expect(unmounts.B ?? 0).toBe(0);
    for (const limit of [1, 2, 1]) {
      max.value = limit;
      await settle();
      expect(
        document.querySelector('.semi-popover-content [data-popup-id="B"]'),
      ).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(mounts.B).toBe(1);
      expect(unmounts.B ?? 0).toBe(0);
      expect(
        document.querySelectorAll(
          ".semi-popover-content .semi-breadcrumb-restItem",
        ),
      ).toHaveLength(limit === 1 ? 2 : 1);
    }
  } finally {
    fixture.unmount();
  }
  expect(unmounts.B).toBe(1);
  expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
});

test("Breadcrumb stable renderer transfers ownership across native string and empty branches", async () => {
  const mode = shallowRef("native"),
    label = shallowRef("before");
  let mounts = 0,
    unmounts = 0,
    runs = 0,
    disposals = 0;
  const Owned = defineVaporComponent(() => {
    const context = inject("breadcrumb-title-transition");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <input data-title-transition value={`${context}:${label.value}`} />;
  });
  const render = () => {
    runs++;
    onScopeDispose(() => disposals++);
    if (mode.value === "native") return <Owned />;
    return mode.value === "text" ? label.value : null;
  };
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-title-transition");
      provide("breadcrumb-title-transition", "provided");
      return (
        <Breadcrumb
          renderItem={render}
          routes={[{ key: "only", name: "route" }]}
        />
      );
    }),
  );
  try {
    await settle();
    const first = fixture.host.querySelector("input")!;
    first.focus();
    label.value = "after";
    await settle();
    expect(fixture.host.querySelector("input")).toBe(first);
    expect(document.activeElement).toBe(first);
    expect(first.value).toBe("provided:after");
    expect(runs).toBe(1);
    mode.value = "text";
    await settle();
    expect(fixture.host.textContent).toBe("after");
    expect(unmounts).toBe(1);
    mode.value = "empty";
    await settle();
    expect(fixture.host.textContent).toBe("");
    mode.value = "native";
    await settle();
    const second = fixture.host.querySelector("input")!;
    expect(second).not.toBe(first);
    expect(second.value).toBe("provided:after");
    expect(mounts).toBe(2);
    expect(disposals).toBe(runs - 1);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(mounts);
  expect(disposals).toBe(runs);
});

test("Breadcrumb throwing native renderer disposes its incomplete owner and recovers without duplicate cleanup", async () => {
  const mode = shallowRef("native"),
    watched = shallowRef(0),
    reactiveDisposals = shallowRef(0);
  const observed: number[] = [];
  let created = 0,
    disposed = 0,
    mounted = 0,
    unmounted = 0;
  const errors: unknown[] = [];
  const failure = new Error("breadcrumb-render-failure");
  const Owned = defineVaporComponent(() => {
    const id = ++created;
    watchEffect(() => {
      watched.value;
      observed.push(id);
    });
    onScopeDispose(() => {
      disposed++;
      reactiveDisposals.value++;
    });
    onMounted(() => mounted++);
    onUnmounted(() => unmounted++);
    return (
      <>
        <input data-error-owned />
        <Text children="cleanup" />
      </>
    );
  });
  const render = () => {
    if (mode.value === "text") return "recovered";
    const result = <Owned />;
    if (mode.value === "throw") throw failure;
    return result;
  };
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-title-error");
      return (
        <Breadcrumb
          renderItem={render}
          routes={[{ key: "only", name: "route" }]}
        />
      );
    }),
  );
  app.config.errorHandler = (error) => errors.push(error);
  app.mount(host);
  try {
    await settle();
    expect(created).toBe(1);
    expect(mounted).toBe(1);
    const original = host.querySelector("input");
    mode.value = "throw";
    await settle();
    expect(errors).toEqual([failure]);
    expect(created).toBe(2);
    expect(disposed).toBe(1);
    expect(host.querySelector("input")).toBe(original);
    const before = observed.length;
    watched.value++;
    await settle();
    expect(observed.slice(before)).toEqual([1]);
    mode.value = "text";
    await settle();
    expect(host.textContent).toBe("recovered");
    expect(disposed).toBe(2);
    mode.value = "native";
    await settle();
    expect(created).toBe(3);
    expect(disposed).toBe(2);
    expect(host.querySelector("input")).not.toBeNull();
    expect(errors).toEqual([failure]);
  } finally {
    app.unmount();
    host.remove();
  }
  expect(disposed).toBe(created);
  expect(mounted).toBe(2);
  expect(unmounted).toBe(mounted);
  expect(reactiveDisposals.value).toBe(created);
  expect(mounted).toBeLessThanOrEqual(created);
  const final = observed.length;
  watched.value++;
  await settle();
  expect(observed).toHaveLength(final);
});

test("Breadcrumb custom renderMore replaces its owned result when rest arguments change and stops the old watchers", async () => {
  const max = shallowRef(2),
    observedValue = shallowRef(0);
  const observations: { id: number; value: number }[] = [];
  const routes = ["A", "B", "C", "D"].map((name) => ({ key: name, name }));
  let created = 0,
    mounts = 0,
    unmounts = 0,
    disposals = 0;
  const Owned = defineVaporComponent<{ count: number }, {}, string, {}>(
    (props) => {
      const id = ++created;
      const context = inject("breadcrumb-custom-argument");
      watchEffect(() => observations.push({ id, value: observedValue.value }));
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      onScopeDispose(() => disposals++);
      return <input data-custom-argument value={`${context}:${props.count}`} />;
    },
    { props: ["count"] },
  );
  const renderMore = (rest: readonly BreadcrumbItemRenderer[]) => (
    <Owned count={rest.length} />
  );
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-custom-argument");
      provide("breadcrumb-custom-argument", "provided");
      return (
        <Breadcrumb
          maxItemCount={max.value}
          renderMore={renderMore}
          routes={routes}
        />
      );
    }),
  );
  try {
    await settle();
    const original = fixture.host.querySelector<HTMLInputElement>("input")!;
    expect(original.value).toBe("provided:2");
    expect(mounts).toBe(1);
    expect(disposals).toBe(0);
    max.value = 1;
    await settle();
    const replacement = fixture.host.querySelector<HTMLInputElement>("input")!;
    expect(replacement).not.toBe(original);
    expect(original.isConnected).toBe(false);
    expect(replacement.value).toBe("provided:3");
    expect(mounts).toBe(2);
    expect(unmounts).toBe(1);
    expect(disposals).toBe(1);
    const before = observations.length;
    observedValue.value = 1;
    await settle();
    expect(observations.slice(before)).toEqual([{ id: 2, value: 1 }]);
    expect(fixture.host.querySelector("input")).toBe(replacement);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(mounts);
  expect(disposals).toBe(created);
  const final = observations.length;
  observedValue.value = 2;
  await settle();
  expect(observations).toHaveLength(final);
});
