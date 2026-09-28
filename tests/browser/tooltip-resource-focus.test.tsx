import { expect, test } from "vitest";
import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import Tooltip, {
  type TooltipInstance,
} from "../../packages/semi-ui-vue/src/components/tooltip/index.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 30));
};

test("dynamic slot callbacks focus current native refs and release old and new roots", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const owned = ref(false);
  const visible = ref(false);
  const alive = ref(true);
  const api = ref<TooltipInstance | null>(null);
  const changes: boolean[] = [];
  const Probe = defineVaporComponent(() => (
    <>
      {alive.value && (
        <Tooltip
          content="primitive"
          motion={false}
          mouseEnterDelay={0}
          onUpdate:visible={(value) => (visible.value = value)}
          onVisibleChange={(value) => changes.push(value)}
          ref={api}
          returnFocusOnClose={true}
          trigger="click"
          v-slots={{
            default: (scope) => (
              <button
                {...scope.triggerProps}
                data-root=""
                ref={scope.triggerRef}
              >
                trigger
              </button>
            ),
            ...(owned.value
              ? { content: () => <button data-content="">owned</button> }
              : {}),
          }}
          visible={visible.value}
          wrapperId="resource-focus-source"
        />
      )}
    </>
  ));
  const app = createVaporApp(Probe);
  const tracker = installResourceTracker(window, document);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await settle();
    host.querySelector<HTMLButtonElement>("[data-root]")!.click();
    await settle();
    const previous = host.querySelector<HTMLButtonElement>("[data-root]")!;
    const instance = api.value;
    owned.value = true;
    await settle();
    const current = host.querySelector<HTMLButtonElement>("[data-root]")!;
    expect(previous.isConnected).toBe(false);
    expect(current).not.toBe(previous);
    expect(current.isConnected).toBe(true);
    expect(api.value).toBe(instance);
    expect(current.getAttribute("aria-describedby")).toBe(
      api.value!.getPopupId(),
    );
    expect(current.getAttribute("data-popupid")).toBe("resource-focus-source");
    expect(document.querySelector("[data-content]")).not.toBeNull();
    api.value!.focusTrigger();
    expect(document.activeElement).toBe(current);
    alive.value = false;
    await nextTick();
    expect(current.isConnected).toBe(false);
    expect(host.querySelector("button")).toBeNull();
    expect(document.getElementById("resource-focus-source")).toBeNull();
    const count = changes.length;
    previous.click();
    current.click();
    await settle();
    expect(changes).toHaveLength(count);
    app.unmount();
    mounted = false;
    tracker.assertClean();
  } finally {
    if (mounted) app.unmount();
    host.remove();
    tracker.restore();
  }
});
