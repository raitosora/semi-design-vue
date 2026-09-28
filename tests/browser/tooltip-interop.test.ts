import { expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  vaporInteropPlugin,
} from "vue";
import { Tooltip } from "semi-ui-vue";
import type {
  RenderContentProps,
  TooltipTriggerScope,
} from "../../packages/semi-ui-vue/src/components/tooltip/types.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const settle = async () => {
  await nextTick();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  await nextTick();
};

// VDOM APIs are deliberate only in this ordinary Vue consumer boundary.
test("ordinary Vue interop updates attrs, named slots, conditional roots and native refs", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const visible = ref(true);
  const present = ref(true);
  const label = ref("first");
  const customArrow = ref(true);
  const nativeRefs: Array<Element | null> = [];
  const lifecycle: string[] = [];
  const Content = defineComponent({
    setup() {
      onMounted(() => lifecycle.push("mounted"));
      onUnmounted(() => lifecycle.push("unmounted"));
      return () => h("span", { "data-interop-content": "" }, label.value);
    },
  });
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  const app = createApp({
    setup: () => () =>
      present.value
        ? h(
            Tooltip,
            {
              wrapperId: "interop-tooltip",
              trigger: "custom",
              visible: visible.value,
              motion: false,
              "data-consumer": label.value,
              title: label.value,
            },
            {
              default: (scope: TooltipTriggerScope) =>
                h(
                  "button",
                  {
                    ...scope.attrs,
                    ...scope.triggerProps,
                    ref: (element: unknown) => {
                      const native = element as Element | null;
                      nativeRefs.push(native);
                      scope.triggerRef(native);
                    },
                  },
                  label.value,
                ),
              content: (_scope: RenderContentProps) => h(Content),
              ...(customArrow.value
                ? {
                    arrow: () =>
                      h(
                        "i",
                        { "data-interop-arrow": "", "aria-hidden": "true" },
                        "*",
                      ),
                  }
                : {}),
            },
          )
        : h("p", "removed"),
  });
  app.use(vaporInteropPlugin);
  const tracker = installResourceTracker(window, document);
  try {
    app.mount(host);
    await settle();
    const trigger = host.querySelector("button")!;
    const popup = document.getElementById("interop-tooltip")!;
    expect(trigger.getAttribute("data-consumer")).toBe("first");
    expect(trigger.getAttribute("title")).toBe("first");
    expect(trigger.getAttribute("aria-describedby")).toBe(popup.id);
    expect(nativeRefs).toContain(trigger);
    expect(popup.querySelector("[data-interop-content]")?.textContent).toBe(
      "first",
    );
    expect(popup.querySelector("[data-interop-arrow]")).not.toBeNull();
    expect(lifecycle).toEqual(["mounted"]);
    label.value = "updated";
    await settle();
    expect(host.querySelector("button")).toBe(trigger);
    expect(trigger.getAttribute("data-consumer")).toBe("updated");
    expect(trigger.textContent).toBe("updated");
    expect(popup.querySelector("[data-interop-content]")?.textContent).toBe(
      "updated",
    );
    expect(lifecycle).toEqual(["mounted"]);
    customArrow.value = false;
    await settle();
    expect(popup.querySelector("[data-interop-arrow]")).toBeNull();
    visible.value = false;
    await settle();
    expect(document.getElementById("interop-tooltip")).toBeNull();
    expect(lifecycle).toEqual(["mounted", "unmounted"]);
    visible.value = true;
    await settle();
    expect(lifecycle).toEqual(["mounted", "unmounted", "mounted"]);
    present.value = false;
    await settle();
    expect(document.getElementById("interop-tooltip")).toBeNull();
    expect(nativeRefs.at(-1)).toBeNull();
    expect(lifecycle).toEqual(["mounted", "unmounted", "mounted", "unmounted"]);
  } finally {
    try {
      app.unmount();
      await nextTick();
      tracker.assertClean();
    } finally {
      tracker.restore();
      host.remove();
    }
  }
});

test("ordinary Vue conditional native trigger replacement and content slot fallback release refs", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const button = ref(true);
  const structured = ref(false);
  const present = ref(true);
  let transitions: readonly (Element | null)[] = [];
  const app = createApp({
    setup: () => () =>
      present.value
        ? h(
            Tooltip,
            {
              wrapperId: "interop-conditional",
              trigger: "custom",
              visible: true,
              motion: false,
              content: "fallback",
              "data-conditional": "native",
            },
            {
              default: (scope: TooltipTriggerScope) =>
                h(
                  button.value ? "button" : "span",
                  {
                    ...scope.attrs,
                    ...scope.triggerProps,
                    ref: (value: unknown) => {
                      const element = value as Element | null;
                      transitions = [...transitions, element];
                      scope.triggerRef(element);
                    },
                  },
                  "trigger",
                ),
              ...(structured.value
                ? {
                    content: () =>
                      h("strong", { "data-structured": "" }, "structured"),
                  }
                : {}),
            },
          )
        : h("p", "removed"),
  });
  app.use(vaporInteropPlugin);
  const tracker = installResourceTracker(window, document);
  try {
    app.mount(host);
    await settle();
    const first = host.querySelector("button")!;
    const popup = document.getElementById("interop-conditional")!;
    expect(popup.textContent).toContain("fallback");
    button.value = false;
    await settle();
    const replacement = host.querySelector("span")!;
    expect(first.isConnected).toBe(false);
    expect(replacement.getAttribute("data-conditional")).toBe("native");
    expect(replacement.getAttribute("aria-describedby")).toBe(popup.id);
    expect(transitions).toContain(null);
    expect(transitions.at(-1)).toBe(replacement);
    structured.value = true;
    await settle();
    expect(popup.querySelector("[data-structured]")?.textContent).toBe(
      "structured",
    );
    expect(popup.textContent).not.toContain("fallback");
    structured.value = false;
    await settle();
    expect(popup.querySelector("[data-structured]")).toBeNull();
    expect(popup.textContent).toContain("fallback");
    present.value = false;
    await settle();
    expect(transitions.at(-1)).toBeNull();
    expect(document.getElementById("interop-conditional")).toBeNull();
  } finally {
    try {
      app.unmount();
      await nextTick();
      tracker.assertClean();
    } finally {
      tracker.restore();
      host.remove();
    }
  }
});

test("ordinary Vue click Tooltip updates, closes on native outside click and reopens retained content", async () => {
  const host = document.createElement("div");
  host.style.padding = "80px";
  document.body.append(host);
  const visible = ref(false);
  const content = ref("Interop Tooltip content");
  const app = createApp({
    setup: () => () =>
      h("div", [
        h(
          Tooltip,
          {
            wrapperId: "interop-click-sequence",
            motion: false,
            trigger: "click",
            visible: visible.value,
            content: content.value,
            "onUpdate:visible": (value: boolean) => (visible.value = value),
          },
          {
            default: (scope: TooltipTriggerScope) =>
              h(
                "button",
                {
                  ...scope.attrs,
                  ...scope.triggerProps,
                  ref: (element: unknown) =>
                    scope.triggerRef(
                      element instanceof Element ? element : null,
                    ),
                },
                "Sequence Tooltip trigger",
              ),
          },
        ),
        h(
          "button",
          { style: { display: "block", marginTop: "64px" } },
          "Sequence outside action",
        ),
      ]),
  });
  app.use(vaporInteropPlugin);
  const tracker = installResourceTracker(window, document);
  try {
    app.mount(host);
    await settle();
    await page
      .getByRole("button", { name: "Sequence Tooltip trigger", exact: true })
      .click();
    await settle();
    expect(
      document.getElementById("interop-click-sequence")?.textContent,
    ).toContain("Interop Tooltip content");
    content.value = "Updated interop Tooltip content";
    await settle();
    expect(
      document.getElementById("interop-click-sequence")?.textContent,
    ).toContain("Updated interop Tooltip content");
    await page
      .getByRole("button", { name: "Sequence outside action", exact: true })
      .click();
    await settle();
    expect(document.getElementById("interop-click-sequence")).toBeNull();
    expect(visible.value).toBe(false);
    await page
      .getByRole("button", { name: "Sequence Tooltip trigger", exact: true })
      .click();
    await settle();
    expect(
      document.getElementById("interop-click-sequence")?.textContent,
    ).toContain("Updated interop Tooltip content");
    expect(visible.value).toBe(true);
  } finally {
    try {
      app.unmount();
      await nextTick();
      tracker.assertClean();
    } finally {
      tracker.restore();
      host.remove();
    }
  }
});
