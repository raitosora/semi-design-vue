import { createVaporApp, nextTick, ref } from "vue";
import { ConfigProvider, IconButton } from "semi-ui-vue";
import * as ui from "semi-ui-vue";
import IconButtonFromSubpath, {
  IconButton as NamedIconButton,
} from "semi-ui-vue/iconButton";
import IconHome from "semi-icons-vue/IconHome";
import "semi-ui-vue/styles/components/iconButton.css";
import "semi-ui-vue/styles/components/spin.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkIconButtonConsumer() {
  assert(
    IconButton === IconButtonFromSubpath && IconButton === NamedIconButton,
    "IconButton entry identities differ",
  );
  assert(IconButton.elementType === "IconButton", "IconButton marker missing");
  for (const name of ["BaseButton"])
    assert(!Object.hasOwn(ui, name), `Unexpected public component: ${name}`);
  const host = document.createElement("div");
  document.body.append(host);
  const loading = ref(false);
  const disabled = ref(false);
  const visible = ref(true);
  const label = ref("Save");
  const position = ref<"left" | "right">("left");
  const rtl = ref(false);
  let clicks = 0;
  let keys = 0;
  let submits = 0;
  let resets = 0;
  const htmlType = ref<"button" | "submit" | "reset">("button");
  const app = createVaporApp(() => (
    <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
      {() => (
        <form
          onReset={() => resets++}
          onSubmit={(event) => {
            event.preventDefault();
            submits++;
          }}
        >
          <IconButton
            v-if={visible.value}
            aria-label="Save action"
            className="packed-icon-button"
            disabled={disabled.value}
            htmlType={htmlType.value}
            iconPosition={position.value}
            loading={loading.value}
            onClick={(event) => {
              assert(event instanceof MouseEvent, "Click lost native event");
              clicks++;
            }}
            onKeydown={(event) => {
              assert(
                event instanceof KeyboardEvent,
                "Keydown lost native event",
              );
              keys++;
            }}
            v-slots={{
              default: () => <span data-button-label="">{label.value}</span>,
              icon: () => (
                <IconHome aria-hidden={true} data-consumer-button-icon="" />
              ),
            }}
          />
        </form>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    const button = () =>
      host.querySelector<HTMLButtonElement>(".packed-icon-button")!;
    assert(
      button().tagName === "BUTTON" && button().type === "button",
      "IconButton lost native button semantics",
    );
    assert(
      button().getAttribute("aria-label") === "Save action",
      "Accessible name was lost",
    );
    assert(
      button()
        .querySelector(".semi-button-content")
        ?.firstElementChild?.hasAttribute("data-consumer-button-icon"),
      "Default icon position was not before text",
    );
    button().click();
    assert(
      Number(clicks) === 1 && Number(submits) === 0,
      "Click duplicated or default button submitted form",
    );
    button().focus();
    assert(document.activeElement === button(), "Button was not focusable");
    button().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    assert(Number(keys) === 1, "Native keydown duplicated");
    htmlType.value = "submit";
    await nextTick();
    button().click();
    assert(
      Number(submits) === 1,
      "Submit button did not submit form exactly once",
    );
    htmlType.value = "reset";
    await nextTick();
    button().click();
    assert(
      Number(resets) === 1,
      "Reset button did not reset form exactly once",
    );
    htmlType.value = "button";
    position.value = "right";
    label.value = "Updated";
    rtl.value = true;
    loading.value = true;
    await nextTick();
    assert(
      button().textContent?.includes("Updated"),
      "Dynamic default slot became stale",
    );
    assert(
      button()
        .querySelector(".semi-button-content")
        ?.firstElementChild?.classList.contains("semi-button-content-left"),
      "Right icon position did not preserve text-first order",
    );
    assert(
      button().querySelector('[data-icon="spin"]'),
      "Loading failed to reuse Spin",
    );
    assert(
      getComputedStyle(button()).direction === "rtl",
      "ConfigProvider direction did not reach button",
    );
    assert(
      getComputedStyle(button()).pointerEvents === "none" && !button().disabled,
      "Loading native interaction semantics changed",
    );
    const beforeLoadingClick = clicks;
    button().click();
    assert(
      Number(clicks) === beforeLoadingClick + 1,
      "Loading unexpectedly blocked programmatic native click",
    );
    disabled.value = true;
    await nextTick();
    const beforeDisabledClick = clicks;
    button().click();
    assert(
      button().disabled && Number(clicks) === beforeDisabledClick,
      "Disabled native button dispatched click",
    );
    loading.value = false;
    disabled.value = false;
    await nextTick();
    assert(
      !button().querySelector('[data-icon="spin"]') &&
        button().querySelector("[data-consumer-button-icon]"),
      "Loading did not restore custom icon",
    );
    loading.value = true;
    await nextTick();
    visible.value = false;
    await nextTick();
    assert(
      !host.querySelector("button") &&
        !host.querySelector('[data-icon="spin"]'),
      "Unmount left loading resources in DOM",
    );
    visible.value = true;
    await nextTick();
    assert(
      button().querySelector('[data-icon="spin"]'),
      "Remount lost loading state",
    );
    loading.value = false;
    await nextTick();
    button().click();
    assert(
      Number(clicks) === beforeDisabledClick + 1,
      "Remount duplicated native callback",
    );
    app.unmount();
    mounted = false;
    assert(
      !host.textContent && !host.querySelector("button"),
      "Teardown left IconButton content",
    );
    return "iconButton consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
