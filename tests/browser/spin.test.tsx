import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Spin from "../../packages/semi-ui-vue/src/components/spin/index.js";
import type { SpinProps } from "../../packages/semi-ui-vue/src/components/spin/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

test("Spin preserves upstream defaults and only delays a false-to-true transition", async () => {
  expect(Spin.__SemiComponentName__).toBe("Spin");
  const input = shallowRef<SpinProps>({ delay: 20 });
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin {...input.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-spin")!;
    expect(root.classList.contains("semi-spin-middle")).toBe(true);
    expect(root.classList.contains("semi-spin-hidden")).toBe(false);

    input.value = { spinning: false, delay: 20 };
    await nextTick();
    expect(root.classList.contains("semi-spin-hidden")).toBe(true);

    input.value = { spinning: true, delay: 20 };
    await nextTick();
    expect(root.classList.contains("semi-spin-hidden")).toBe(true);
    await sleep(35);
    expect(root.classList.contains("semi-spin-hidden")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Spin cancels stale delayed work across updates and unmount", async () => {
  const input = shallowRef<SpinProps>({ spinning: false, delay: 30 });
  const mounted = shallowRef(true);
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin {...input.value} v-if={mounted.value} />),
  );
  try {
    input.value = { spinning: true, delay: 30 };
    await nextTick();
    expect(fixture.host.querySelector(".semi-spin-hidden")).not.toBeNull();

    input.value = { spinning: false, delay: 30 };
    await nextTick();
    await sleep(40);
    expect(fixture.host.querySelector(".semi-spin-hidden")).not.toBeNull();

    input.value = { spinning: true, delay: 30 };
    await nextTick();
    mounted.value = false;
    await nextTick();
    await sleep(40);
    expect(fixture.host.querySelector(".semi-spin")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Spin keeps native slot content, text fallback, style, and permitted root attributes reactive", async () => {
  const input = shallowRef<SpinProps>({
    childStyle: { color: "red" },
    tip: "text fallback",
    wrapperClassName: "external",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Spin
        {...input.value}
        aria-label="loading"
        class="native"
        data-probe="spin"
        role="status"
        v-slots={{
          default: () => <p>content</p>,
          indicator: () => <i>indicator</i>,
        }}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector(".semi-spin")!;
    expect(root.classList.contains("native")).toBe(true);
    expect(root.classList.contains("external")).toBe(true);
    expect(root.getAttribute("role")).toBe("status");
    expect(root.getAttribute("aria-label")).toBe("loading");
    expect(root.getAttribute("data-probe")).toBe("spin");
    expect(root.classList.contains("semi-spin-block")).toBe(true);
    expect(root.querySelector("i")!.textContent).toBe("indicator");
    expect(root.querySelector("[x-semi-prop=indicator]")).not.toBeNull();
    expect(root.querySelector("[x-semi-prop=tip]")!.textContent).toBe(
      "text fallback",
    );
    expect(
      (root.querySelector(".semi-spin-children") as HTMLElement).style.color,
    ).toBe("red");

    input.value = { tip: 0, childStyle: { color: "blue" } };
    await nextTick();
    expect(root.querySelector("[x-semi-prop=tip]")).toBeNull();
    expect(
      (root.querySelector(".semi-spin-children") as HTMLElement).style.color,
    ).toBe("blue");
  } finally {
    fixture.unmount();
  }
});

test("Spin captures global defaults and explicit undefined restores that capture", async () => {
  const { semiGlobal } =
    await import("../../packages/semi-ui-vue/src/context/index.js");
  semiGlobal.configure({
    overrideDefaultProps: {
      Spin: {
        size: "large",
        spinning: false,
        style: { backgroundColor: "yellow", color: "red" },
      },
    },
  });
  const input = shallowRef<SpinProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin {...input.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-spin")!;
    expect(root.classList.contains("semi-spin-large")).toBe(true);
    expect(root.classList.contains("semi-spin-hidden")).toBe(true);
    expect((root as HTMLElement).style.color).toBe("red");
    expect((root as HTMLElement).style.backgroundColor).toBe("yellow");
    input.value = { style: { color: "green" } };
    await nextTick();
    expect((root as HTMLElement).style.color).toBe("green");
    expect((root as HTMLElement).style.backgroundColor).toBe("");
    input.value = { size: undefined, spinning: undefined };
    await nextTick();
    expect(root.classList.contains("semi-spin-large")).toBe(true);
    expect(root.classList.contains("semi-spin-hidden")).toBe(true);
    expect((root as HTMLElement).style.backgroundColor).toBe("yellow");
    input.value = { style: null };
    await nextTick();
    expect((root as HTMLElement).style.cssText).toBe("");
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("Spin invalidates a cancelled timer even if an obsolete callback fires", async () => {
  const callbacks: Array<() => void> = [];
  const timerIds: number[] = [];
  const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((
    callback: () => void,
  ) => {
    callbacks.push(callback);
    const id = 100 + callbacks.length;
    timerIds.push(id);
    return id;
  }) as typeof setTimeout);
  const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
  const input = shallowRef<SpinProps>({ spinning: false, delay: 1 });
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin {...input.value} />),
  );
  try {
    const baseline = callbacks.length;
    input.value = { spinning: true, delay: 1 };
    await nextTick();
    expect(callbacks).toHaveLength(baseline + 1);
    expect(fixture.host.querySelector(".semi-spin-hidden")).not.toBeNull();

    input.value = { spinning: true, delay: 2 };
    await nextTick();
    expect(callbacks).toHaveLength(baseline + 2);
    callbacks[baseline]!();
    await nextTick();
    input.value = { spinning: false, delay: 2 };
    await nextTick();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerIds[baseline + 1]);
    expect(fixture.host.querySelector(".semi-spin-hidden")).not.toBeNull();
  } finally {
    fixture.unmount();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  }
});

test("Spin restarts only a pending delay when delay changes and handles same-tick reversal", async () => {
  const input = shallowRef<SpinProps>({ spinning: false, delay: 30 });
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin {...input.value} />),
  );
  try {
    input.value = { spinning: true, delay: 30 };
    await nextTick();
    await sleep(10);
    input.value = { spinning: true, delay: 50, wrapperClassName: "updated" };
    await nextTick();
    await sleep(35);
    expect(fixture.host.querySelector(".semi-spin-hidden")).not.toBeNull();
    await sleep(25);
    expect(fixture.host.querySelector(".semi-spin-hidden")).toBeNull();

    input.value = { spinning: false, delay: 30 };
    input.value = { spinning: true, delay: 30 };
    input.value = { spinning: false, delay: 30 };
    await nextTick();
    await sleep(40);
    expect(fixture.host.querySelector(".semi-spin-hidden")).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Spin default indicators isolate fixed-upstream gradient IDs across apps", () => {
  const firstTarget = document.createElement("div");
  const secondTarget = document.createElement("div");
  document.body.append(firstTarget, secondTarget);
  const first = createVaporApp(defineVaporComponent(() => <Spin />));
  const second = createVaporApp(defineVaporComponent(() => <Spin />));
  let firstMounted = false;
  let secondMounted = false;
  try {
    first.mount(firstTarget);
    firstMounted = true;
    second.mount(secondTarget);
    secondMounted = true;
    const firstId = firstTarget.querySelector("linearGradient")!.id;
    const secondId = secondTarget.querySelector("linearGradient")!.id;
    expect(firstId).not.toBe(secondId);
    expect(firstTarget.querySelector("path")!.getAttribute("stroke")).toBe(
      `url(#${firstId})`,
    );
    expect(secondTarget.querySelector("svg")!.getAttribute("aria-hidden")).toBe(
      "true",
    );
  } finally {
    if (firstMounted) first.unmount();
    if (secondMounted) second.unmount();
    firstTarget.remove();
    secondTarget.remove();
  }
});

test("Spin keeps effective undefined global defaults through delayed transitions", async () => {
  const { semiGlobal } =
    await import("../../packages/semi-ui-vue/src/context/index.js");
  semiGlobal.configure({
    overrideDefaultProps: { Spin: { spinning: undefined, delay: 15 } },
  });
  const input = shallowRef<SpinProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin {...input.value} />),
  );
  const hidden = () => !!fixture.host.querySelector(".semi-spin-hidden");
  try {
    expect(hidden()).toBe(false);
    await sleep(30);
    expect(hidden()).toBe(true);
    input.value = { spinning: true };
    await nextTick();
    expect(hidden()).toBe(true);
    await sleep(30);
    expect(hidden()).toBe(false);
    input.value = { spinning: undefined };
    await nextTick();
    expect(hidden()).toBe(false);
    await sleep(30);
    expect(hidden()).toBe(true);
    input.value = { spinning: true, delay: 0 };
    await nextTick();
    expect(hidden()).toBe(false);
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("Spin handles zero, negative and NaN delays and retains empty native slots", async () => {
  const input = shallowRef<SpinProps>({ spinning: false, delay: 1000 });
  const tip = shallowRef("first");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Spin
        {...input.value}
        tip="fallback"
        v-slots={{
          default: () => [],
          tip: () => <strong>{tip.value}</strong>,
          indicator: () => [],
        }}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector(".semi-spin")!;
    input.value = { spinning: true, delay: 1000 };
    await nextTick();
    expect(root.classList.contains("semi-spin-hidden")).toBe(true);
    input.value = { spinning: true, delay: 0 };
    await nextTick();
    expect(root.classList.contains("semi-spin-hidden")).toBe(false);
    expect(root.classList.contains("semi-spin-block")).toBe(true);
    expect(root.querySelector("svg")).toBeNull();
    expect(root.querySelector("strong")?.textContent).toBe("first");
    tip.value = "second";
    await nextTick();
    expect(root.querySelector("strong")?.textContent).toBe("second");
    for (const delay of [Number.NaN, -1]) {
      input.value = { spinning: false, delay };
      await nextTick();
      input.value = { spinning: true, delay };
      await nextTick();
      if (Number.isNaN(delay))
        expect(root.classList.contains("semi-spin-hidden")).toBe(false);
      else {
        expect(root.classList.contains("semi-spin-hidden")).toBe(true);
        await sleep(20);
        expect(root.classList.contains("semi-spin-hidden")).toBe(false);
      }
    }
    input.value = { spinning: undefined, delay: undefined, size: undefined };
    await nextTick();
    expect(root.classList.contains("semi-spin-middle")).toBe(true);
    expect(root.classList.contains("semi-spin-hidden")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Spin clears the actual pending native timeout on unmount and rejects its late callback", async () => {
  const nativeSet = globalThis.setTimeout.bind(globalThis);
  let late: (() => void) | undefined;
  let ownedId: number | ReturnType<typeof setTimeout> | undefined;
  const spy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((
    callback: TimerHandler,
    delay?: number,
    ...args: unknown[]
  ) => {
    const id = nativeSet(callback, delay, ...args);
    if (delay === 12345 && typeof callback === "function") {
      late = callback as () => void;
      ownedId = id;
    }
    return id;
  }) as typeof setTimeout);
  const clear = vi.spyOn(globalThis, "clearTimeout");
  const input = shallowRef(false);
  const fixture = mountVapor(
    defineVaporComponent(() => <Spin delay={12345} spinning={input.value} />),
  );
  let mounted = true;
  try {
    input.value = true;
    await nextTick();
    expect(ownedId).toBeDefined();
    const retained = fixture.host.querySelector(".semi-spin")!;
    fixture.unmount();
    mounted = false;
    expect(clear).toHaveBeenCalledWith(ownedId);
    late!();
    await nextTick();
    expect(retained.classList.contains("semi-spin-hidden")).toBe(true);
    expect(fixture.host.childElementCount).toBe(0);
  } finally {
    if (mounted) fixture.unmount();
    spy.mockRestore();
    clear.mockRestore();
  }
});
