import {
  createApp,
  h,
  nextTick,
  onScopeDispose,
  ref,
  vaporInteropPlugin,
  watchEffect,
} from "vue";
import { Typography } from "semi-ui-vue";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkTypographyInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("Interop"),
    alive = ref(true),
    number = ref(1234.5);
  let mounts = 0,
    disposals = 0;
  const renderer = () => {
    mounts++;
    const input = document.createElement("input");
    input.dataset.typographyInterop = "";
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
        h(Typography.Title, {
          heading: 2,
          className: "interop-typography-title",
          children: label.value,
        }),
        alive.value ? h(Typography.Text, { children: renderer }) : null,
        h(
          Typography.Paragraph,
          { className: "interop-typography-paragraph" },
          {
            default: () => [
              h("button", { "data-typography-interop-slot": "" }, label.value),
              h("span", "second"),
            ],
          },
        ),
        h(Typography.Numeral, {
          className: "interop-typography-number",
          children: number.value,
          rule: "numbers",
          precision: 2,
        }),
      ]),
  }).use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const input = host.querySelector<HTMLInputElement>(
      "[data-typography-interop]",
    )!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-typography-interop-slot]",
    )!;
    assert(
      host.querySelector(".interop-typography-title")?.tagName === "H2" &&
        host.querySelector(".interop-typography-number")?.textContent ===
          "1234.50",
      "Typography interop semantics/format failed",
    );
    input.focus();
    label.value = "Updated";
    number.value = 0;
    await nextTick();
    assert(
      host.querySelector("[data-typography-interop]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Typography interop renderer lost DOM/focus/scope",
    );
    assert(
      host.querySelector("[data-typography-interop-slot]") === button &&
        button.textContent === "Updated" &&
        host.querySelector(".interop-typography-number")?.textContent ===
          "0.00",
      "Typography interop slot/zero update failed",
    );
    alive.value = false;
    await nextTick();
    assert(
      Number(disposals) === 1,
      "Typography interop branch disposal failed",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      String(input.value) === "Updated",
      "Typography interop disposed effect remained active",
    );
    alive.value = true;
    await nextTick();
    assert(Number(mounts) === 2, "Typography interop remount failed");
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Typography interop unmount retained DOM/scope",
    );
    return "typography interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
