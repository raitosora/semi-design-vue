import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import { Lifecycle } from "../fixtures/Lifecycle.vapor";
import { Model } from "../fixtures/Model.vapor";
import { mountVapor } from "../support/mount-vapor";
import { installResourceTracker } from "../support/resource-tracker";
import { version as ui } from "semi-ui-vue";
import { version as icons } from "semi-icons-vue";
import { version as lab } from "semi-icons-lab-vue";
import { version as illustrations } from "semi-illustrations-vue";
import { version as animation } from "semi-animation-vue";
import { version as theme } from "vite-plugin-semi-theme";

test("consumes every current package source entry", () => {
  expect([ui, icons, lab, illustrations, animation, theme]).toEqual(
    Array(6).fill("0.0.0"),
  );
});

test("repeated Vapor mounts release listeners, intervals, frames and observers", () => {
  const props = { label: "Resources", onPulse: vi.fn(), onDispose: vi.fn() };
  const root = defineVaporComponent(() => (
    <Lifecycle
      label={props.label}
      onDispose={props.onDispose}
      onPulse={props.onPulse}
    />
  ));
  // Vue installs shared delegated event infrastructure once per document.
  // Establish that baseline before tracking resources owned by each mount.
  mountVapor(root).unmount();
  for (let cycle = 0; cycle < 3; cycle += 1) {
    // App creation schedules Vue's own 3s devtools bootstrap timer. Track
    // component-owned resources from mount through unmount instead.
    const app = createVaporApp(root);
    const host = document.createElement("div");
    document.body.append(host);
    const resources = installResourceTracker(window, document);
    try {
      app.mount(host);
      expect(() => resources.assertClean()).toThrow(
        /listeners=1.*intervals=1.*animationFrames=1.*resizeObservations=1/,
      );
      window.dispatchEvent(new Event("semi-test-pulse"));
      expect(props.onPulse).toHaveBeenCalledTimes(cycle + 1);
      app.unmount();
      resources.assertClean();
      expect(host.childElementCount).toBe(0);
      window.dispatchEvent(new Event("semi-test-pulse"));
      expect(props.onPulse).toHaveBeenCalledTimes(cycle + 1);
    } finally {
      if (host.childElementCount) app.unmount();
      host.remove();
      resources.restore();
    }
  }
});

test("mounts native Vapor, updates props and conditions, and disposes on each unmount", async () => {
  const label = ref("Initial");
  const visible = ref(true);
  const pulse = vi.fn();
  const dispose = vi.fn();
  const root = defineVaporComponent(() => (
    <Lifecycle
      v-if={visible.value}
      label={label.value}
      onDispose={dispose}
      onPulse={pulse}
    />
  ));
  const mounted = mountVapor(root);
  try {
    await expect
      .element(page.getByRole("heading", { name: "Initial" }))
      .toBeVisible();
    label.value = "Updated";
    await expect
      .element(page.getByRole("heading", { name: "Updated" }))
      .toBeVisible();
    await page.getByRole("button", { name: "Count 0" }).click();
    await expect
      .element(page.getByText("Changed", { exact: true }))
      .toBeVisible();
    window.dispatchEvent(new Event("semi-test-pulse"));
    expect(pulse).toHaveBeenCalledTimes(1);
    visible.value = false;
    await nextTick();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(mounted.host.querySelector("section")).toBeNull();
    window.dispatchEvent(new Event("semi-test-pulse"));
    expect(pulse).toHaveBeenCalledTimes(1);
    visible.value = true;
    await nextTick();
    window.dispatchEvent(new Event("semi-test-pulse"));
    expect(pulse).toHaveBeenCalledTimes(2);
  } finally {
    mounted.unmount();
  }
  expect(dispose).toHaveBeenCalledTimes(2);
  expect(mounted.host.childElementCount).toBe(0);
});

test("runs model macros in the real browser compiler pipeline", async () => {
  const value = ref("before");
  const api = ref<{ focus(): void } | null>(null);
  const root = defineVaporComponent(() => (
    <Model ref={api} v-model={value.value} />
  ));
  const mounted = mountVapor(root);
  try {
    api.value!.focus();
    expect(document.activeElement).toBe(mounted.host.querySelector("input"));
    await page.getByRole("textbox", { name: "Model" }).fill("after");
    expect(value.value).toBe("after");
    value.value = "parent";
    await expect
      .element(page.getByRole("textbox", { name: "Model" }))
      .toHaveValue("parent");
  } finally {
    mounted.unmount();
  }
});
