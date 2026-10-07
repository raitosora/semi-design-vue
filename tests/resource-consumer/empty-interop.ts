import {
  createApp,
  h,
  nextTick,
  onScopeDispose,
  ref,
  vaporInteropPlugin,
  watchEffect,
} from "vue";
import { Empty } from "semi-ui-vue";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkEmptyInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const originalTheme = document.body.getAttribute("theme-mode");
  document.body.removeAttribute("theme-mode");
  const label = ref("Interop"),
    alive = ref(true);
  let mounts = 0,
    disposals = 0;
  const description = () => {
    mounts++;
    const input = document.createElement("input");
    input.dataset.emptyInteropInput = "";
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
              Empty,
              {
                title: label.value,
                description,
                className: "interop-empty",
                image:
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
                darkModeImage:
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2'/%3E",
              },
              {
                default: () =>
                  h("button", { "data-empty-interop-button": "" }, label.value),
              },
            )
          : null,
        h(Empty, { title: "No image", className: "interop-empty-no-image" }),
      ]),
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>(
      "[data-empty-interop-input]",
    )!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-empty-interop-button]",
    )!;
    assert(
      host.querySelector(".interop-empty h4")?.textContent === "Interop" &&
        host.querySelector(".interop-empty-no-image h6")?.textContent ===
          "No image",
      "Interop Empty title level failed",
    );
    assert(
      host
        .querySelector(".interop-empty .semi-empty-image img")
        ?.getAttribute("src") ===
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
      "Interop Empty light image failed",
    );
    button.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      host.querySelector("[data-empty-interop-button]") === button &&
        button.textContent === "Updated" &&
        document.activeElement === button,
      "Interop Empty slot DOM/focus changed",
    );
    assert(
      host.querySelector("[data-empty-interop-input]") === input &&
        input.value === "Updated" &&
        mounts === 1 &&
        disposals === 0,
      "Interop Empty native renderer ownership failed",
    );
    input.focus();
    label.value = "Focused";
    await nextTick();
    assert(
      document.activeElement === input &&
        String(input.value) === "Focused" &&
        mounts === 1 &&
        disposals === 0,
      "Interop Empty renderer focus lost",
    );
    document.body.setAttribute("theme-mode", "dark");
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await nextTick();
    assert(
      host
        .querySelector(".interop-empty .semi-empty-image img")
        ?.getAttribute("src") ===
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2'/%3E" &&
        host.querySelector("[data-empty-interop-input]") === input &&
        document.activeElement === input,
      "Interop Empty theme selection/ownership failed",
    );
    alive.value = false;
    await nextTick();
    assert(
      Number(disposals) === 1 && !host.querySelector(".interop-empty"),
      "Interop Empty unmount retained scope",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Focused",
      "Interop Empty disposed effect still active",
    );
    alive.value = true;
    await nextTick();
    assert(
      Number(mounts) === 2 &&
        host.querySelector<HTMLInputElement>("[data-empty-interop-input]")
          ?.value === "Disposed",
      "Interop Empty remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Interop Empty teardown retained DOM/scope",
    );
    document.body.removeAttribute("theme-mode");
    label.value = "Unmounted";
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await nextTick();
    assert(
      host.childNodes.length === 0 && Number(mounts) === 2,
      "Interop Empty detached updates revived DOM",
    );
    return "empty interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalTheme === null) document.body.removeAttribute("theme-mode");
    else document.body.setAttribute("theme-mode", originalTheme);
  }
}
