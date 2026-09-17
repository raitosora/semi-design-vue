import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { useFoundation } from "../../packages/semi-ui-vue/src/composables/use-foundation";
import { createFoundationScope } from "../../packages/semi-ui-vue/src/composables/foundation-scope";
import { mountVapor } from "../support/mount-vapor";
import { installResourceTracker } from "../support/resource-tracker";

test("state commits synchronously without mutating consumer data; callbacks see updated DOM", async () => {
  const initial = Object.freeze({
    count: 0 as number,
    data: Object.freeze(["original"]),
  });
  const errors = vi.fn();
  const calls: string[] = [];
  let bridge!: ReturnType<
    typeof useFoundation<
      { value?: number },
      typeof initial,
      { init(): void; destroy(): void }
    >
  >;
  const mounted = mountVapor(
    defineVaporComponent(() => {
      bridge = useFoundation({
        props: () => ({}),
        initialState: initial,
        onError: errors,
        create: () => ({
          init: () => calls.push("init"),
          destroy: () => calls.push("destroy"),
        }),
      });
      return <output>{bridge.state.value.count}</output>;
    }),
  );
  try {
    expect(calls).toEqual(["init"]);
    expect("dispose" in bridge.scope).toBe(false);
    const previous = bridge.adapter.getStates();
    bridge.adapter.setState({ count: 1 }, () =>
      calls.push(`dom:${mounted.host.textContent}`),
    );
    expect(bridge.adapter.getState("count")).toBe(1);
    expect(previous.count).toBe(0);
    expect(initial.count).toBe(0);
    expect(bridge.state.value.data).toBe(initial.data);
    expect(mounted.host.textContent).toBe("0");
    bridge.adapter.setState({ count: 2 }, () => calls.push("second"));
    await nextTick();
    expect(calls).toEqual(["init", "dom:2", "second"]);
    bridge.adapter.setState({ count: 3 }, () => calls.push("stale"));
  } finally {
    mounted.unmount();
  }
  await nextTick();
  bridge.dispose();
  bridge.adapter.setState({ count: 4 });
  expect(bridge.state.value.count).toBe(3);
  expect(calls).toEqual(["init", "dom:2", "second", "destroy"]);
  expect(errors).not.toHaveBeenCalled();
});

test("props watch preserves absence, contexts and cache remain instance local", async () => {
  const incoming = shallowRef<{ value?: number }>({});
  const changes: unknown[] = [];
  const failure = new Error("callback");
  const errors = vi.fn();
  let bridge!: ReturnType<
    typeof useFoundation<
      { value?: number },
      { count: number },
      { init(): void; destroy(): void }
    >
  >;
  const mounted = mountVapor(
    defineVaporComponent(() => {
      bridge = useFoundation({
        props: () => incoming.value,
        initialState: { count: 0 },
        contexts: () => ({ locale: "zh-CN" }),
        onError: errors,
        create: () => ({ init() {}, destroy() {} }),
        watchProps: (next, previous) =>
          changes.push([
            Object.hasOwn(previous, "value"),
            Object.hasOwn(next, "value"),
          ]),
      });
      return <output>{String(bridge.adapter.getProp("value"))}</output>;
    }),
  );
  try {
    expect(Object.hasOwn(bridge.adapter.getProps(), "value")).toBe(false);
    expect(bridge.adapter.getContext("locale")).toBe("zh-CN");
    expect(bridge.adapter.getContexts()).toEqual({ locale: "zh-CN" });
    const first = bridge.scope.task();
    incoming.value = { value: undefined };
    await nextTick();
    expect(changes).toEqual([[false, true]]);
    expect(first.isCurrent()).toBe(false);
    expect(bridge.adapter.getProps()).toEqual({ value: undefined });
    bridge.adapter.setCache("__proto__", 1);
    const cache = bridge.adapter.getCaches();
    bridge.adapter.setCache("value", 2);
    expect(bridge.adapter.getCache("__proto__")).toBe(1);
    expect(Object.hasOwn(cache, "value")).toBe(false);
    bridge.adapter.setState({ count: 1 }, () => {
      throw failure;
    });
    await nextTick();
    await Promise.resolve();
    expect(errors).toHaveBeenCalledWith(failure);
  } finally {
    mounted.unmount();
  }
  expect(bridge.adapter.getCaches()).toEqual({});
  bridge.adapter.setCache("late", 3);
  expect(bridge.adapter.getCache("late")).toBeUndefined();
});

test("scoped resources cancel timers, frames, observers and listeners on real Vapor unmount", async () => {
  let pulses = 0;
  const app = createVaporApp(
    defineVaporComponent(() => {
      useFoundation({
        props: () => ({}),
        initialState: {},
        onError: (error) => {
          throw error;
        },
        create: (_adapter, scope) => ({
          init() {
            scope.timeout(() => {
              pulses++;
            }, 10000);
            scope.interval(() => {
              pulses++;
            }, 10000);
            scope.frame(() => {
              pulses++;
            });
            const observer = new ResizeObserver(
              scope.guard(() => {
                pulses++;
              }),
            );
            observer.observe(document.body);
            scope.own(() => observer.disconnect());
            const listener = scope.guard(() => {
              pulses++;
            });
            window.addEventListener("resize", listener);
            scope.own(() => window.removeEventListener("resize", listener));
          },
          destroy() {},
        }),
      });
      return <span>resources</span>;
    }),
  );
  const tracker = installResourceTracker(window, document);
  const host = document.createElement("div");
  document.body.append(host);
  try {
    app.mount(host);
    app.unmount();
    window.dispatchEvent(new Event("resize"));
    expect(pulses).toBe(0);
    tracker.assertClean();
  } finally {
    tracker.restore();
    host.remove();
  }
  await nextTick();
});

test("tasks reject stale results, direct decisions preserve return/throw/Promise identity", async () => {
  const scope = createFoundationScope();
  const first = scope.task();
  const second = scope.task();
  const effect = vi.fn();
  expect(first.commit(effect)).toBe(false);
  expect(second.commit(effect)).toBe(true);
  const promise = Promise.resolve(false);
  expect(scope.decide(() => promise)).toBe(promise);
  expect(scope.decide(() => false)).toBe(false);
  const error = new Error("decision");
  expect(() =>
    scope.decide(() => {
      throw error;
    }),
  ).toThrow(error);
  const rejected = Promise.reject(error);
  expect(scope.decide(() => rejected)).toBe(rejected);
  await expect(rejected).rejects.toBe(error);
  scope.notify(effect, 42);
  scope.invalidate();
  expect(second.isCurrent()).toBe(false);
  const guarded = scope.guard(effect);
  guarded(1);
  scope.dispose();
  guarded(2);
  scope.notify(effect, 3);
  expect(scope.decide(() => false)).toBeUndefined();
  expect(effect.mock.calls).toEqual([[], [42], [1]]);
});

test("scope supports completion, early release, late registration, and exhaustive failing cleanup", async () => {
  const scope = createFoundationScope();
  const released = vi.fn();
  const cancel = scope.own(released);
  cancel();
  cancel();
  expect(released).toHaveBeenCalledTimes(1);
  await new Promise<void>((resolve) => scope.timeout(resolve, 0));
  await new Promise<void>((resolve) => scope.frame(() => resolve()));
  const pulse = vi.fn();
  const stop = scope.interval(pulse, 1);
  await new Promise<void>((resolve) => scope.timeout(resolve, 25));
  stop();
  expect(pulse).toHaveBeenCalled();
  scope.own(released);
  const failure = new Error("cleanup");
  scope.own(() => {
    throw failure;
  });
  expect(() => scope.dispose()).toThrow(AggregateError);
  expect(released).toHaveBeenCalledTimes(2);
  scope.dispose();
  scope.own(released)();
  scope.timeout(pulse, 0)();
  scope.interval(pulse, 0)();
  scope.frame(pulse)();
  expect(released).toHaveBeenCalledTimes(3);
});

test("init and destroy failures cannot keep resources or deferred work alive", () => {
  const errors: unknown[] = [];
  const cleaned = vi.fn();
  const destroyed = vi.fn(() => {
    throw new Error("destroy");
  });
  const mounted = mountVapor(
    defineVaporComponent(() => {
      const bridge = useFoundation({
        props: () => ({}),
        initialState: {},
        onError: (error) => errors.push(error),
        create: (_adapter, scope) => ({
          init() {
            scope.own(cleaned);
            scope.own(() => {
              throw new Error("release");
            });
            throw new Error("init");
          },
          destroy: destroyed,
        }),
      });
      return <output>{String(bridge.scope.active)}</output>;
    }),
  );
  mounted.unmount();
  expect(cleaned).toHaveBeenCalledTimes(1);
  expect(destroyed).toHaveBeenCalledTimes(1);
  expect(errors).toHaveLength(2);
  expect(errors[0]).toBeInstanceOf(AggregateError);
  expect(errors[1]).toEqual(new Error("init"));
});

test("construction failure releases resources and early disposal prevents init", () => {
  const clean = vi.fn();
  const init = vi.fn();
  const destroy = vi.fn();
  const captured: unknown[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => {
      for (const failCleanup of [false, true]) {
        try {
          useFoundation({
            props: () => ({}),
            initialState: {},
            onError: vi.fn(),
            create: (_adapter, scope) => {
              scope.own(clean);
              if (failCleanup)
                scope.own(() => {
                  throw new Error("cleanup");
                });
              throw new Error("create");
            },
          });
        } catch (error) {
          captured.push(error);
        }
      }
      const bridge = useFoundation({
        props: () => ({}),
        initialState: {},
        onError: vi.fn(),
        create: () => ({ init, destroy }),
      });
      expect(bridge.adapter.getContexts()).toEqual({});
      const event = new Event("change", { bubbles: true });
      bridge.adapter.persistEvent(event);
      bridge.adapter.stopPropagation(event);
      expect(event.cancelBubble).toBe(true);
      bridge.dispose();
      return <output>early</output>;
    }),
  );
  mounted.unmount();
  expect(captured[0]).toEqual(new Error("create"));
  expect(captured[1]).toBeInstanceOf(AggregateError);
  expect(clean).toHaveBeenCalledTimes(2);
  expect(init).not.toHaveBeenCalled();
  expect(destroy).not.toHaveBeenCalled();
});

test("props watch errors are reported, and instances have independent caches", async () => {
  const props = shallowRef({ value: 0 });
  const errors = vi.fn();
  const failure = new Error("watch");
  const mounted = mountVapor(
    defineVaporComponent(() => {
      const options = {
        props: () => props.value,
        initialState: {},
        onError: errors,
        create: () => ({ init() {}, destroy() {} }),
      };
      const a = useFoundation({
        ...options,
        watchProps: () => {
          throw failure;
        },
      });
      const b = useFoundation(options);
      a.adapter.setCache("key", 1);
      expect(b.adapter.getCache("key")).toBeUndefined();
      return <span>watch</span>;
    }),
  );
  try {
    props.value = { value: 1 };
    await nextTick();
    expect(errors).toHaveBeenCalledWith(failure);
  } finally {
    mounted.unmount();
  }
});

test("out-of-order async work and post-unmount results cannot replace current state", async () => {
  let bridge!: ReturnType<
    typeof useFoundation<
      {},
      { value: string },
      { init(): void; destroy(): void }
    >
  >;
  const mounted = mountVapor(
    defineVaporComponent(() => {
      bridge = useFoundation({
        props: () => ({}),
        initialState: { value: "initial" },
        create: () => ({ init() {}, destroy() {} }),
        onError: (error) => {
          throw error;
        },
      });
      return <output>{bridge.state.value.value}</output>;
    }),
  );
  let resolveOld!: (value: string) => void;
  let resolveNew!: (value: string) => void;
  const run = (promise: Promise<string>) => {
    const task = bridge.scope.task();
    return promise.then((value) =>
      task.commit(() => bridge.adapter.setState({ value })),
    );
  };
  let unmounted = false;
  try {
    const old = run(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    const recent = run(
      new Promise((resolve) => {
        resolveNew = resolve;
      }),
    );
    resolveNew("new");
    expect(await recent).toBe(true);
    resolveOld("old");
    expect(await old).toBe(false);
    await nextTick();
    expect(mounted.host.textContent).toBe("new");
    const late = run(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    mounted.unmount();
    unmounted = true;
    resolveOld("late");
    expect(await late).toBe(false);
    expect(bridge.state.value.value).toBe("new");
  } finally {
    if (!unmounted) mounted.unmount();
  }
});

test("replacement snapshots keep mutable nested caller values and Refs intact", () => {
  const nested = { value: 1 };
  const array = [1, 2];
  const value = shallowRef(2);
  const mounted = mountVapor(
    defineVaporComponent(() => {
      const bridge = useFoundation({
        props: () => ({}),
        initialState: { nested, array, value },
        create: () => ({ init() {}, destroy() {} }),
        onError: (error) => {
          throw error;
        },
      });
      const prior = bridge.state.value;
      const patch = { nested: { value: 3 }, array: [4], value: shallowRef(5) };
      bridge.adapter.setState(patch);
      expect(prior).toEqual({ nested, array, value });
      expect(bridge.state.value).not.toBe(patch);
      expect(bridge.state.value.nested).toBe(patch.nested);
      expect(nested.value).toBe(1);
      expect(array).toEqual([1, 2]);
      expect(value.value).toBe(2);
      expect(Object.isFrozen(nested)).toBe(false);
      expect(Object.isFrozen(patch.nested)).toBe(false);
      return <span>immutable commit</span>;
    }),
  );
  mounted.unmount();
});

test("a prop update invalidates an already queued asynchronous completion before post flush", async () => {
  const props = shallowRef({ value: 0 });
  let bridge!: ReturnType<
    typeof useFoundation<
      { value: number },
      {},
      { init(): void; destroy(): void }
    >
  >;
  const mounted = mountVapor(
    defineVaporComponent(() => {
      bridge = useFoundation({
        props: () => props.value,
        initialState: {},
        create: () => ({ init() {}, destroy() {} }),
        onError: (error) => {
          throw error;
        },
      });
      return <span>async props</span>;
    }),
  );
  try {
    await nextTick();
    const task = bridge.scope.task();
    const stale = Promise.resolve().then(() => task.commit(() => {}));
    props.value = { value: 1 };
    expect(await stale).toBe(false);
  } finally {
    mounted.unmount();
  }
});

test("watch source failures report through the bridge and release owned resources", async () => {
  const props = shallowRef({ fail: false });
  const error = new Error("props getter");
  const errors = vi.fn();
  const vueErrors = vi.fn();
  const cleanup = vi.fn();
  const destroyed = vi.fn();
  const app = createVaporApp(
    defineVaporComponent(() => {
      useFoundation({
        props: () => {
          if (props.value.fail) throw error;
          return { value: 0 };
        },
        initialState: {},
        onError: errors,
        create: (_adapter, scope) => {
          scope.own(cleanup);
          return { init() {}, destroy: destroyed };
        },
      });
      return <span>error policy</span>;
    }),
  );
  app.config.errorHandler = vueErrors;
  const host = document.createElement("div");
  document.body.append(host);
  try {
    app.mount(host);
    props.value = { fail: true };
    await nextTick();
    expect(errors).toHaveBeenCalledWith(error);
    expect(vueErrors).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(destroyed).toHaveBeenCalledOnce();
  } finally {
    app.unmount();
    host.remove();
  }
});
