import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Divider from "../../packages/semi-ui-vue/src/components/divider/index.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("Divider scopes observers to each mount and ignores callbacks after disposal", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  const Original = window.MutationObserver;
  const instances: ObservedMutationObserver[] = [];
  let connected = 0;
  class ObservedMutationObserver extends Original {
    callback: MutationCallback;
    active = false;
    constructor(callback: MutationCallback) {
      super(callback);
      this.callback = callback;
      instances.push(this);
    }
    observe(...args: Parameters<MutationObserver["observe"]>) {
      super.observe(...args);
      if (!this.active) connected++;
      this.active = true;
    }
    disconnect() {
      super.disconnect();
      if (this.active) connected--;
      this.active = false;
    }
  }
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: ObservedMutationObserver,
  });
  const first = shallowRef("");
  const second = shallowRef("other");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section>
        <Divider
          data-case="first"
          v-slots={{ default: () => <>{first.value}</> }}
        />
        <Divider
          data-case="second"
          v-slots={{ default: () => <>{second.value}</> }}
        />
      </section>
    )),
  );
  let unmounted = false;
  try {
    await settle();
    expect(connected).toBe(2);
    const roots = [...fixture.host.querySelectorAll(".semi-divider")];
    expect(roots[0]!.classList.contains("semi-divider-with-text")).toBe(false);
    expect(roots[1]!.classList.contains("semi-divider-with-text")).toBe(true);
    first.value = "first";
    second.value = "";
    await settle();
    expect(roots[0]!.classList.contains("semi-divider-with-text")).toBe(true);
    expect(roots[1]!.classList.contains("semi-divider-with-text")).toBe(false);
    fixture.unmount();
    unmounted = true;
    expect(connected).toBe(0);
    const classes = roots.map((root) => root.className);
    for (const observer of instances) observer.callback([], observer);
    await settle();
    expect(roots.map((root) => root.className)).toEqual(classes);
    const remount = mountVapor(
      defineVaporComponent(() => (
        <Divider v-slots={{ default: () => <>remounted</> }} />
      )),
    );
    try {
      await settle();
      expect(connected).toBe(1);
      expect(
        remount.host.querySelector(".semi-divider-with-text")?.textContent,
      ).toBe("remounted");
      for (const observer of instances.slice(0, 2))
        observer.callback([], observer);
      await settle();
      expect(remount.host.textContent).toBe("remounted");
    } finally {
      remount.unmount();
    }
    expect(connected).toBe(0);
  } finally {
    if (!unmounted) fixture.unmount();
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
});

test("Divider still classifies initial content when an observer is unavailable", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Divider v-slots={{ default: () => <>initial</> }} />
      )),
    );
    await settle();
    expect(
      fixture.host.querySelector(".semi-divider_inner-text")?.textContent,
    ).toBe("initial");
  } finally {
    fixture?.unmount();
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
});
