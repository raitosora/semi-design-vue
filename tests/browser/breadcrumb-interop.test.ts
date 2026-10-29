import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  vaporInteropPlugin,
} from "vue";
import { expect, test } from "vitest";
import Breadcrumb from "../../packages/semi-ui-vue/src/components/breadcrumb/index.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test("Breadcrumb primitive routes support explicit VDOM interop", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const name = ref("first");
  const errors: unknown[] = [];
  const app = createApp({
    setup() {
      provideAriaIdScope("breadcrumb-interop-routes");
      return () => h(Breadcrumb, { routes: [name.value, "last"] });
    },
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  try {
    app.mount(host);
    await settle();
    expect(host.textContent).toBe("first/last");
    expect(host.querySelector('[aria-current="page"]')?.textContent).toBe(
      "last",
    );
    name.value = "updated";
    await settle();
    expect(host.textContent).toBe("updated/last");
    expect(errors).toEqual([]);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});
test("Breadcrumb declarative VDOM interop preserves context and lifecycle independently of native mode", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("first"),
    shown = ref(true),
    compact = ref(true);
  const errors: unknown[] = [];
  const warnings: string[] = [];
  let mounts = 0,
    unmounts = 0;
  const Child = defineComponent(() => {
    const value = inject("breadcrumb-interop");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return () => h("input", { value: `${value}:${label.value}` });
  });
  const app = createApp({
    setup() {
      provideAriaIdScope("breadcrumb-interop-slots");
      provide("breadcrumb-interop", "provided");
      return () =>
        h(
          Breadcrumb,
          { compact: compact.value },
          {
            default: () =>
              h(
                Breadcrumb.Item,
                {},
                { default: () => (shown.value ? h(Child) : null) },
              ),
          },
        );
    },
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    await settle();
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    const input = host.querySelector("input")!;
    expect(input.value).toBe("provided:first");
    expect(mounts).toBe(1);
    input.focus();
    label.value = "updated";
    compact.value = false;
    await settle();
    expect(host.querySelector("input")).toBe(input);
    expect(input.value).toBe("provided:updated");
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(1);
    shown.value = false;
    await settle();
    expect(unmounts).toBe(1);
    shown.value = true;
    await settle();
    expect(mounts).toBe(2);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
  expect(unmounts).toBe(2);
});

test("Breadcrumb root and Item named separator slots bridge VDOM with declared ownership", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("sep");
  const errors: unknown[] = [];
  const app = createApp({
    setup() {
      provideAriaIdScope("breadcrumb-interop-separator");
      return () =>
        h(
          Breadcrumb,
          { maxItemCount: 2 },
          {
            separator: () => h("em", label.value),
            default: () => [
              h(Breadcrumb.Item, { children: "a" }),
              h(Breadcrumb.Item, { children: "hidden" }),
              h(Breadcrumb.Item, { children: "z" }),
            ],
          },
        );
    },
  }).use(vaporInteropPlugin);
  app.config.errorHandler = (error) => errors.push(error);
  try {
    app.mount(host);
    await settle();
    expect(errors).toEqual([]);
    expect(host.textContent).toBe("asepsepz");
    expect(host.querySelectorAll("em")).toHaveLength(2);
    label.value = "changed";
    await settle();
    expect(errors).toEqual([]);
    expect(host.textContent).toBe("achangedchangedz");
  } finally {
    app.unmount();
    expect(host.childNodes).toHaveLength(0);
    host.remove();
  }
});
