import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import SplitButtonGroup from "../../packages/semi-ui-vue/src/components/button/splitButtonGroup.js";
import { mountVapor } from "../support/mount-vapor.js";
import { installResourceTracker } from "../support/resource-tracker.js";

test("SplitButtonGroup marks dynamic native descendants and disconnects its observer", async () => {
  const count = shallowRef(2);
  // A slot function is an opaque callback to the parent Vapor block. Keep it
  // stable and place the reactive list in a child Vapor block instead.
  const DynamicButtons = defineVaporComponent(() => (
    <>
      {Array.from({ length: count.value }, (_, index) => (
        <button key={index}>{index}</button>
      ))}
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitButtonGroup v-slots={{ default: () => <DynamicButtons /> }} />
    )),
  );
  const tracker = installResourceTracker(window, document);
  try {
    const buttons = () => [
      ...fixture.host.querySelectorAll<HTMLButtonElement>("button"),
    ];
    expect(buttons()[0]!.classList.contains("semi-button-first")).toBe(true);
    expect(buttons()[1]!.classList.contains("semi-button-last")).toBe(true);
    const removed = buttons()[1]!;
    count.value = 1;
    await nextTick();
    await Promise.resolve();
    expect(buttons()).toHaveLength(1);
    expect(removed.classList.contains("semi-button-first")).toBe(false);
    expect(removed.classList.contains("semi-button-last")).toBe(false);
    expect(buttons()[0]!.classList.contains("semi-button-first")).toBe(true);
    expect(buttons()[0]!.classList.contains("semi-button-last")).toBe(true);
  } finally {
    fixture.unmount();
    tracker.assertClean();
    tracker.restore();
  }
});
