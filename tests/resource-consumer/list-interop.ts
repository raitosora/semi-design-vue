import {
  createApp,
  h,
  nextTick,
  onScopeDispose,
  ref,
  vaporInteropPlugin,
  watchEffect,
} from "vue";
import ListInteropBridge from "./prepared-list-bridge.js";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkListInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("Interop"),
    loading = ref(false),
    alive = ref(true);
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const main = () => {
    mounts++;
    const input = document.createElement("input");
    input.dataset.listInteropInput = "";
    watchEffect(() => {
      input.value = label.value;
    });
    onScopeDispose(() => {
      disposals++;
    });
    return input;
  };
  const app = createApp({
    setup: () => () =>
      h("section", [
        alive.value
          ? h(
              ListInteropBridge,
              {
                header: label.value,
                loading: loading.value,
                main,
                onClick: () => {
                  clicks++;
                },
              },
              {
                extra: () =>
                  h("button", { "data-list-interop-action": "" }, label.value),
              },
            )
          : null,
      ]),
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>(
      "[data-list-interop-input]",
    )!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-list-interop-action]",
    )!;
    assert(
      input && button && mounts === 1,
      "Interop List owned content absent",
    );
    input.focus();
    label.value = "Updated";
    loading.value = true;
    await nextTick();
    assert(
      host.querySelector("[data-list-interop-input]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        disposals === 0 &&
        mounts === 1,
      "Interop List loading remounted content",
    );
    assert(
      host.querySelector("[data-list-interop-action]") === button &&
        button.textContent === "Updated",
      "Interop bridged VDOM action identity/update failed",
    );
    button.click();
    assert(clicks === 1, "Interop List context click missing");
    alive.value = false;
    await nextTick();
    assert(
      Number(disposals) === 1 && !host.querySelector("[data-list-interop]"),
      "Interop List removal retained content",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Updated",
      "Interop List disposed effect active",
    );
    alive.value = true;
    await nextTick();
    assert(
      Number(mounts) === 2 &&
        host.querySelector("[data-list-interop-input]") !== input,
      "Interop List remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop List teardown retained DOM/scope",
    );
    return "list interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
