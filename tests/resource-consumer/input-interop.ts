import {
  createApp,
  h,
  nextTick,
  onUnmounted,
  ref,
  vaporInteropPlugin,
} from "vue";
import InputInteropBridge from "./prepared-input-bridge.js";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkInputInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Interop"),
    alive = ref(true);
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const Child = {
    setup() {
      mounts++;
      onUnmounted(() => {
        disposals++;
      });
      return () =>
        h("input", {
          "data-input-interop-input": "",
          value: label.value,
        });
    },
  };
  const app = createApp({
    setup: () => () =>
      h(
        "section",
        {
          onClick: () => {
            clicks++;
          },
        },
        [
          alive.value
            ? h(
                InputInteropBridge,
                {
                  label: label.value,
                  disabled: label.value !== "Interop",
                },
                { default: () => h(Child) },
              )
            : null,
        ],
      ),
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>(
      "[data-input-interop-input]",
    )!;
    assert(input && mounts === 1, "Interop Input content absent");
    input.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      host.querySelector("[data-input-interop-input]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        disposals === 0 &&
        mounts === 1,
      "Interop Input replaced owned content",
    );
    assert(
      host.querySelector<HTMLInputElement>("#input-interop-native")?.value ===
        "Updated" &&
        host.querySelector<HTMLInputElement>("#input-interop-native")
          ?.disabled === true &&
        host.querySelector<HTMLTextAreaElement>("#input-interop-area")
          ?.value === "Updated",
      "Interop Input/TextArea value or group context update failed",
    );
    input.click();
    assert(clicks === 1, "Interop Input swallowed event");
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("[data-input-interop-input]") &&
        Number(disposals) === 1,
      "Interop Input removal retained content",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Updated",
      "Interop Input disposed child updated",
    );
    alive.value = true;
    await nextTick();
    assert(
      host.querySelector("[data-input-interop-input]") !== input &&
        Number(mounts) === 2,
      "Interop Input remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop Input teardown retained DOM",
    );
    return "input interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
