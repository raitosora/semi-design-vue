import { expect, test } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import Popover from "../../packages/semi-ui-vue/src/components/popover/index.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import type {
  TooltipNativeRef,
  TooltipTriggerScope,
} from "../../packages/semi-ui-vue/src/components/tooltip/types.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const settle = async () => {
  await nextTick();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  await nextTick();
};
const aligned = (popup: HTMLElement, trigger: HTMLElement) => {
  const p = popup.getBoundingClientRect();
  const a = trigger.getBoundingClientRect();
  expect(Math.abs(p.top - a.bottom - 4)).toBeLessThanOrEqual(1.2);
  expect(
    Math.abs(p.left + p.width / 2 - a.left - a.width / 2),
  ).toBeLessThanOrEqual(1.2);
};

// For is confined to this native Vapor test fixture; no VNode or instance-root discovery.
test("keyed For trigger roots preserve identity on reorder, release removed active roots and remount", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const ids = shallowRef(["a", "c", "b"]);
  const detailed = shallowRef(false);
  const mounted = shallowRef(true);
  const epoch = shallowRef(0);
  let lifecycle: readonly string[] = [];
  let calls: readonly {
    readonly epoch: number;
    readonly id: string;
    readonly element: Element | null;
  }[] = [];
  let bindings: Readonly<
    Record<
      string,
      { readonly native: TooltipNativeRef; readonly ref: TooltipNativeRef }
    >
  > = {};
  let changedStableCallbacks: readonly string[] = [];
  const rootRef = (
    scope: TooltipTriggerScope,
    id: string,
  ): TooltipNativeRef => {
    const native = scope.getTriggerRef(id);
    const key = `${epoch.value}:${id}`;
    const existing = bindings[key];
    if (existing) {
      if (existing.native !== native)
        changedStableCallbacks = [...changedStableCallbacks, key];
      return existing.ref;
    }
    const generation = epoch.value;
    const callback: TooltipNativeRef = (element) => {
      calls = [...calls, { epoch: generation, id, element }];
      native(element);
    };
    bindings = { ...bindings, [key]: { native, ref: callback } };
    return callback;
  };
  const Content = defineVaporComponent(() => {
    onMounted(() => {
      lifecycle = [...lifecycle, "mounted"];
    });
    onUnmounted(() => {
      lifecycle = [...lifecycle, "unmounted"];
    });
    return (
      <div
        data-for-content=""
        style={{ width: detailed.value ? "180px" : "100px", height: "50px" }}
      >
        <strong v-if={detailed.value} data-for-detail="">
          expanded content
        </strong>
        <span v-if={!detailed.value}>simple content</span>
      </div>
    );
  });
  const Probe = defineVaporComponent(() => (
    <section style="position:fixed;left:80px;top:100px;display:flex;gap:20px">
      <Popover
        v-if={mounted.value}
        autoAdjustOverflow={false}
        guardFocus={false}
        motion={false}
        position="bottom"
        rePosKey={`${epoch.value}:${ids.value.join("|")}`}
        showArrow={false}
        trigger="click"
      >
        {{
          default: (scope) => (
            <For getKey={(id: string) => id} in={ids.value}>
              {{
                default: (id: ShallowRef<unknown>) => (
                  <button
                    {...scope.triggerProps}
                    data-for-id={String(id.value)}
                    ref={rootRef(scope, String(id.value))}
                    style="width:80px;height:32px;padding:0;border:0"
                  >
                    {String(id.value)}
                  </button>
                ),
              }}
            </For>
          ),
          content: () => <Content />,
        }}
      </Popover>
    </section>
  ));
  const app = createVaporApp(Probe);
  app.provide(ariaIdScopeKey, createAriaIdScope("popover-for"));
  const tracker = installResourceTracker(window, document);
  const button = (id: string) =>
    host.querySelector<HTMLButtonElement>(`[data-for-id="${id}"]`)!;
  const popup = () =>
    document.querySelector<HTMLElement>(".semi-popover-wrapper")!;
  try {
    app.mount(host);
    await settle();
    const a = button("a");
    const b = button("b");
    const c = button("c");
    b.focus();
    b.click();
    await settle();
    const originalPopup = popup();
    const content = originalPopup.querySelector("[data-for-content]")!;
    aligned(originalPopup, b);
    expect(document.activeElement).toBe(b);
    ids.value = ["b", "a", "c"];
    await settle();
    expect(button("a")).toBe(a);
    expect(button("b")).toBe(b);
    expect(button("c")).toBe(c);
    // Native For uses DOM moves; the separate control below records Chromium focus loss.
    expect(document.activeElement).toBe(document.body);
    b.focus();
    expect(document.activeElement).toBe(b);
    expect(popup()).toBe(originalPopup);
    aligned(popup(), b);
    expect(changedStableCallbacks).toEqual([]);
    detailed.value = true;
    await settle();
    expect(popup().querySelector("[data-for-content]")).toBe(content);
    expect(popup().querySelector("[data-for-detail]")).not.toBeNull();
    expect(popup().getBoundingClientRect().width).toBeGreaterThan(170);
    aligned(popup(), b);
    ids.value = ["c", "a"];
    await settle();
    expect(b.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(b);
    expect(
      calls.filter(
        (call) => call.epoch === 0 && call.id === "b" && call.element === null,
      ),
    ).toHaveLength(1);
    expect(popup()).toBe(originalPopup);
    // The fallback must use a surviving explicit root, never the disconnected active node.
    const p = popup().getBoundingClientRect();
    expect(
      [a, c].some(
        (node) =>
          Math.abs(
            p.left +
              p.width / 2 -
              node.getBoundingClientRect().left -
              node.getBoundingClientRect().width / 2,
          ) <= 1.2,
      ),
    ).toBe(true);
    mounted.value = false;
    await settle();
    expect(popup()).toBeNull();
    expect(host.querySelectorAll("button")).toHaveLength(0);
    expect(
      calls.filter(
        (call) => call.epoch === 0 && call.id === "a" && call.element === null,
      ),
    ).toHaveLength(1);
    expect(
      calls.filter(
        (call) => call.epoch === 0 && call.id === "c" && call.element === null,
      ),
    ).toHaveLength(1);
    expect(lifecycle).toEqual(["mounted", "unmounted"]);
    epoch.value = 1;
    ids.value = ["a", "b"];
    detailed.value = false;
    mounted.value = true;
    await settle();
    const replacement = button("b");
    expect(replacement).not.toBe(b);
    replacement.focus();
    replacement.click();
    await settle();
    expect(popup()).not.toBe(originalPopup);
    aligned(popup(), replacement);
    expect(popup().querySelector("[data-for-detail]")).toBeNull();
    expect(lifecycle).toEqual(["mounted", "unmounted", "mounted"]);
    expect(changedStableCallbacks).toEqual([]);
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
  expect(lifecycle).toEqual(["mounted", "unmounted", "mounted", "unmounted"]);
  expect(
    calls.filter(
      (call) => call.epoch === 1 && call.id === "a" && call.element === null,
    ),
  ).toHaveLength(1);
  expect(
    calls.filter(
      (call) => call.epoch === 1 && call.id === "b" && call.element === null,
    ),
  ).toHaveLength(1);
});
