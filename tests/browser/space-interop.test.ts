import { createApp, h, nextTick, ref, vaporInteropPlugin } from "vue";
import { expect, test } from "vitest";
import Space from "../../packages/semi-ui-vue/src/components/space/index.js";

// Ordinary Vue host evidence; native Vapor behavior is tested separately.
test("Space keeps an interop slot mounted while spacing and direction update", async () => {
  const spacing = ref<"tight" | "loose">("tight");
  const vertical = ref(false);
  const label = ref("one");
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h(
        Space,
        { spacing: spacing.value, vertical: vertical.value },
        {
          default: () => [
            h("input", { "aria-label": "interop input" }),
            h("span", label.value),
          ],
        },
      ),
  });
  app.use(vaporInteropPlugin);
  const settle = async () => {
    await nextTick();
    await Promise.resolve();
    await nextTick();
  };
  try {
    app.mount(host);
    const root = host.querySelector(".semi-space")!;
    const input = root.querySelector("input")!;
    input.value = "retained";
    input.focus();
    spacing.value = "loose";
    vertical.value = true;
    label.value = "two";
    await settle();
    expect(root.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("retained");
    expect(root.querySelector("span")?.textContent).toBe("two");
    expect(root.classList.contains("semi-space-vertical")).toBe(true);
    expect(root.classList.contains("semi-space-loose-horizontal")).toBe(true);
  } finally {
    app.unmount();
    expect(host.textContent).toBe("");
    host.remove();
  }
});
