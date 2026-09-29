import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import { Popover, provideAriaIdScope } from "semi-ui-vue";
import SubpathPopover, {
  Popover as NamedPopover,
  type PopoverInstance,
} from "semi-ui-vue/popover";
import "semi-ui-vue/styles/components/popover.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkPopoverConsumer() {
  assert(
    Popover === SubpathPopover && Popover === NamedPopover,
    "Popover entry identities differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const visible = ref(false);
  const text = ref("packed-popover-content");
  const owned = ref(false);
  const alive = ref(true);
  const api = ref<PopoverInstance | null>(null);
  const changes: boolean[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("packed-popover-consumer");
      return (
        <>
          {alive.value && (
            <Popover
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
                    data-packed-popover=""
                    ref={scope.triggerRef}
                  >
                    Packed Popover trigger
                  </button>
                ),
                ...(owned.value
                  ? {
                      content: (scope) => (
                        <button
                          data-packed-popover-content=""
                          ref={scope.initialFocusRef}
                        >
                          {text.value}
                        </button>
                      ),
                    }
                  : {}),
              }}
              visible={visible.value}
            />
          )}
          {alive.value && (
            <SubpathPopover
              content="Second packed Popover"
              motion={false}
              trigger="custom"
              v-slots={{
                default: (scope) => (
                  <button
                    {...scope.attrs}
                    {...scope.triggerProps}
                    data-packed-popover-secondary=""
                    ref={scope.triggerRef}
                  >
                    Packed subpath Popover trigger
                  </button>
                ),
              }}
              visible={false}
            />
          )}
        </>
      );
    }),
  );
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const trigger = host.querySelector<HTMLButtonElement>(
      "[data-packed-popover]",
    )!;
    assert(
      trigger &&
        trigger.parentElement === host &&
        host.querySelectorAll("button").length === 2,
      "Popover trigger has a synthetic wrapper or missing native button",
    );
    const secondTrigger = host.querySelector<HTMLButtonElement>(
      "[data-packed-popover-secondary]",
    )!;
    const secondId = secondTrigger.getAttribute("data-popupid");
    assert(
      secondTrigger.parentElement === host &&
        secondId?.includes("packed-popover-consumer") &&
        secondId !== trigger.getAttribute("data-popupid"),
      "Root and subpath Popover instances collided in the explicit app ARIA scope",
    );
    trigger.click();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const popupId =
      trigger.getAttribute("data-popupid") ??
      trigger.getAttribute("aria-controls");
    assert(
      popupId &&
        popupId.includes("packed-popover-consumer") &&
        document.getElementById(popupId),
      "Popover popup relationship failed",
    );
    const popup = () => document.getElementById(popupId)!;
    assert(
      popup().classList.contains("semi-popover-wrapper"),
      "Popover portal prefix differs from its trigger relationship",
    );
    assert(
      popup().textContent?.includes(text.value),
      "Popover scalar content failed",
    );
    text.value = "<b>safe packed text</b>";
    await nextTick();
    assert(
      popup().textContent?.includes(text.value) && !popup().querySelector("b"),
      "Popover scalar content became HTML",
    );
    owned.value = true;
    await nextTick();
    assert(
      popup().querySelector("[data-packed-popover-content]")?.textContent ===
        text.value,
      "Popover owned content slot failed",
    );
    const currentTrigger = host.querySelector<HTMLButtonElement>(
      "[data-packed-popover]",
    )!;
    assert(
      currentTrigger &&
        currentTrigger.isConnected &&
        host.querySelectorAll("button").length === 2 &&
        (currentTrigger === trigger || !trigger.isConnected),
      "Popover dynamic content left a missing or duplicate native trigger",
    );
    assert(
      currentTrigger.getAttribute("data-popupid") === popupId &&
        currentTrigger.getAttribute("aria-controls") === popupId &&
        currentTrigger.getAttribute("aria-haspopup") === "dialog" &&
        currentTrigger.getAttribute("aria-expanded") === "true" &&
        !currentTrigger.hasAttribute("aria-describedby") &&
        popup().getAttribute("role") === "dialog" &&
        document.getElementById(popupId) !== null,
      "Popover replacement trigger lost its popup relationship",
    );
    assert(
      api.value && !("getPopupId" in api.value) && !("rePosition" in api.value),
      "Popover leaked Tooltip instance methods",
    );
    api.value!.focusTrigger();
    assert(
      document.activeElement === currentTrigger,
      "Popover exposed focusTrigger failed for its connected native trigger",
    );
    assert(
      visible.value === true &&
        popup().classList.contains("semi-popover-wrapper-show") &&
        popup().getAttribute("role") === "dialog" &&
        currentTrigger.getAttribute("aria-expanded") === "true" &&
        currentTrigger.getAttribute("aria-controls") === popupId &&
        popup().querySelector("[data-packed-popover-content]")?.textContent ===
          text.value,
      "Popover focusTrigger closed its active owned-content dialog",
    );
    visible.value = false;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert(
      !document.getElementById(popupId) &&
        currentTrigger.isConnected &&
        currentTrigger.getAttribute("aria-controls") === popupId &&
        currentTrigger.getAttribute("aria-haspopup") === "dialog" &&
        currentTrigger.getAttribute("aria-expanded") === "false" &&
        !currentTrigger.hasAttribute("aria-describedby"),
      "Popover controlled close left portal DOM or stale dialog trigger ARIA",
    );
    visible.value = true;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const reopened = document.getElementById(popupId);
    assert(
      reopened?.classList.contains("semi-popover-wrapper-show") &&
        reopened.querySelector("[data-packed-popover-content]")?.textContent ===
          text.value &&
        currentTrigger.isConnected &&
        currentTrigger.getAttribute("aria-controls") === popupId &&
        currentTrigger.getAttribute("aria-haspopup") === "dialog" &&
        currentTrigger.getAttribute("aria-expanded") === "true" &&
        !currentTrigger.hasAttribute("aria-describedby") &&
        popup().getAttribute("role") === "dialog" &&
        document.getElementById(popupId) !== null,
      "Popover controlled reopen lost visible owned content or trigger relationship",
    );
    alive.value = false;
    await nextTick();
    assert(
      !document.getElementById(popupId) && !host.querySelector("button"),
      "Popover conditional teardown left DOM",
    );
    assert(
      changes.includes(true),
      "Popover notification callback was not delivered",
    );
    assert(
      !currentTrigger.isConnected && !secondTrigger.isConnected,
      "Popover current trigger survived teardown",
    );
    const notifications = changes.length;
    trigger.click();
    currentTrigger.click();
    secondTrigger.click();
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert(
      changes.length === notifications && !document.getElementById(popupId),
      "Detached Popover trigger or layout callbacks survived teardown",
    );
    app.unmount();
    mounted = false;
    assert(host.childNodes.length === 0, "Popover app teardown left DOM");
    return "popover consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
