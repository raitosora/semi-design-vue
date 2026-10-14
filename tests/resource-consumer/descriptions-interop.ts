import {
  createApp,
  h,
  nextTick,
  onUnmounted,
  ref,
  vaporInteropPlugin,
} from "vue";
import DescriptionsInteropBridge from "./prepared-descriptions-bridge.js";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkDescriptionsInterop() {
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
          "data-descriptions-interop-input": "",
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
                DescriptionsInteropBridge,
                { label: label.value },
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
    assert(input && mounts === 1, "Interop Descriptions content absent");
    input.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      host.querySelector("input") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        disposals === 0 &&
        mounts === 1,
      "Interop Descriptions replaced owned content",
    );
    assert(
      host.querySelector(".semi-descriptions-key")?.textContent === "Updated",
      "Interop Descriptions key update failed",
    );
    input.click();
    assert(clicks === 1, "Interop Descriptions swallowed event");
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("input") && Number(disposals) === 1,
      "Interop Descriptions removal retained content",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Updated",
      "Interop Descriptions disposed child updated",
    );
    alive.value = true;
    await nextTick();
    assert(
      host.querySelector("input") !== input && Number(mounts) === 2,
      "Interop Descriptions remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop Descriptions teardown retained DOM",
    );
    return "descriptions interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
