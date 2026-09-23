import { expect, test } from "vitest";
import { createApp, h, nextTick, ref, vaporInteropPlugin } from "vue";
import { Button, ButtonGroup, SplitButtonGroup } from "semi-ui-vue";

// This VDOM host is deliberate interop evidence, separate from pure Vapor tests.
test("interop host rerenders preserve native Button slots and group ownership", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const clicks = ref(0);
  const loading = ref(true);
  const showIcon = ref(true);
  const label = ref("Save");
  const count = ref(2);
  const app = createApp({
    setup: () => () =>
      h("section", [
        h("output", String(clicks.value)),
        h(
          Button,
          { className: "plain", onClick: () => clicks.value++ },
          {
            default: () => h("strong", label.value),
          },
        ),
        h(
          Button,
          {
            className: "action",
            loading: loading.value,
            onClick: () => clicks.value++,
          },
          {
            default: () => h("span", label.value),
            ...(showIcon.value
              ? {
                  icon: () =>
                    h(
                      "span",
                      { "data-action-icon": "", "aria-hidden": "true" },
                      "*",
                    ),
                }
              : {}),
          },
        ),
        h(
          ButtonGroup,
          { disabled: true, type: "danger", size: "small" },
          {
            default: () => [
              h(Button, { className: "inherited", text: "Inherited" }),
              h(Button, {
                className: "own",
                disabled: undefined,
                type: "warning",
                text: "Own",
              }),
            ],
          },
        ),
        h(
          SplitButtonGroup,
          {},
          {
            default: () =>
              Array.from({ length: count.value }, (_, index) =>
                h(Button, {
                  key: index,
                  className: `split-${index}`,
                  text: index,
                }),
              ),
          },
        ),
      ]),
  });
  const button = (name: string) =>
    host.querySelector<HTMLButtonElement>(`.${name}`)!;
  const settle = async () => {
    await nextTick();
    await Promise.resolve();
  };
  app.use(vaporInteropPlugin);
  try {
    app.mount(host);
    await settle();
    expect(button("action").querySelector('[data-icon="spin"]')).not.toBeNull();
    button("plain").click();
    await settle();
    button("action").click();
    await settle();
    expect(clicks.value).toBe(2);
    expect(button("plain").textContent).toBe("Save");
    expect(button("action").textContent).toBe("Save");
    expect(button("inherited").disabled).toBe(true);
    expect(button("inherited").className).toContain(
      "semi-button-danger-disabled",
    );
    expect(button("inherited").className).toContain("semi-button-size-small");
    expect(button("own").disabled).toBe(false);
    expect(button("split-0").className).toContain("semi-button-first");
    expect(button("split-1").className).toContain("semi-button-last");
    loading.value = false;
    label.value = "Updated";
    count.value = 1;
    await settle();
    expect(button("action").querySelector("[data-action-icon]")).not.toBeNull();
    expect(button("action").querySelector('[data-icon="spin"]')).toBeNull();
    expect(button("plain").textContent).toBe("Updated");
    expect(button("action").textContent).toBe("*Updated");
    expect(button("split-0").className).toContain("semi-button-last");
    expect(host.querySelector(".split-1")).toBeNull();
    showIcon.value = false;
    await settle();
    expect(button("action").className).not.toContain("semi-button-with-icon");
    expect(button("action").textContent).toBe("Updated");
    button("action").click();
    await settle();
    expect(clicks.value).toBe(3);
  } finally {
    app.unmount();
    expect(host.textContent).toBe("");
    host.remove();
  }
});
