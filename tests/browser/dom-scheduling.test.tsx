import { expect, test, vi } from "vitest";
import { defineVaporComponent } from "vue";
import { createDomScheduler } from "../../packages/semi-ui-vue/src/dom/scheduling";
import { mountVapor } from "../support/mount-vapor";

test("scheduler frames and debounce trailing calls with cancel, flush and disposal", async () => {
  let next = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const view = {
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      const id = ++next;
      frames.set(id, callback);
      return id;
    }),
    cancelAnimationFrame: vi.fn((id: number) => frames.delete(id)),
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
  } as unknown as Window;
  const scheduler = createDomScheduler(() => view);
  const frame = vi.fn();
  const cancelFrame = scheduler.frame(frame);
  frames.get(1)!(10);
  cancelFrame();
  expect(frame).toHaveBeenCalledWith(10);
  const callback = vi.fn();
  const debounce = scheduler.debounce(callback, 1000);
  debounce.schedule("first");
  debounce.schedule("last");
  debounce.flush();
  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenLastCalledWith("last");
  debounce.schedule("cancelled");
  debounce.cancel();
  scheduler.dispose();
  debounce.schedule("late");
  expect(callback).toHaveBeenCalledTimes(1);
});

test("scheduler is inert when the browser view is unavailable", () => {
  const scheduler = createDomScheduler(() => undefined);
  const callback = vi.fn();
  scheduler.frame(callback)();
  const debounce = scheduler.debounce(callback, 0);
  debounce.schedule("missing");
  debounce.flush();
  scheduler.dispose();
  expect(callback).not.toHaveBeenCalled();
});

test("frame cancellation stays with the view that created the frame", () => {
  const initial = {
    requestAnimationFrame: vi.fn(() => 17),
    cancelAnimationFrame: vi.fn(),
  } as unknown as Window;
  const replacement = {
    cancelAnimationFrame: vi.fn(),
  } as unknown as Window;
  let current: Window | undefined = initial;
  const scheduler = createDomScheduler(() => current);
  const cancel = scheduler.frame(vi.fn());
  current = replacement;
  cancel();
  expect(initial.cancelAnimationFrame).toHaveBeenCalledWith(17);
  expect(replacement.cancelAnimationFrame).not.toHaveBeenCalled();
});

test("pending scheduler work is released by a real Vapor unmount", async () => {
  const frame = vi.fn();
  const debounce = vi.fn();
  const frameRequest = vi.spyOn(window, "requestAnimationFrame");
  const frameCancel = vi.spyOn(window, "cancelAnimationFrame");
  const timeout = vi.spyOn(window, "setTimeout");
  const timeoutCancel = vi.spyOn(window, "clearTimeout");
  const Probe = defineVaporComponent(() => {
    const scheduler = createDomScheduler(() => window);
    scheduler.frame(frame);
    scheduler.debounce(debounce, 30).schedule("pending");
    return <div>scheduler</div>;
  });
  const mounted = mountVapor(Probe);
  try {
    const timerIndex = timeout.mock.calls.findIndex(
      ([, delay]) => delay === 30,
    );
    expect(timerIndex).toBeGreaterThanOrEqual(0);
    const timer = timeout.mock.results[timerIndex]!.value as number;
    const frameIndex = frameRequest.mock.calls.length - 1;
    expect(frameIndex).toBeGreaterThanOrEqual(0);
    const requestedFrame = frameRequest.mock.results[frameIndex]!
      .value as number;
    mounted.unmount();
    expect(frameCancel).toHaveBeenCalledWith(requestedFrame);
    expect(timeoutCancel).toHaveBeenCalledWith(timer);
    await new Promise((resolve) => window.setTimeout(resolve, 60));
    expect(frame).not.toHaveBeenCalled();
    expect(debounce).not.toHaveBeenCalled();
  } finally {
    if (mounted.host.isConnected) mounted.unmount();
    frameRequest.mockRestore();
    frameCancel.mockRestore();
    timeout.mockRestore();
    timeoutCancel.mockRestore();
  }
});
