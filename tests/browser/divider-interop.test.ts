import { createApp, h, nextTick, ref, vaporInteropPlugin } from "vue";
import { expect, test } from "vitest";
import Divider from "../../packages/semi-ui-vue/src/components/divider/index.js";

// Deliberate VDOM host evidence, separate from all native Vapor test fixtures.
test("Divider retains slot ownership as a VDOM parent rerenders through interop", async () => {
  const text = ref("one");
  const element = ref(false);
  const vertical = ref(false);
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    setup: () => () =>
      h("section", [
        h("output", text.value),
        h(
          Divider,
          { layout: vertical.value ? "vertical" : "horizontal", margin: 6 },
          {
            default: () => [
              text.value,
              element.value
                ? h("input", { "aria-label": "interop input" })
                : null,
            ],
          },
        ),
      ]),
  });
  app.use(vaporInteropPlugin);
  const settle = async () => {
    await nextTick();
    await Promise.resolve();
    await nextTick();
  };
  try {
    app.mount(host);
    await settle();
    const root = host.querySelector(".semi-divider")!;
    const outlet = root.firstElementChild;
    expect(root.classList.contains("semi-divider-with-text-center")).toBe(true);
    expect(outlet?.className).toBe("semi-divider_inner-text");
    element.value = true;
    await settle();
    const input = root.querySelector("input")!;
    input.value = "retained";
    input.focus();
    text.value = "updated";
    await settle();
    expect(root.firstElementChild).toBe(outlet);
    expect(root.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("retained");
    expect(root.textContent).toBe("updated");
    expect(outlet?.className).toBe("");
    vertical.value = true;
    await settle();
    expect(root.textContent).toBe("");
    expect(root.querySelector("input")).toBeNull();
    expect(root.classList.contains("semi-divider-with-text")).toBe(false);
    vertical.value = false;
    text.value = "";
    element.value = false;
    await settle();
    expect(root.classList.contains("semi-divider-with-text")).toBe(false);
    text.value = "restored";
    await settle();
    expect(root.classList.contains("semi-divider-with-text")).toBe(true);
    expect(root.querySelector(".semi-divider_inner-text")?.textContent).toBe(
      "restored",
    );
  } finally {
    app.unmount();
    expect(host.textContent).toBe("");
    host.remove();
  }
});
