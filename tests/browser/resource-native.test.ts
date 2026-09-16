import { expect, test } from "vitest";
import { installResourceTracker } from "../support/resource-tracker";

test("tracked timeouts preserve native callback receiver and arguments", async () => {
  const tracker = installResourceTracker(window, document);
  try {
    const result = await new Promise<{ receiver: unknown; argument: string }>(
      (resolve) => {
        window.setTimeout(
          function (this: Window, argument: string) {
            resolve({ receiver: this, argument });
          },
          0,
          "payload",
        );
      },
    );
    expect(result.receiver).toBe(window);
    expect(result.argument).toBe("payload");
    tracker.assertClean();
  } finally {
    tracker.restore();
  }
});

test("a rejected native listener registration creates no tracked resource", () => {
  const tracker = installResourceTracker(window, document);
  try {
    expect(() =>
      // @ts-expect-error exercise native runtime validation
      window.addEventListener("probe", () => {}, {
        signal: {},
      }),
    ).toThrow();
    // @ts-expect-error native listener validation must remain observable
    expect(() => window.addEventListener("probe", 42)).toThrow();
    tracker.assertClean();
  } finally {
    tracker.restore();
  }
});

test("tracked animation frames preserve the native callback receiver", async () => {
  const nativeReceiver = await new Promise<unknown>((resolve) => {
    requestAnimationFrame(function (this: unknown) {
      resolve(this);
    });
  });
  const tracker = installResourceTracker(window, document);
  try {
    const trackedReceiver = await new Promise<unknown>((resolve) => {
      requestAnimationFrame(function (this: unknown) {
        resolve(this);
      });
    });
    expect(trackedReceiver).toBe(nativeReceiver);
    tracker.assertClean();
  } finally {
    tracker.restore();
  }
});

test("object listeners preserve native behavior when handleEvent is added later", () => {
  function exercise() {
    const listener = {};
    const errors: string[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.message);
    window.addEventListener("error", onError);
    let calls = 0;
    try {
      // @ts-expect-error exercise the browser's accepted untyped object listener
      window.addEventListener("object-probe", listener);
      window.dispatchEvent(new Event("object-probe"));
      Object.assign(listener, { handleEvent: () => calls++ });
      window.dispatchEvent(new Event("object-probe"));
      return { errors, calls };
    } finally {
      // @ts-expect-error the same untyped object removes its native registration
      window.removeEventListener("object-probe", listener);
      window.removeEventListener("error", onError);
    }
  }
  const native = exercise();
  expect(native).toEqual({ errors: [], calls: 1 });
  const tracker = installResourceTracker(window, document);
  try {
    expect(exercise()).toEqual(native);
    tracker.assertClean();
  } finally {
    tracker.restore();
  }
});
