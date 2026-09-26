import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Progress from "../../packages/semi-ui-vue/src/components/progress/index.js";
import type { ProgressProps } from "../../packages/semi-ui-vue/src/components/progress/index.js";
import { mountVapor } from "../support/mount-vapor.js";

function frames() {
  const pending = new Map<number, FrameRequestCallback>();
  const retained = new Map<number, FrameRequestCallback>();
  let now = 1000;
  let id = 0;
  const request = vi
    .spyOn(globalThis, "requestAnimationFrame")
    .mockImplementation((callback) => {
      const handle = ++id;
      pending.set(handle, callback);
      retained.set(handle, callback);
      return handle;
    });
  const cancel = vi
    .spyOn(globalThis, "cancelAnimationFrame")
    .mockImplementation((handle) => {
      pending.delete(handle);
    });
  const time = vi.spyOn(performance, "now").mockImplementation(() => now);
  return {
    pending,
    retained,
    cancel,
    advance(value: number) {
      now = value;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    },
    restore() {
      request.mockRestore();
      cancel.mockRestore();
      time.mockRestore();
    },
  };
}

test("Progress animates integer text over 300ms while line geometry/ARIA update immediately", async () => {
  const clock = frames();
  const input = shallowRef<ProgressProps>({ percent: 10.5, showInfo: true });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    expect(root.textContent).toBe("10.5%");
    expect(clock.pending.size).toBe(0);
    input.value = { ...input.value, percent: 71.5 };
    await nextTick();
    expect(root.getAttribute("aria-valuenow")).toBe("71.5");
    expect(
      root.querySelector<HTMLElement>(".semi-progress-track-inner")!.style
        .width,
    ).toBe("71.5%");
    expect(root.textContent).toBe("10.5%");
    clock.advance(1150);
    await nextTick();
    expect(root.textContent).toBe("41%");
    clock.advance(1300);
    await nextTick();
    expect(root.textContent).toBe("71.5%");
    expect(clock.pending.size).toBe(0);
    input.value = { ...input.value, percent: 71.5, className: "unchanged" };
    await nextTick();
    expect(clock.pending.size).toBe(0);
  } finally {
    fixture.unmount();
    clock.restore();
  }
});

test.each([
  { type: "line", target: 6, elapsed: 180, expected: 4 },
  { type: "circle", target: 6, elapsed: 180, expected: 4 },
  { type: "line", target: 25, elapsed: 100, expected: 9 },
  { type: "circle", target: 25, elapsed: 100, expected: 9 },
] as const)(
  "Progress $type retains upstream integer frames from 1 to $target at $elapsed ms",
  async ({ type, target, elapsed, expected }) => {
    const clock = frames();
    const input = shallowRef<ProgressProps>({
      type,
      percent: 1,
      showInfo: true,
    });
    const fixture = mountVapor(
      defineVaporComponent(() => <Progress {...input.value} />),
    );
    try {
      input.value = { ...input.value, percent: target };
      await nextTick();
      clock.advance(1000 + elapsed);
      await nextTick();
      const root = fixture.host.firstElementChild!;
      expect(root.textContent).toBe(`${expected}%`);
      expect(root.getAttribute("aria-valuenow")).toBe(
        String(type === "line" ? target : expected),
      );
      clock.advance(1300);
      await nextTick();
      expect(root.textContent).toBe(`${target}%`);
      expect(clock.pending.size).toBe(0);
    } finally {
      fixture.unmount();
      clock.restore();
    }
  },
);

test("Progress circle ARIA follows animated text; rapid reversal invalidates stale callbacks and motion disabling cancels", async () => {
  const clock = frames();
  const motion = vi.fn(() => ({ duration: 9999 }));
  const input = shallowRef<ProgressProps>({
    type: "circle",
    percent: 0,
    showInfo: true,
    motion,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    input.value = { ...input.value, percent: 100 };
    await nextTick();
    const firstHandle = [...clock.pending.keys()][0]!;
    const stale = clock.retained.get(firstHandle)!;
    clock.advance(1150);
    await nextTick();
    expect(root.textContent).toBe("50%");
    expect(root.getAttribute("aria-valuenow")).toBe("50");
    expect(
      root
        .querySelector(".semi-progress-circle-ring-inner")!
        .getAttribute("stroke-dashoffset"),
    ).toBe("0");
    input.value = { ...input.value, percent: 20 };
    await nextTick();
    stale(1300);
    await nextTick();
    expect(root.textContent).toBe("50%");
    clock.advance(1300);
    await nextTick();
    // Fixed upstream restarts from the previous prop target, not the visible frame.
    expect(root.textContent).toBe("60%");
    input.value = { ...input.value, motion: false };
    await nextTick();
    expect(root.textContent).toBe("20%");
    expect(root.getAttribute("aria-valuenow")).toBe("20");
    expect(clock.pending.size).toBe(0);
    expect(clock.cancel).toHaveBeenCalled();
    expect(motion).not.toHaveBeenCalled();
    input.value = { ...input.value, motion: { duration: 9999 }, percent: 40 };
    await nextTick();
    clock.advance(1600);
    await nextTick();
    expect(root.textContent).toBe("40%");
  } finally {
    fixture.unmount();
    clock.restore();
  }
});

test("Progress releases pending RAF on unmount and rejects retained callbacks after remount", async () => {
  const clock = frames();
  const input = shallowRef<ProgressProps>({ percent: 0, showInfo: true });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  let mounted = true;
  try {
    input.value = { ...input.value, percent: 100 };
    await nextTick();
    const handle = [...clock.pending.keys()][0]!;
    const late = clock.retained.get(handle)!;
    const oldRoot = fixture.host.firstElementChild!;
    fixture.unmount();
    mounted = false;
    expect(clock.cancel).toHaveBeenCalledWith(handle);
    expect(clock.pending.size).toBe(0);
    expect(fixture.host.childNodes).toHaveLength(0);
    const next = mountVapor(
      defineVaporComponent(() => <Progress percent={45} showInfo />),
    );
    try {
      late(1500);
      await nextTick();
      expect(oldRoot.textContent).toBe("0%");
      expect(next.host.textContent).toBe("45%");
      expect(clock.pending.size).toBe(0);
    } finally {
      next.unmount();
    }
  } finally {
    if (mounted) fixture.unmount();
    clock.restore();
  }
});

test("Progress fractional and negative animations keep raw-target interpolation and settle after mode changes", async () => {
  const clock = frames();
  const input = shallowRef<ProgressProps>({ percent: -10, showInfo: true });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    input.value = { ...input.value, percent: 10.5 };
    await nextTick();
    clock.advance(1100);
    await nextTick();
    expect(fixture.host.textContent).toBe("0%");
    input.value = { ...input.value, type: "circle", indeterminate: true };
    await nextTick();
    expect(fixture.host.textContent).toBe("");
    clock.advance(1300);
    await nextTick();
    input.value = { ...input.value, indeterminate: false };
    await nextTick();
    expect(fixture.host.textContent).toBe("10.5%");
    expect(clock.pending.size).toBe(0);
  } finally {
    fixture.unmount();
    clock.restore();
  }
});

test("Progress retains upstream parseInt exponent frames for extreme finite percentages and settles zero/fractions", async () => {
  const clock = frames();
  const input = shallowRef<ProgressProps>({ percent: 0, showInfo: true });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    input.value = { ...input.value, percent: Number.MAX_VALUE };
    await nextTick();
    clock.advance(1150);
    await nextTick();
    // Upstream parseInt(number) reads the first digit of exponential notation.
    expect(fixture.host.textContent).toBe("8%");
    clock.advance(1300);
    await nextTick();
    expect(fixture.host.textContent).toBe("100%");
    input.value = { ...input.value, percent: -Number.MAX_VALUE };
    await nextTick();
    clock.advance(1450);
    await nextTick();
    expect(fixture.host.textContent).toBe("0%");
    clock.advance(1600);
    await nextTick();
    expect(fixture.host.textContent).toBe("0%");
    input.value = { ...input.value, percent: Number.MIN_VALUE };
    await nextTick();
    clock.advance(1900);
    await nextTick();
    expect(fixture.host.textContent).toBe(`${Number.MIN_VALUE}%`);
    input.value = { ...input.value, percent: -0.5 };
    await nextTick();
    clock.advance(2050);
    await nextTick();
    expect(fixture.host.textContent).toBe("0%");
    clock.advance(2200);
    await nextTick();
    input.value = { ...input.value, percent: 0 };
    await nextTick();
    clock.advance(2500);
    await nextTick();
    expect(fixture.host.textContent).toBe("0%");
    expect(clock.pending.size).toBe(0);
  } finally {
    fixture.unmount();
    clock.restore();
  }
});

test("Progress settles an unchanged percentage when a truthy motion object changes and cancels the real pending RAF", async () => {
  const nativeRequest = globalThis.requestAnimationFrame.bind(globalThis);
  let handle: number | undefined;
  let retained: FrameRequestCallback | undefined;
  const request = vi
    .spyOn(globalThis, "requestAnimationFrame")
    .mockImplementation((callback) => {
      retained = callback;
      handle = nativeRequest(callback);
      return handle;
    });
  const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
  const input = shallowRef<ProgressProps>({
    type: "circle",
    percent: 0,
    showInfo: true,
    motion: { duration: 1 },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    input.value = { ...input.value, percent: 80 };
    await nextTick();
    const root = fixture.host.firstElementChild!;
    expect(handle).toBeDefined();
    expect(root.textContent).toBe("0%");
    expect(root.getAttribute("aria-valuenow")).toBe("0");
    const pendingHandle = handle!;
    const late = retained!;
    input.value = { ...input.value, motion: { duration: 2 } };
    await nextTick();
    expect(input.value.percent).toBe(80);
    expect(cancel).toHaveBeenCalledWith(pendingHandle);
    expect(root.textContent).toBe("80%");
    expect(root.getAttribute("aria-valuenow")).toBe("80");
    expect(request).toHaveBeenCalledTimes(1);
    late(performance.now() + 150);
    await nextTick();
    expect(root.textContent).toBe("80%");
    expect(request).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
    request.mockRestore();
    cancel.mockRestore();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});
