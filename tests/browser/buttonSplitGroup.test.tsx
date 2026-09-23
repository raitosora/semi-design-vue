import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import SplitButtonGroup from "../../packages/semi-ui-vue/src/components/button/splitButtonGroup.js";
import { mountVapor } from "../support/mount-vapor.js";
import { installResourceTracker } from "../support/resource-tracker.js";

test("SplitButtonGroup tracks nested and dynamic native buttons and releases its observer", async () => {
  const count = shallowRef(2);
  const DynamicButtons = defineVaporComponent(() => (
    <section>
      {Array.from({ length: count.value }, (_, index) => (
        <button key={index}>{index}</button>
      ))}
    </section>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitButtonGroup
        v-slots={{
          default: () => <DynamicButtons />,
        }}
      />
    )),
  );
  const tracker = installResourceTracker(window, document);
  try {
    const buttons = () => [
      ...fixture.host.querySelectorAll<HTMLButtonElement>("button"),
    ];
    expect(buttons()[0]!.classList.contains("semi-button-first")).toBe(true);
    expect(buttons()[1]!.classList.contains("semi-button-last")).toBe(true);
    count.value = 1;
    await nextTick();
    await Promise.resolve();
    expect(buttons()).toHaveLength(1);
    expect(buttons()[0]!.classList.contains("semi-button-first")).toBe(true);
    expect(buttons()[0]!.classList.contains("semi-button-last")).toBe(true);
  } finally {
    fixture.unmount();
    tracker.assertClean();
    tracker.restore();
  }
});

test("nested SplitButtonGroups retain nearest-owner boundaries through zero, remount, and many children", async () => {
  const outerCount = shallowRef(2);
  const innerCount = shallowRef(0);
  const shown = shallowRef(true);
  const InnerContent = defineVaporComponent(() => (
    <>
      {Array.from({ length: innerCount.value }, (_, index) => (
        <button data-inner="" key={index}>
          inner-{index}
        </button>
      ))}
    </>
  ));
  const OuterContent = defineVaporComponent(() => (
    <>
      {Array.from({ length: outerCount.value }, (_, index) => (
        <button data-outer="" key={index}>
          outer-{index}
        </button>
      ))}
      {shown.value && (
        <SplitButtonGroup
          className="inner-split-group"
          v-slots={{ default: () => <InnerContent /> }}
        />
      )}
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitButtonGroup
        className="outer-split-group"
        v-slots={{ default: () => <OuterContent /> }}
      />
    )),
  );
  try {
    const outer = () =>
      fixture.host.querySelector<HTMLElement>(".outer-split-group")!;
    const inner = () =>
      fixture.host.querySelector<HTMLElement>(".inner-split-group")!;
    const ownButtons = (root: HTMLElement) =>
      [...root.querySelectorAll<HTMLButtonElement>("button")].filter(
        (button) => button.closest(".semi-button-split") === root,
      );
    expect(ownButtons(outer())).toHaveLength(2);
    expect(
      ownButtons(outer())[0]!.classList.contains("semi-button-first"),
    ).toBe(true);
    expect(ownButtons(outer())[1]!.classList.contains("semi-button-last")).toBe(
      true,
    );
    expect(ownButtons(inner())).toHaveLength(0);

    innerCount.value = 1;
    await nextTick();
    await Promise.resolve();
    expect(
      ownButtons(inner())[0]!.classList.contains("semi-button-first"),
    ).toBe(true);
    expect(ownButtons(inner())[0]!.classList.contains("semi-button-last")).toBe(
      true,
    );
    expect(ownButtons(outer())[1]!.classList.contains("semi-button-last")).toBe(
      true,
    );

    innerCount.value = 3;
    outerCount.value = 1;
    await nextTick();
    await Promise.resolve();
    expect(ownButtons(inner())).toHaveLength(3);
    expect(
      ownButtons(inner())[0]!.classList.contains("semi-button-first"),
    ).toBe(true);
    expect(ownButtons(inner())[2]!.classList.contains("semi-button-last")).toBe(
      true,
    );
    expect(
      ownButtons(outer())[0]!.classList.contains("semi-button-first"),
    ).toBe(true);
    expect(ownButtons(outer())[0]!.classList.contains("semi-button-last")).toBe(
      true,
    );

    const oldInner = ownButtons(inner())[2]!;
    shown.value = false;
    await nextTick();
    await Promise.resolve();
    expect(fixture.host.querySelector(".inner-split-group")).toBeNull();
    expect(oldInner.classList.contains("semi-button-last")).toBe(false);
    shown.value = true;
    await nextTick();
    await Promise.resolve();
    expect(ownButtons(inner())).toHaveLength(3);
    expect(ownButtons(inner())[2]!.classList.contains("semi-button-last")).toBe(
      true,
    );
  } finally {
    fixture.unmount();
  }
});

test("SplitButtonGroup marks initial native boundaries when MutationObserver is unavailable", () => {
  const original = window.MutationObserver;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <SplitButtonGroup
        v-slots={{
          default: () => (
            <>
              <button data-first="" />
              <button data-last="" />
            </>
          ),
        }}
      />
    )),
  );
  try {
    expect(
      fixture.host
        .querySelector("[data-first]")!
        .classList.contains("semi-button-first"),
    ).toBe(true);
    expect(
      fixture.host
        .querySelector("[data-last]")!
        .classList.contains("semi-button-last"),
    ).toBe(true);
  } finally {
    fixture.unmount();
    Object.defineProperty(window, "MutationObserver", {
      configurable: true,
      value: original,
    });
  }
});
