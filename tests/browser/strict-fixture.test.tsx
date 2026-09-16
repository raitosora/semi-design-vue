import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { defineVaporComponent, ref } from "vue";
import {
  StrictFixture,
  type StrictFixtureExposed,
} from "../types/StrictFixture";
import { mountVapor } from "../support/mount-vapor";

test("runs the strict typed fixture as a real Vapor component", async () => {
  expect(StrictFixture.__vapor).toBe(true);

  const model = ref("initial");
  const api = ref<StrictFixtureExposed | null>(null);
  const changed = vi.fn();
  const updated = vi.fn((value: string) => {
    model.value = value;
  });
  const root = defineVaporComponent(() => (
    <StrictFixture
      count={2}
      label="reset-value"
      modelValue={model.value}
      onChange={changed}
      onUpdate:modelValue={updated}
      ref={api}
      v-slots={{
        default: ({ count, label }: { count: number; label: string }) => (
          <span>{`${label}:${count}`}</span>
        ),
        footer: () => <small>fixture-footer</small>,
      }}
    />
  ));
  const mounted = mountVapor(root);
  try {
    await expect
      .element(page.getByText("reset-value:2", { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText("fixture-footer", { exact: true }))
      .toBeVisible();

    await page.getByRole("button").click();
    expect(changed).toHaveBeenCalledWith(2);
    expect(updated).toHaveBeenCalledWith("initial");

    expect(api.value!.focus()).toBe("focused");
    api.value!.reset();
    expect(updated).toHaveBeenLastCalledWith("reset-value");
    expect(model.value).toBe("reset-value");
  } finally {
    mounted.unmount();
  }
});
