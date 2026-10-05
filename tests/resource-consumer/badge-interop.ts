import {
  createApp,
  h,
  nextTick,
  onScopeDispose,
  ref,
  vaporInteropPlugin,
  watchEffect,
} from "vue";
import { Badge } from "semi-ui-vue";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkBadgeInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const count = ref(10),
    label = ref("Interop"),
    dot = ref(false);
  let mounts = 0,
    disposals = 0;
  const custom = () => {
    mounts++;
    const input = document.createElement("input");
    input.dataset.badgeInteropCustom = "";
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
        h(
          Badge,
          {
            count: count.value,
            overflowCount: 9,
            className: "interop-badge-anchor",
          },
          {
            default: () =>
              h("button", { "data-badge-interop-anchor": "" }, label.value),
          },
        ),
        h(Badge, {
          count: custom,
          dot: dot.value,
          className: "interop-badge-custom",
        }),
        h(Badge, { count: 0, className: "interop-badge-zero" }),
      ]),
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const button = host.querySelector<HTMLButtonElement>(
      "[data-badge-interop-anchor]",
    )!;
    const input = host.querySelector<HTMLInputElement>(
      "[data-badge-interop-custom]",
    )!;
    assert(
      host.querySelector(".interop-badge-anchor .semi-badge-count")
        ?.textContent === "9+" &&
        host.querySelector(".interop-badge-zero .semi-badge-block")
          ?.textContent === "0",
      "Interop Badge count/standalone failed",
    );
    button.focus();
    label.value = "Updated";
    count.value = 9;
    await nextTick();
    assert(
      host.querySelector("[data-badge-interop-anchor]") === button &&
        button.textContent === "Updated" &&
        document.activeElement === button,
      "Interop Badge slot DOM/focus ownership failed",
    );
    assert(
      host.querySelector("[data-badge-interop-custom]") === input &&
        input.value === "Updated" &&
        mounts === 1 &&
        disposals === 0,
      "Interop Badge native renderer ownership failed",
    );
    assert(
      host.querySelector(".interop-badge-anchor .semi-badge-count")
        ?.textContent === "9",
      "Interop Badge exact overflow boundary failed",
    );
    input.focus();
    label.value = "Focused";
    await nextTick();
    assert(
      host.querySelector("[data-badge-interop-custom]") === input &&
        String(input.value) === "Focused" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Interop Badge renderer update lost DOM/focus",
    );
    dot.value = true;
    await nextTick();
    assert(
      !host.querySelector("[data-badge-interop-custom]") &&
        mounts === 1 &&
        Number(disposals) === 1,
      "Interop Badge dot did not suppress renderer",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Focused",
      "Interop Badge disposed renderer effect stayed active",
    );
    dot.value = false;
    await nextTick();
    assert(
      Number(mounts) === 2 &&
        host.querySelector<HTMLInputElement>("[data-badge-interop-custom]")
          ?.value === "Disposed",
      "Interop Badge renderer remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop Badge unmount retained DOM/scope",
    );
    return "badge interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
