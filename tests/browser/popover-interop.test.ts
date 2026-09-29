import { expect, test } from "vitest";
import {
  createApp,
  h,
  nextTick,
  ref,
  vaporInteropPlugin,
  type Component,
} from "vue";
import Popover, {
  type PopoverTriggerScope,
} from "../../packages/semi-ui-vue/src/components/popover/index.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import { installResourceTracker } from "../support/resource-tracker.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 90));
  await nextTick();
};
test("ordinary Vue interop owns structured Popover slots and conditional native roots", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const button = ref(true);
  const structured = ref(false);
  const mounted = ref(true);
  const label = ref("first");
  const visible = ref(true);
  const roots: (Element | null)[] = [];
  const app = createApp({
    setup: () => () =>
      mounted.value
        ? h(
            Popover as Component,
            {
              trigger: "custom",
              visible: visible.value,
              content: label.value,
              motion: false,
              "data-consumer": label.value,
            },
            {
              default: (scope: PopoverTriggerScope) =>
                h(
                  button.value ? "button" : "span",
                  {
                    ...scope.attrs,
                    ...scope.triggerProps,
                    ref: (value: unknown) => {
                      roots.push(value as Element | null);
                      scope.triggerRef(value as Element | null);
                    },
                  },
                  "interop",
                ),
              ...(structured.value
                ? {
                    content: () =>
                      h("strong", { "data-owned-popover": "" }, label.value),
                  }
                : {}),
            },
          )
        : h("p", "removed"),
  });
  app.provide(ariaIdScopeKey, createAriaIdScope("popover-interop"));
  app.use(vaporInteropPlugin);
  const tracker = installResourceTracker(window, document);
  app.mount(host);
  try {
    await settle();
    const initial = host.querySelector("button")!;
    const popup = document.querySelector(".semi-popover-wrapper")!;
    expect(initial.getAttribute("aria-controls")).toBe(popup.id);
    expect(popup.textContent).toContain("first");
    button.value = false;
    structured.value = true;
    label.value = "second";
    await settle();
    const replacement = host.querySelector("span")!;
    expect(initial.isConnected).toBe(false);
    expect(replacement.getAttribute("data-consumer")).toBe("second");
    expect(roots).toContain(null);
    expect(document.querySelector("[data-owned-popover]")!.textContent).toBe(
      "second",
    );
    visible.value = false;
    await settle();
    expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
    visible.value = true;
    await settle();
    expect(document.querySelector("[data-owned-popover]")!.textContent).toBe(
      "second",
    );
    mounted.value = false;
    await settle();
    expect(roots.at(-1)).toBeNull();
    expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
    app.unmount();
    await nextTick();
    tracker.assertClean();
  } finally {
    host.remove();
    tracker.restore();
  }
});
