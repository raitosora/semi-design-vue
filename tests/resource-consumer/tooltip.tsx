import { createVaporApp, nextTick, ref } from "vue";
import { Tooltip } from "semi-ui-vue";
import SubpathTooltip, {
  Tooltip as NamedTooltip,
  type TooltipInstance,
} from "semi-ui-vue/tooltip";
import "semi-ui-vue/styles/components/tooltip.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkTooltipConsumer() {
  assert(
    Tooltip === SubpathTooltip && Tooltip === NamedTooltip,
    "Tooltip entry identities differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const visible = ref(false);
  const text = ref("packed-tooltip-content");
  const owned = ref(false);
  const alive = ref(true);
  const api = ref<TooltipInstance | null>(null);
  const changes: boolean[] = [];
  const app = createVaporApp(() => (
    <>
      {alive.value && (
        <Tooltip
          content={() => text.value}
          motion={false}
          mouseEnterDelay={0}
          mouseLeaveDelay={0}
          onUpdate:visible={(value) => (visible.value = value)}
          onVisibleChange={(value) => changes.push(value)}
          ref={api}
          returnFocusOnClose={true}
          trigger="click"
          v-slots={{
            default: (scope) => (
              <button
                {...scope.attrs}
                {...scope.triggerProps}
                data-packed-tooltip=""
                ref={scope.triggerRef}
              >
                Packed Tooltip trigger
              </button>
            ),
            ...(owned.value
              ? {
                  content: (scope) => (
                    <button
                      data-packed-tooltip-content=""
                      ref={scope.initialFocusRef}
                    >
                      {text.value}
                    </button>
                  ),
                }
              : {}),
          }}
          visible={visible.value}
          wrapperId="packed-tooltip-popup"
        />
      )}
    </>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const trigger = host.querySelector<HTMLButtonElement>(
      "[data-packed-tooltip]",
    )!;
    assert(
      trigger && host.querySelectorAll("button").length === 1,
      "Tooltip trigger has a synthetic wrapper or missing native button",
    );
    trigger.click();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const popupId =
      trigger.getAttribute("data-popupid") ??
      trigger.getAttribute("aria-describedby");
    assert(
      popupId && document.getElementById(popupId),
      "Tooltip popup relationship failed",
    );
    assert(
      api.value!.getPopupId() === popupId,
      "Tooltip exposed popup ID differs from trigger relationship",
    );
    const popup = () => document.getElementById(popupId)!;
    assert(
      popup().textContent?.includes(text.value),
      "Tooltip scalar content failed",
    );
    text.value = "<b>safe packed text</b>";
    await nextTick();
    assert(
      popup().textContent?.includes(text.value) && !popup().querySelector("b"),
      "Tooltip scalar content became HTML",
    );
    owned.value = true;
    await nextTick();
    assert(
      popup().querySelector("[data-packed-tooltip-content]")?.textContent ===
        text.value,
      "Tooltip owned content slot failed",
    );
    const currentTrigger = host.querySelector<HTMLButtonElement>(
      "[data-packed-tooltip]",
    )!;
    assert(
      currentTrigger &&
        currentTrigger.isConnected &&
        currentTrigger !== trigger &&
        !trigger.isConnected,
      "Tooltip dynamic slot change did not release the old native trigger",
    );
    assert(
      currentTrigger.getAttribute("data-popupid") === popupId &&
        currentTrigger.getAttribute("aria-describedby") === popupId &&
        api.value!.getPopupId() === popupId,
      "Tooltip replacement trigger lost its popup relationship",
    );
    api.value!.rePosition();
    api.value!.focusTrigger();
    assert(
      document.activeElement === currentTrigger,
      "Tooltip exposed focusTrigger failed for its connected native trigger",
    );
    visible.value = false;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert(
      !document.getElementById(popupId),
      "Tooltip controlled close left portal DOM",
    );
    visible.value = true;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const reopened = document.getElementById(popupId);
    assert(
      reopened?.classList.contains("semi-tooltip-wrapper-show") &&
        reopened.querySelector("[data-packed-tooltip-content]")?.textContent ===
          text.value &&
        currentTrigger.isConnected &&
        currentTrigger.getAttribute("aria-describedby") === popupId &&
        api.value!.getPopupId() === popupId,
      "Tooltip controlled reopen lost visible owned content or trigger relationship",
    );
    alive.value = false;
    await nextTick();
    assert(
      !document.getElementById(popupId) && !host.querySelector("button"),
      "Tooltip conditional teardown left DOM",
    );
    assert(
      changes.includes(true),
      "Tooltip notification callback was not delivered",
    );
    assert(
      !currentTrigger.isConnected,
      "Tooltip current trigger survived teardown",
    );
    const notifications = changes.length;
    trigger.click();
    currentTrigger.click();
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert(
      changes.length === notifications && !document.getElementById(popupId),
      "Detached Tooltip trigger or layout callbacks survived teardown",
    );
    app.unmount();
    mounted = false;
    assert(host.childNodes.length === 0, "Tooltip app teardown left DOM");
    return "tooltip consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
