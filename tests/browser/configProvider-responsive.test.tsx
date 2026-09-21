import { describe, expect, it, vi } from "vitest";
import { effectScope, shallowRef, watch } from "vue";
import {
  createResponsiveObserver,
  defaultResponsiveMap,
} from "../../packages/semi-ui-vue/src/components/configProvider/responsive.js";

function fixture() {
  const records: Array<{
    query: string;
    callback?: (event: { matches: boolean }) => void;
    removed: boolean;
  }> = [];
  const matchMedia = vi.fn((query: string) => {
    const record = { query, removed: false } as (typeof records)[number];
    records.push(record);
    return {
      matches: query === defaultResponsiveMap.md,
      addEventListener: (
        _: string,
        callback: (event: { matches: boolean }) => void,
      ) => {
        record.callback = callback;
      },
      removeEventListener: () => {
        record.removed = true;
      },
    };
  });
  const view = { matchMedia } as unknown as Window;
  const options = shallowRef({
    enabled: true,
    map: defaultResponsiveMap,
    view: view as Window | undefined,
  });
  const observer = createResponsiveObserver(() => options.value);
  return { records, matchMedia, options, observer, view };
}

describe("configProvider responsive subscriptions", () => {
  it("lazily registers once and immediately supplies a frozen current snapshot", () => {
    const f = fixture();
    expect(f.matchMedia).not.toHaveBeenCalled();
    const callback = vi.fn();
    const stop = f.observer.onBreakpoint(callback);
    expect(f.matchMedia).toHaveBeenCalledTimes(6);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      xs: false,
      sm: false,
      md: true,
      lg: false,
      xl: false,
      xxl: false,
    });
    expect(Object.isFrozen(f.observer.screens.value)).toBe(true);
    const stop2 = f.observer.onBreakpoint(vi.fn());
    stop();
    stop();
    expect(f.records.some((item) => item.removed)).toBe(false);
    stop2();
    expect(f.records.every((item) => item.removed)).toBe(true);
    f.observer.dispose();
  });

  it("filters changes, suppresses duplicates and unregisters on disposal", () => {
    const f = fixture();
    const all = vi.fn();
    const selected = vi.fn();
    f.observer.onBreakpoint(all);
    f.observer.onBreakpoint(["md", "lg"], selected);
    expect(selected.mock.calls).toEqual([
      ["md", true],
      ["lg", false],
    ]);
    f.records[1]!.callback!({ matches: true });
    expect(selected).toHaveBeenCalledTimes(2);
    f.records[2]!.callback!({ matches: false });
    f.records[2]!.callback!({ matches: false });
    expect(selected).toHaveBeenCalledTimes(3);
    expect(all).toHaveBeenCalledTimes(3);
    f.observer.dispose();
    f.observer.dispose();
    f.records[2]!.callback!({ matches: true });
    f.observer.onBreakpoint(all)();
    expect(all).toHaveBeenCalledTimes(3);
    expect(f.records.every((item) => item.removed)).toBe(true);
  });

  it("preserves disabled snapshots and refreshes existing subscribers on enable or map changes", () => {
    const f = fixture();
    f.options.value = { ...f.options.value, enabled: false };
    const callback = vi.fn();
    f.observer.onBreakpoint(callback);
    expect(f.matchMedia).not.toHaveBeenCalled();
    expect(callback.mock.calls[0]![0].md).toBe(false);
    f.options.value = { ...f.options.value, enabled: true };
    expect(callback.mock.calls.at(-1)![0].md).toBe(true);
    const old = f.records[2]!;
    f.options.value = {
      ...f.options.value,
      map: { ...defaultResponsiveMap, md: "(min-width: 800px)" },
    };
    expect(old.removed).toBe(true);
    expect(callback.mock.calls.at(-1)![0].md).toBe(false);
    old.callback!({ matches: true });
    expect(f.observer.screens.value.md).toBe(false);
    f.options.value = { ...f.options.value, enabled: false };
    expect(f.records.every((item) => item.removed)).toBe(true);
    f.records.at(-1)!.callback!({ matches: true });
    expect(f.observer.screens.value.xxl).toBe(false);
    f.observer.dispose();
  });

  it("supports absent media APIs and scope disposal", () => {
    const scope = effectScope();
    const observer = scope.run(() =>
      createResponsiveObserver(() => ({
        enabled: true,
        map: defaultResponsiveMap,
      })),
    )!;
    const callback = vi.fn();
    observer.onBreakpoint(callback);
    expect(callback.mock.calls[0]![0].md).toBe(false);
    scope.stop();
    observer.onBreakpoint(callback)();
    expect(callback).toHaveBeenCalledTimes(1);
    const missing = createResponsiveObserver(() => ({
      enabled: true,
      map: defaultResponsiveMap,
      view: {} as Window,
    }));
    expect(() => missing.onBreakpoint(vi.fn())()).not.toThrow();
    missing.dispose();
  });

  it("rebinds to a foreign browsing context without sharing app subscriptions", () => {
    const a = fixture();
    const b = fixture();
    const callback = vi.fn();
    a.observer.onBreakpoint(callback);
    b.observer.onBreakpoint(vi.fn());
    a.options.value = { ...a.options.value, view: b.view };
    expect(a.records.every((item) => item.removed)).toBe(true);
    expect(b.records).toHaveLength(12);
    a.observer.dispose();
    expect(b.records.slice(0, 6).every((item) => !item.removed)).toBe(true);
    expect(b.records.slice(6).every((item) => item.removed)).toBe(true);
    b.observer.dispose();
  });

  it("rolls back an initial throwing subscriber and continues notifying others after errors", () => {
    const f = fixture();
    expect(() =>
      f.observer.onBreakpoint(() => {
        throw new Error("initial");
      }),
    ).toThrow("initial");
    expect(f.records.every((item) => item.removed)).toBe(true);
    let fail = false;
    f.observer.onBreakpoint(() => {
      if (fail) throw new Error("later");
    });
    const callback = vi.fn();
    f.observer.onBreakpoint(callback);
    fail = true;
    expect(() => f.records[6]!.callback!({ matches: true })).toThrow();
    expect(callback).toHaveBeenCalledTimes(2);
    f.observer.dispose();
    expect(f.records.every((item) => item.removed)).toBe(true);
  });

  it("handles reentrant disposal and unsubscribe without stale callbacks", () => {
    const f = fixture();
    let dispose = false;
    f.observer.onBreakpoint(() => {
      if (dispose) f.observer.dispose();
    });
    const callback = vi.fn();
    f.observer.onBreakpoint(callback);
    dispose = true;
    f.records[0]!.callback!({ matches: true });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(f.records.every((item) => item.removed)).toBe(true);
  });

  it("resubscribes with a fresh snapshot and copies breakpoint filters", () => {
    const f = fixture();
    const keys: Array<"md" | "lg"> = ["md"];
    const callback = vi.fn();
    const stop = f.observer.onBreakpoint(keys, callback);
    keys.push("lg");
    f.records[3]!.callback!({ matches: true });
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
    f.observer.onBreakpoint(callback);
    expect(f.records).toHaveLength(12);
    expect(f.observer.screens.value.lg).toBe(false);
    f.observer.dispose();
  });

  it("stops a filtered initial delivery when a callback disables observing", () => {
    const f = fixture();
    const callback = vi.fn(() => {
      f.options.value = { ...f.options.value, enabled: false };
    });
    f.observer.onBreakpoint(["md", "lg"], callback);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(f.records.every((item) => item.removed)).toBe(true);
    f.observer.dispose();
  });

  it("completes a disabled filtered snapshot when its callback adds a subscription", () => {
    const f = fixture();
    f.options.value = { ...f.options.value, enabled: false };
    const seen: Array<[string, boolean]> = [];
    let nested = false;
    try {
      f.observer.onBreakpoint(["md", "lg"], (key, value) => {
        seen.push([key, value]);
        if (!nested) {
          nested = true;
          f.observer.onBreakpoint(() => {});
        }
      });
      expect(seen).toEqual([
        ["md", false],
        ["lg", false],
      ]);
      expect(f.matchMedia).not.toHaveBeenCalled();
    } finally {
      f.observer.dispose();
    }
  });

  for (const trigger of ["media event", "map replacement"] as const) {
    it(`does not repeat notification after a screens watcher reconfigures a ${trigger}`, () => {
      const f = fixture();
      const seen: boolean[] = [];
      f.observer.onBreakpoint((screens) => seen.push(screens.md));
      let changed = false;
      const stop = watch(
        f.observer.screens,
        (screens) => {
          if (!screens.md && !changed) {
            changed = true;
            f.options.value = {
              ...f.options.value,
              map: { ...defaultResponsiveMap },
            };
          }
        },
        { flush: "sync" },
      );
      try {
        if (trigger === "media event")
          f.records[2]!.callback!({ matches: false });
        else
          f.options.value = {
            ...f.options.value,
            map: { ...defaultResponsiveMap, md: "not all" },
          };
        expect(seen).toEqual([true, true]);
        expect(f.observer.screens.value.md).toBe(true);
        expect(f.records.slice(0, -6).every((record) => record.removed)).toBe(
          true,
        );
      } finally {
        stop();
        f.observer.dispose();
      }
    });
  }

  for (const filtered of [false, true]) {
    it(`delivers one settled initial snapshot when a synchronous watcher changes the map (filtered=${filtered})`, () => {
      const f = fixture();
      const seen: Array<[string, boolean]> = [];
      const stop = watch(
        f.observer.screens,
        (screens) => {
          if (screens.md)
            f.options.value = {
              ...f.options.value,
              map: { ...defaultResponsiveMap, md: "not all" },
            };
        },
        { flush: "sync" },
      );
      try {
        if (filtered)
          f.observer.onBreakpoint(["md", "lg"], (key, value) =>
            seen.push([key, value]),
          );
        else
          f.observer.onBreakpoint((screens) => seen.push(["all", screens.md]));
        expect(seen).toEqual(
          filtered
            ? [
                ["md", false],
                ["lg", false],
              ]
            : [["all", false]],
        );
        expect(f.records.slice(0, 6).every((record) => record.removed)).toBe(
          true,
        );
      } finally {
        stop();
        f.observer.dispose();
      }
    });
  }

  it("stops a disabled initial snapshot when its callback enables observation", () => {
    const f = fixture();
    f.options.value = { ...f.options.value, enabled: false };
    const seen: Array<[string, boolean]> = [];
    try {
      f.observer.onBreakpoint(["md", "lg"], (key, value) => {
        seen.push([key, value]);
        if (!f.options.value.enabled)
          f.options.value = { ...f.options.value, enabled: true };
      });
      expect(seen).toEqual([
        ["md", false],
        ["md", true],
        ["lg", false],
      ]);
    } finally {
      f.observer.dispose();
    }
  });

  for (const trigger of ["media event", "map replacement"] as const) {
    it(`does not notify after a screens watcher disables a ${trigger}`, () => {
      const f = fixture();
      const callback = vi.fn();
      f.observer.onBreakpoint(callback);
      const stop = watch(
        f.observer.screens,
        (screens) => {
          if (!screens.md)
            f.options.value = { ...f.options.value, enabled: false };
        },
        { flush: "sync" },
      );
      try {
        if (trigger === "media event")
          f.records[2]!.callback!({ matches: false });
        else
          f.options.value = {
            ...f.options.value,
            map: { ...defaultResponsiveMap, md: "not all" },
          };
        expect(callback).toHaveBeenCalledTimes(1);
        expect(f.observer.screens.value.md).toBe(false);
        expect(f.records.every((record) => record.removed)).toBe(true);
      } finally {
        stop();
        f.observer.dispose();
      }
    });
  }

  it("rolls back listeners if media registration fails halfway", () => {
    const remove = vi.fn();
    const matchMedia = vi.fn((query: string) => ({
      matches: false,
      addEventListener() {
        if (query === defaultResponsiveMap.md) throw new Error("media failed");
      },
      removeEventListener: remove,
    }));
    const observer = createResponsiveObserver(() => ({
      enabled: true,
      map: defaultResponsiveMap,
      view: { matchMedia } as unknown as Window,
    }));
    expect(() => observer.onBreakpoint(vi.fn())).toThrow("media failed");
    expect(remove).toHaveBeenCalledTimes(2);
    observer.dispose();
  });

  it("uses the supplied iframe viewport for real media changes", async () => {
    const frame = document.createElement("iframe");
    frame.style.width = "400px";
    document.body.append(frame);
    const observer = createResponsiveObserver(() => ({
      enabled: true,
      map: defaultResponsiveMap,
      view: frame.contentWindow ?? undefined,
    }));
    const callback = vi.fn();
    try {
      observer.onBreakpoint(callback);
      expect(observer.screens.value.md).toBe(false);
      expect(observer.screens.value.xs).toBe(true);
      frame.style.width = "900px";
      await vi.waitFor(() => expect(observer.screens.value.md).toBe(true));
      expect(callback.mock.calls.at(-1)![0].md).toBe(true);
      observer.dispose();
      const calls = callback.mock.calls.length;
      frame.style.width = "400px";
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      expect(callback).toHaveBeenCalledTimes(calls);
    } finally {
      observer.dispose();
      frame.remove();
    }
  });
});
