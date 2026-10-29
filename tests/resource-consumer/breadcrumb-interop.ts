import {
  createApp,
  h,
  nextTick,
  onUnmounted,
  ref,
  vaporInteropPlugin,
} from "vue";
import { provideAriaIdScope } from "semi-ui-vue";
import BreadcrumbInteropBridge from "./prepared-breadcrumb-bridge.js";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkBreadcrumbInterop() {
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
          "data-breadcrumb-interop-input": "",
          value: label.value,
        });
    },
  };
  const app = createApp({
    setup: () => {
      provideAriaIdScope("packed-breadcrumb-interop");
      return () =>
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
                  BreadcrumbInteropBridge,
                  { label: label.value },
                  { default: () => h(Child) },
                )
              : null,
          ],
        );
    },
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>("input")!;
    assert(input && mounts === 1, "Interop Breadcrumb content absent");
    input.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      host.querySelector("input") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        disposals === 0 &&
        mounts === 1,
      "Interop Breadcrumb replaced owned content",
    );
    assert(
      host.querySelector("[data-breadcrumb-interop-label]")?.textContent ===
        "Updated",
      "Interop Breadcrumb label update failed",
    );
    input.click();
    assert(clicks === 1, "Interop Breadcrumb swallowed event");
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("input") && Number(disposals) === 1,
      "Interop Breadcrumb removal retained content",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Updated",
      "Interop Breadcrumb disposed child updated",
    );
    alive.value = true;
    await nextTick();
    assert(
      host.querySelector("input") !== input && Number(mounts) === 2,
      "Interop Breadcrumb remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop Breadcrumb teardown retained DOM",
    );
    return "breadcrumb interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
