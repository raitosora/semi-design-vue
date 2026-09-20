import { expect, test, vi } from "vitest";
import { defineVaporComponent } from "vue";
import {
  clampDragOffset,
  createPointerSession,
  resizeRect,
} from "../../packages/semi-ui-vue/src/internal/pointer/index";
import { mountVapor } from "../support/mount-vapor";

test("pointer sessions own capture and release it on completion, cancellation and loss", () => {
  const handle = document.createElement("div");
  document.body.append(handle);
  const capture = vi.fn();
  const release = vi.fn();
  Object.assign(handle, {
    setPointerCapture: capture,
    releasePointerCapture: release,
    hasPointerCapture: () => true,
  });
  const starts = vi.fn();
  const moves = vi.fn();
  const ends = vi.fn();
  const session = createPointerSession({
    element: () => handle,
    onStart: starts,
    onMove: moves,
    onEnd: ends,
  });
  try {
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 7,
        clientX: 10,
        clientY: 20,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 7,
        clientX: 15,
        clientY: 22,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        pointerId: 7,
        clientX: 18,
        clientY: 24,
      }),
    );
    expect(capture).toHaveBeenCalledWith(7);
    expect(starts).toHaveBeenCalledTimes(1);
    expect(moves.mock.calls[0]![0].delta).toEqual({ x: 5, y: 2 });
    expect(ends.mock.calls[0]![1]).toBe("end");
    expect(release).toHaveBeenCalledWith(7);

    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 8,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent("pointercancel", { bubbles: true, pointerId: 8 }),
    );
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 9,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent("lostpointercapture", { bubbles: true, pointerId: 9 }),
    );
    expect(ends.mock.calls.map((call) => call[1])).toEqual([
      "end",
      "cancel",
      "lost-capture",
    ]);
  } finally {
    session.dispose();
    handle.remove();
  }
});

test("a pending capture release settles on the next move without a lost-capture event", () => {
  const handle = document.createElement("div");
  const captured = new Set<number>();
  const capture = vi.fn((pointerId: number) => captured.add(pointerId));
  const release = vi.fn((pointerId: number) => captured.delete(pointerId));
  Object.assign(handle, {
    setPointerCapture: capture,
    releasePointerCapture: release,
    hasPointerCapture: (pointerId: number) => captured.has(pointerId),
  });
  const move = vi.fn();
  const end = vi.fn();
  const session = createPointerSession({
    element: () => handle,
    onMove: move,
    onEnd: end,
  });
  try {
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 11,
      }),
    );
    release(11);
    handle.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerId: 11 }),
    );
    expect(move).not.toHaveBeenCalled();
    expect(end.mock.calls[0]![1]).toBe("lost-capture");
    expect(session.active).toBe(false);
    expect(capture).toHaveBeenCalledWith(11);
  } finally {
    session.dispose();
  }
});

test("sessions isolate leases by owner document and release active capture during disposal", () => {
  const first = document.createElement("div");
  const frame = document.createElement("iframe");
  document.body.append(first, frame);
  const second = frame.contentDocument!.createElement("div");
  frame.contentDocument!.body.append(second);
  const firstEnd = vi.fn();
  const secondEnd = vi.fn();
  const firstRelease = vi.fn();
  const secondRelease = vi.fn();
  Object.assign(first, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: firstRelease,
  });
  Object.assign(second, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: secondRelease,
  });
  const a = createPointerSession({ element: () => first, onEnd: firstEnd });
  const b = createPointerSession({ element: () => second, onEnd: secondEnd });
  try {
    first.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 1,
      }),
    );
    second.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 1,
      }),
    );
    first.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }),
    );
    expect(firstEnd).toHaveBeenCalledTimes(1);
    expect(secondEnd).not.toHaveBeenCalled();
    b.dispose();
    expect(secondRelease).toHaveBeenCalledWith(1);
    expect(secondEnd.mock.calls[0]![1]).toBe("dispose");
    expect(firstRelease).toHaveBeenCalledWith(1);
  } finally {
    a.dispose();
    b.dispose();
    first.remove();
    frame.remove();
  }
});

test("nested sessions lease a pointer to the first native capture owner", () => {
  const parent = document.createElement("div");
  const child = document.createElement("div");
  parent.append(child);
  const parentCapture = vi.fn();
  const childCapture = vi.fn();
  Object.assign(parent, { setPointerCapture: parentCapture });
  Object.assign(child, { setPointerCapture: childCapture });
  const parentSession = createPointerSession({ element: () => parent });
  const childSession = createPointerSession({ element: () => child });
  try {
    child.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 12,
      }),
    );
    expect(childCapture).toHaveBeenCalledWith(12);
    expect(parentCapture).not.toHaveBeenCalled();
    expect(childSession.active).toBe(true);
    expect(parentSession.active).toBe(false);
  } finally {
    parentSession.dispose();
    childSession.dispose();
  }
});

test("a real Vapor unmount releases the active pointer capture", () => {
  const handle = document.createElement("div");
  const release = vi.fn();
  Object.assign(handle, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: release,
  });
  const end = vi.fn();
  const Probe = defineVaporComponent(() => {
    createPointerSession({ element: () => handle, onEnd: end });
    return <div>pointer session</div>;
  });
  const mounted = mountVapor(Probe);
  try {
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 4,
      }),
    );
    mounted.unmount();
    expect(release).toHaveBeenCalledWith(4);
    expect(end.mock.calls[0]![1]).toBe("dispose");
  } finally {
    if (mounted.host.isConnected) mounted.unmount();
  }
});

test("disposal releases capture and listeners even when the completion callback fails", () => {
  const handle = document.createElement("div");
  const capture = vi.fn();
  const release = vi.fn();
  Object.assign(handle, {
    setPointerCapture: capture,
    releasePointerCapture: release,
  });
  const failure = new Error("completion failure");
  const session = createPointerSession({
    element: () => handle,
    onEnd: () => {
      throw failure;
    },
  });
  try {
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 3,
      }),
    );
    expect(() => session.dispose()).toThrow(failure);
    expect(release).toHaveBeenCalledWith(3);
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 4,
      }),
    );
    expect(capture).toHaveBeenCalledTimes(1);
  } finally {
    try {
      session.dispose();
    } catch {
      // This test deliberately uses a failing completion callback.
    }
  }
});

test("pointer down accepts only an uncancelled primary left-button press", () => {
  const handle = document.createElement("div");
  const capture = vi.fn();
  Object.assign(handle, { setPointerCapture: capture });
  const session = createPointerSession({ element: () => handle });
  try {
    for (const init of [
      { isPrimary: false, button: 0 },
      { isPrimary: true, button: 1 },
    ]) {
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerId: 1,
          ...init,
        }),
      );
    }
    const cancelled = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      button: 0,
      pointerId: 2,
    });
    cancelled.preventDefault();
    handle.dispatchEvent(cancelled);
    expect(capture).not.toHaveBeenCalled();
  } finally {
    session.dispose();
  }
});

test("refresh rebinds after a failing end callback and rejects stale target listeners", () => {
  const first = document.createElement("div");
  const second = document.createElement("div");
  const firstCapture = vi.fn();
  const secondCapture = vi.fn();
  Object.assign(first, {
    setPointerCapture: firstCapture,
    releasePointerCapture: vi.fn(),
  });
  Object.assign(second, {
    setPointerCapture: secondCapture,
    releasePointerCapture: vi.fn(),
  });
  let target: Element = first;
  const failure = new Error("end failure");
  const session = createPointerSession({
    element: () => target,
    onEnd: () => {
      target = second;
      throw failure;
    },
  });
  try {
    first.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 1,
      }),
    );
    expect(() => session.refresh()).toThrow(failure);
    first.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 2,
      }),
    );
    second.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 3,
      }),
    );
    expect(firstCapture).toHaveBeenCalledTimes(1);
    expect(secondCapture).toHaveBeenCalledWith(3);
  } finally {
    try {
      session.dispose();
    } catch {
      // This test deliberately uses a failing completion callback.
    }
  }
});

test("an end callback cannot restart capture while it refreshes the session", () => {
  const first = document.createElement("div");
  const second = document.createElement("div");
  const firstCapture = vi.fn();
  const secondCapture = vi.fn();
  Object.assign(first, {
    setPointerCapture: firstCapture,
    releasePointerCapture: vi.fn(),
  });
  Object.assign(second, {
    setPointerCapture: secondCapture,
    releasePointerCapture: vi.fn(),
  });
  let target: Element = first;
  let session!: ReturnType<typeof createPointerSession>;
  session = createPointerSession({
    element: () => target,
    onEnd: () => {
      target = second;
      session.refresh();
      first.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          isPrimary: true,
          button: 0,
          pointerId: 2,
        }),
      );
    },
  });
  try {
    first.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 1,
      }),
    );
    first.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }),
    );
    second.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        isPrimary: true,
        button: 0,
        pointerId: 3,
      }),
    );
    expect(firstCapture).toHaveBeenCalledTimes(1);
    expect(secondCapture).toHaveBeenCalledWith(3);
  } finally {
    session.dispose();
  }
});

test("drag and resize geometry clamp in viewport CSS pixels", () => {
  expect(
    clampDragOffset(
      { x: 4, y: -3 },
      { x: 20, y: 5 },
      { left: -5, top: -5, right: 15, bottom: 10 },
    ),
  ).toEqual({ x: 15, y: 2 });
  expect(
    resizeRect(
      { x: 10, y: 10, width: 40, height: 30 },
      { x: 0, y: 0 },
      { x: -30, y: 50 },
      ["left", "bottom"],
      {
        minWidth: 20,
        minHeight: 20,
        bounds: { left: 0, top: 0, right: 80, bottom: 80 },
      },
    ),
  ).toEqual({ x: 0, y: 10, width: 50, height: 70 });
  expect(
    resizeRect(
      { x: 10, y: 10, width: 40, height: 30 },
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      ["right", "bottom"],
      { maxWidth: 45, maxHeight: 35 },
    ),
  ).toEqual({ x: 10, y: 10, width: 45, height: 35 });
});

test("geometry rejects non-finite values and contradictory constraints", () => {
  expect(() => clampDragOffset({ x: NaN, y: 0 }, { x: 0, y: 0 })).toThrow(
    /finite/,
  );
  expect(() =>
    clampDragOffset(
      { x: Number.MAX_VALUE, y: 0 },
      { x: Number.MAX_VALUE, y: 0 },
    ),
  ).toThrow(/finite/);
  expect(() =>
    resizeRect(
      { x: Number.MAX_VALUE, y: 0, width: Number.MAX_VALUE, height: 1 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      ["right"],
    ),
  ).toThrow(/finite/);
  expect(() =>
    resizeRect(
      { x: 0, y: 0, width: Number.MAX_VALUE, height: 1 },
      { x: 0, y: 0 },
      { x: Number.MAX_VALUE, y: 0 },
      ["right"],
    ),
  ).toThrow(/result.width/);
  expect(() =>
    resizeRect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      ["right"],
      { bounds: { left: 2, top: 0, right: 1, bottom: 10 } },
    ),
  ).toThrow(/inverted/);
  expect(() =>
    resizeRect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      ["right"],
      { minWidth: 11, bounds: { left: 0, top: 0, right: 10, bottom: 10 } },
    ),
  ).toThrow(/fit within bounds/);
  expect(() =>
    resizeRect(
      { x: 50, y: 0, width: 10, height: 10 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      ["right"],
      {
        minWidth: 80,
        bounds: { left: 0, top: 0, right: 100, bottom: 100 },
      },
    ),
  ).toThrow(/selected edge anchor/);
  expect(() =>
    resizeRect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      ["left", "right"],
      { bounds: { left: 0, top: 0, right: 100, bottom: 100 } },
    ),
  ).toThrow(/must not oppose/);
  expect(() =>
    resizeRect(
      { x: -1, y: 0, width: 10, height: 10 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      ["right"],
      { bounds: { left: 0, top: 0, right: 100, bottom: 100 } },
    ),
  ).toThrow(/Initial resize rectangle/);
  expect(() =>
    resizeRect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: -Number.MAX_VALUE, y: 0 },
      { x: Number.MAX_VALUE, y: 0 },
      ["right"],
    ),
  ).toThrow(/finite/);
  expect(() =>
    resizeRect(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      ["diagonal" as never],
    ),
  ).toThrow(/Unknown/);
});
