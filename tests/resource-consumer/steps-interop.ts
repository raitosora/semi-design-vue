import {
  createApp,
  h,
  nextTick,
  onUnmounted,
  ref,
  vaporInteropPlugin,
} from "vue";
import StepsInteropBridge from "./prepared-steps-bridge.js";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkStepsInterop() {
  const host = document.createElement("div");
  document.body.append(host);
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
          "data-steps-interop-input": "",
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
                StepsInteropBridge,
                {
                  label: label.value,
                  current: label.value === "Interop" ? 0 : 1,
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
    const input = host.querySelector<HTMLInputElement>("input")!;
    assert(input && mounts === 1, "Interop Steps content absent");
    input.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      host.querySelector("input") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        disposals === 0 &&
        mounts === 1,
      "Interop Steps replaced owned content",
    );
    assert(
      host.querySelector(".semi-steps-item-description")?.textContent ===
        "Updated",
      "Interop Steps description update failed",
    );
    input.click();
    assert(clicks === 1, "Interop Steps swallowed event");
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("input") && Number(disposals) === 1,
      "Interop Steps removal retained content",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Updated",
      "Interop Steps disposed child updated",
    );
    alive.value = true;
    await nextTick();
    assert(
      host.querySelector("input") !== input && Number(mounts) === 2,
      "Interop Steps remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop Steps teardown retained DOM",
    );
    return "steps interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
