import { expect, test } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
  type ShallowRef,
} from "vue";
import Popover from "../../packages/semi-ui-vue/src/components/popover/index.js";
import type {
  Position,
  PopoverProps,
  PopoverTriggerScope,
} from "../../packages/semi-ui-vue/src/components/popover/types.js";
import {
  ariaIdScopeKey,
  createAriaIdScope,
} from "../../packages/semi-ui-vue/src/dom/aria.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const settle = async () => {
  await nextTick();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  await nextTick();
};
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1.2);
const positions: Position[] = [
  "top",
  "topLeft",
  "topRight",
  "bottom",
  "bottomLeft",
  "bottomRight",
  "left",
  "leftTop",
  "leftBottom",
  "right",
  "rightTop",
  "rightBottom",
  "leftTopOver",
  "rightTopOver",
  "leftBottomOver",
  "rightBottomOver",
];

interface GeometryFixture {
  readonly options: ShallowRef<PopoverProps>;
  readonly size: ShallowRef<{ width: number; height: number }>;
  readonly anchor: ShallowRef<{
    position: string;
    left: number;
    top: number;
    width: number;
    height: number;
    display: string;
  }>;
  readonly errors: ShallowRef<readonly unknown[]>;
  trigger(): HTMLButtonElement;
  popup(): HTMLElement;
  dispose(expectedErrors?: number): Promise<void>;
}

interface GeometryProbeBindings {
  readonly options: GeometryFixture["options"];
  readonly size: GeometryFixture["size"];
  readonly anchor: GeometryFixture["anchor"];
}

const GeometryProbe = defineVaporComponent<GeometryProbeBindings>(
  (bindings) => (
    <Popover
      arrowPointAtCenter={false}
      autoAdjustOverflow={false}
      contentClassName="geometry-popover"
      motion={false}
      showArrow={false}
      trigger="custom"
      visible={true}
      {...bindings.options.value}
    >
      {{
        default: (scope: PopoverTriggerScope) => (
          <button
            {...scope.triggerProps}
            ref={scope.triggerRef}
            style={`position:${bindings.anchor.value.position};left:${bindings.anchor.value.left}px;top:${bindings.anchor.value.top}px;width:${bindings.anchor.value.width}px;height:${bindings.anchor.value.height}px;padding:0;border:0;display:${bindings.anchor.value.display}`}
          >
            anchor
          </button>
        ),
        content: () => (
          <div
            data-geometry-content=""
            style={{
              width: `${bindings.size.value.width}px`,
              height: `${bindings.size.value.height}px`,
            }}
          >
            content
          </div>
        ),
      }}
    </Popover>
  ),
  { props: ["options", "size", "anchor"] },
);

async function fixture(
  initial: PopoverProps = {},
  container?: HTMLElement,
  initialSize = { width: 120, height: 70 },
  initialDisplay = "block",
): Promise<GeometryFixture> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  const host = document.createElement("div");
  (container ?? document.body).append(host);
  const props = shallowRef<PopoverProps>(initial);
  const size = shallowRef(initialSize);
  const anchor = shallowRef({
    position: "fixed",
    left: 300,
    top: 250,
    width: 80,
    height: 40,
    display: initialDisplay,
  });
  const errors = shallowRef<readonly unknown[]>([]);
  const app = createVaporApp(GeometryProbe, {
    options: props,
    size,
    anchor,
  });
  app.provide(ariaIdScopeKey, createAriaIdScope("popover-geometry"));
  app.config.errorHandler = (error) => {
    errors.value = [...errors.value, error];
  };
  // Vue devtools bootstrap belongs to app creation, outside mount-owned tracking.
  const tracker = installResourceTracker(window, document);
  try {
    app.mount(host);
  } catch (error) {
    try {
      app.unmount();
      tracker.assertClean();
    } finally {
      tracker.restore();
      host.remove();
    }
    throw error;
  }
  return {
    options: props,
    size,
    anchor,
    errors,
    trigger: () => host.querySelector<HTMLButtonElement>("button")!,
    popup: () =>
      document
        .querySelector<HTMLElement>(".geometry-popover")
        ?.closest<HTMLElement>("[role]")!,
    async dispose(expectedErrors = 0) {
      try {
        app.unmount();
        await nextTick();
        tracker.assertClean();
        expect(errors.value, errors.value.map(String).join(" | ")).toHaveLength(
          expectedErrors,
        );
      } finally {
        tracker.restore();
        host.remove();
      }
    },
  };
}

for (const position of positions) {
  test(`real layout follows ${position} anchor edges and spacing`, async () => {
    const f = await fixture({ position });
    try {
      await settle();
      const a = f.trigger().getBoundingClientRect();
      const p = f.popup().getBoundingClientRect();
      expect(p.width).toBeGreaterThan(100);
      expect(p.height).toBeGreaterThan(50);
      if (position.startsWith("top")) near(p.bottom, a.top - 4);
      if (position.startsWith("bottom")) near(p.top, a.bottom + 4);
      if (
        position === "left" ||
        position === "leftTop" ||
        position === "leftBottom"
      )
        near(p.right, a.left - 4);
      if (
        position === "right" ||
        position === "rightTop" ||
        position === "rightBottom"
      )
        near(p.left, a.right + 4);
      if (position === "top" || position === "bottom")
        near(p.left + p.width / 2, a.left + a.width / 2);
      if (position === "left" || position === "right")
        near(p.top + p.height / 2, a.top + a.height / 2);
      if (position.endsWith("Left")) near(p.left, a.left);
      if (position.endsWith("Right")) near(p.right, a.right);
      if (position.endsWith("Top")) near(p.top, a.top);
      if (position.endsWith("Bottom")) near(p.bottom, a.bottom);
      if (position.endsWith("Over")) {
        if (position.startsWith("left")) near(p.left, a.left - 4);
        else near(p.right, a.right + 4);
        if (position.includes("Top")) near(p.top, a.top - 4);
        else near(p.bottom, a.bottom + 4);
      }
    } finally {
      await f.dispose();
    }
  });
}

test("arrow bounding, independent spacing axes and transform origin use measured anchor", async () => {
  const f = await fixture({
    position: "topLeft",
    showArrow: true,
    arrowPointAtCenter: true,
    arrowBounding: { width: 32, height: 9, offsetX: 3, offsetY: 4 },
    spacing: { x: 11, y: 17 },
  });
  try {
    await settle();
    const a = f.trigger().getBoundingClientRect();
    const p = f.popup().getBoundingClientRect();
    near(p.bottom, a.top - 17);
    // Corner arrow attachment has a 6px inset plus half the supplied arrow width.
    near(p.left + 22, a.left + a.width / 2 + 11);
    expect(f.popup().style.transformOrigin).toBe("40px 100%");
    f.options.value = {
      ...f.options.value,
      position: "rightBottom",
    };
    await settle();
    const moved = f.popup().getBoundingClientRect();
    near(moved.left, a.right + 11);
    near(moved.bottom - 22, a.top + a.height / 2 + 17);
    expect(f.popup().style.transformOrigin).toBe("0% calc(100% - 20px)");
  } finally {
    await f.dispose();
  }
});

test("center arrow offsets update with real size and reset when center mode changes", async () => {
  const f = await fixture({
    position: "bottom",
    showArrow: true,
    arrowPointAtCenter: true,
    spacing: { x: 24, y: 9 },
  });
  try {
    await settle();
    const layer = f.popup().parentElement!;
    const first = parseFloat(
      layer.style.getPropertyValue("--semi-tooltip-arrow-offset-x"),
    );
    expect(first).toBeLessThan(50);
    expect(first).toBeGreaterThan(0);
    f.size.value = { width: 240, height: 110 };
    await settle();
    const second = parseFloat(
      layer.style.getPropertyValue("--semi-tooltip-arrow-offset-x"),
    );
    expect(second).toBeGreaterThan(first);
    f.options.value = { ...f.options.value, spacing: 9 };
    await settle();
    expect(layer.style.getPropertyValue("--semi-tooltip-arrow-offset-x")).toBe(
      "",
    );
    f.options.value = { ...f.options.value, arrowPointAtCenter: false };
    await settle();
    const edgeOffset = parseFloat(
      layer.style.getPropertyValue("--semi-tooltip-arrow-offset-x"),
    );
    near(
      (Math.min(edgeOffset, 100 - edgeOffset) *
        f.popup().getBoundingClientRect().width) /
        100,
      18,
    );
  } finally {
    await f.dispose();
  }
});

test("zero sized hidden anchor measures when revealed and measures another resize", async () => {
  const f = await fixture({ position: "bottom" }, undefined, undefined, "none");
  try {
    await settle();
    expect(f.trigger().getBoundingClientRect().width).toBe(0);
    f.anchor.value = { ...f.anchor.value, display: "block" };
    await settle();
    let a = f.trigger().getBoundingClientRect();
    let p = f.popup().getBoundingClientRect();
    near(p.left + p.width / 2, a.left + a.width / 2);
    f.anchor.value = { ...f.anchor.value, width: 160 };
    await settle();
    a = f.trigger().getBoundingClientRect();
    p = f.popup().getBoundingClientRect();
    near(p.left + p.width / 2, a.left + a.width / 2);
  } finally {
    await f.dispose();
  }
});

test("content resize, rePosKey and window resize refresh geometry", async () => {
  const f = await fixture({ position: "topRight" });
  try {
    await settle();
    const first = f.popup().getBoundingClientRect();
    f.size.value = { width: 240, height: 130 };
    await settle();
    const grown = f.popup().getBoundingClientRect();
    expect(grown.width).toBeGreaterThan(first.width + 100);
    near(grown.right, f.trigger().getBoundingClientRect().right);
    near(grown.bottom, f.trigger().getBoundingClientRect().top - 4);
    f.anchor.value = { ...f.anchor.value, left: 330 };
    await nextTick();
    f.options.value = { ...f.options.value, rePosKey: performance.now() };
    await settle();
    near(
      f.popup().getBoundingClientRect().right,
      f.trigger().getBoundingClientRect().right,
    );
    f.anchor.value = { ...f.anchor.value, left: 360 };
    await nextTick();
    f.options.value = { ...f.options.value, rePosKey: "moved" };
    await settle();
    near(
      f.popup().getBoundingClientRect().right,
      f.trigger().getBoundingClientRect().right,
    );
    f.anchor.value = { ...f.anchor.value, left: 390 };
    await nextTick();
    window.dispatchEvent(new Event("resize"));
    await settle();
    near(
      f.popup().getBoundingClientRect().right,
      f.trigger().getBoundingClientRect().right,
    );
  } finally {
    await f.dispose();
  }
});

for (const position of ["static", "relative", "absolute"] as const) {
  test(`body margin and ${position} popup container preserve viewport alignment`, async () => {
    const previous = document.body.style.cssText;
    const container = document.createElement("div");
    container.style.cssText = `position:${position};margin:19px 23px;width:650px;height:450px;`;
    document.body.style.margin = "27px 31px";
    document.body.append(container);
    const f = await fixture(
      { position: "bottomLeft", getPopupContainer: () => container },
      container,
    );
    try {
      await settle();
      const a = f.trigger().getBoundingClientRect();
      const p = f.popup().getBoundingClientRect();
      near(p.left, a.left);
      near(p.top, a.bottom + 4);
    } finally {
      await f.dispose();
      container.remove();
      document.body.style.cssText = previous;
    }
  });
}

test("body fallback with margins aligns against the initial containing block", async () => {
  const previous = document.body.style.cssText;
  document.body.style.cssText = "margin:29px 37px;position:static";
  const f = await fixture({ position: "bottomLeft" });
  try {
    await settle();
    const a = f.trigger().getBoundingClientRect();
    const p = f.popup().getBoundingClientRect();
    near(p.left, a.left);
    near(p.top, a.bottom + 4);
  } finally {
    await f.dispose();
    document.body.style.cssText = previous;
  }
});

test("scaled relative container preserves anchor alignment in viewport pixels", async () => {
  const container = document.createElement("div");
  container.style.cssText =
    "position:relative;width:650px;height:450px;transform:scale(.8);transform-origin:0 0;margin:15px";
  document.body.append(container);
  const f = await fixture(
    { position: "bottomLeft", spacing: 10, getPopupContainer: () => container },
    container,
  );
  try {
    await settle();
    const a = f.trigger().getBoundingClientRect();
    const p = f.popup().getBoundingClientRect();
    near(p.left, a.left);
    near(p.top, a.bottom + 8);
  } finally {
    await f.dispose();
    container.remove();
  }
});

test("viewport overflow flips top to bottom and disabled adjustment preserves top", async () => {
  const f = await fixture({ position: "top", autoAdjustOverflow: true });
  try {
    f.anchor.value = { ...f.anchor.value, top: 4 };
    await settle();
    const a = f.trigger().getBoundingClientRect();
    near(f.popup().getBoundingClientRect().top, a.bottom + 4);
    f.options.value = { ...f.options.value, autoAdjustOverflow: false };
    await settle();
    near(f.popup().getBoundingClientRect().bottom, a.top - 4);
  } finally {
    await f.dispose();
  }
});

test("when neither vertical side fits overflow pins popup to container boundary", async () => {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:0;top:0;width:100vw;height:100vh";
  document.body.append(container);
  const f = await fixture({
    position: "top",
    autoAdjustOverflow: true,
    getPopupContainer: () => container,
  });
  try {
    f.size.value = { width: 120, height: window.innerHeight + 50 };
    await settle();
    near(
      f.popup().getBoundingClientRect().top,
      container.getBoundingClientRect().top,
    );
  } finally {
    await f.dispose();
    container.remove();
  }
});

test("scroll container and window scroll update native anchor geometry", async () => {
  const container = document.createElement("div");
  container.style.cssText =
    "position:relative;width:650px;height:400px;overflow:auto;margin:20px";
  const spacer = document.createElement("div");
  spacer.style.height = "1000px";
  container.append(spacer);
  const pageSpacer = document.createElement("div");
  pageSpacer.style.height = "1200px";
  document.body.append(container, pageSpacer);
  const previousScroll = window.scrollY;
  const f = await fixture(
    { position: "bottomLeft", getPopupContainer: () => container },
    container,
  );
  try {
    f.anchor.value = { ...f.anchor.value, position: "absolute" };
    await settle();
    container.scrollTop = 70;
    await settle();
    expect(container.scrollTop).toBe(70);
    let a = f.trigger().getBoundingClientRect();
    let p = f.popup().getBoundingClientRect();
    near(p.left, a.left);
    near(p.top, a.bottom + 4);
    window.scrollTo(0, 60);
    await settle();
    expect(window.scrollY).toBe(60);
    a = f.trigger().getBoundingClientRect();
    p = f.popup().getBoundingClientRect();
    near(p.left, a.left);
    near(p.top, a.bottom + 4);
  } finally {
    await f.dispose();
    container.remove();
    pageSpacer.remove();
    window.scrollTo(0, previousScroll);
  }
});

test("dynamic same document migration preserves popup and content native identity", async () => {
  const first = document.createElement("div");
  const second = document.createElement("div");
  first.style.cssText =
    "position:relative;margin:17px;width:600px;height:400px";
  second.style.cssText =
    "position:absolute;left:33px;top:41px;width:650px;height:450px";
  document.body.append(first, second);
  const destination = shallowRef(first);
  const f = await fixture({
    position: "bottomLeft",
    getPopupContainer: () => destination.value,
  });
  try {
    await settle();
    const popup = f.popup();
    const content = popup.querySelector("[data-geometry-content]");
    expect(first.contains(popup)).toBe(true);
    destination.value = second;
    await settle();
    expect(f.popup()).toBe(popup);
    expect(popup.querySelector("[data-geometry-content]")).toBe(content);
    expect(second.contains(popup)).toBe(true);
    near(
      popup.getBoundingClientRect().left,
      f.trigger().getBoundingClientRect().left,
    );
    near(
      popup.getBoundingClientRect().top,
      f.trigger().getBoundingClientRect().bottom + 4,
    );
  } finally {
    await f.dispose();
    first.remove();
    second.remove();
  }
});

test("short trigger arrow correction and vertical center offset honor supplied bounds", async () => {
  const f = await fixture({
    position: "rightTop",
    showArrow: true,
    arrowPointAtCenter: false,
    arrowBounding: { width: 32, offsetY: 4 },
  });
  try {
    f.anchor.value = { ...f.anchor.value, height: 8 };
    await settle();
    f.options.value = { ...f.options.value, rePosKey: performance.now() };
    await settle();
    let a = f.trigger().getBoundingClientRect();
    let p = f.popup().getBoundingClientRect();
    near(p.top, a.top + a.height / 2 - 20);
    f.options.value = {
      ...f.options.value,
      position: "right",
      arrowPointAtCenter: true,
      spacing: { x: 8, y: 24 },
    };
    await settle();
    const layer = f.popup().parentElement!;
    const first = parseFloat(
      layer.style.getPropertyValue("--semi-tooltip-arrow-offset-y"),
    );
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(50);
    f.size.value = { width: 120, height: 180 };
    await settle();
    const second = parseFloat(
      layer.style.getPropertyValue("--semi-tooltip-arrow-offset-y"),
    );
    expect(second).toBeGreaterThan(first);
    a = f.trigger().getBoundingClientRect();
    p = f.popup().getBoundingClientRect();
    near(p.top + p.height / 2, a.top + a.height / 2 + 24);
  } finally {
    await f.dispose();
  }
});

test("initial zero sized content waits for layout then notifies once and follows another resize", async () => {
  const changes = shallowRef<readonly boolean[]>([]);
  const f = await fixture(
    {
      position: "bottom",
      onVisibleChange: (value) => {
        changes.value = [...changes.value, value];
      },
    },
    undefined,
    { width: 0, height: 0 },
  );
  try {
    await settle();
    expect(f.popup().getBoundingClientRect().width).toBe(0);
    expect(changes.value).toEqual([]);
    f.size.value = { width: 120, height: 70 };
    await settle();
    expect(changes.value).toEqual([true]);
    let a = f.trigger().getBoundingClientRect();
    let p = f.popup().getBoundingClientRect();
    near(p.left + p.width / 2, a.left + a.width / 2);
    near(p.top, a.bottom + 4);
    f.size.value = { width: 180, height: 90 };
    await settle();
    a = f.trigger().getBoundingClientRect();
    p = f.popup().getBoundingClientRect();
    near(p.left + p.width / 2, a.left + a.width / 2);
    near(p.top, a.bottom + 4);
    expect(changes.value).toEqual([true]);
  } finally {
    await f.dispose();
  }
});

test("unmount cancels pending measurement after content and placement updates", async () => {
  const f = await fixture({ position: "bottom" });
  try {
    await settle();
    f.size.value = { width: 190, height: 110 };
    f.options.value = {
      ...f.options.value,
      position: "leftBottom",
      rePosKey: "pending",
    };
  } finally {
    await f.dispose();
  }
  expect(document.querySelector(".geometry-popover")).toBeNull();
});

test("zero spacing and zero main axis in extended spacing retain native edge contact", async () => {
  const f = await fixture({ position: "bottomLeft", spacing: 0 });
  try {
    await settle();
    const a = f.trigger().getBoundingClientRect();
    near(f.popup().getBoundingClientRect().top, a.bottom);
    f.options.value = { ...f.options.value, spacing: { x: -7, y: 0 } };
    await settle();
    const p = f.popup().getBoundingClientRect();
    near(p.top, a.bottom);
    near(p.left, a.left - 7);
  } finally {
    await f.dispose();
  }
});

test("four side margin object participates in overflow flip without moving anchor", async () => {
  const f = await fixture({ position: "top", autoAdjustOverflow: true });
  try {
    f.anchor.value = { ...f.anchor.value, top: 100 };
    await nextTick();
    f.options.value = { ...f.options.value, rePosKey: performance.now() };
    await settle();
    const a = f.trigger().getBoundingClientRect();
    near(f.popup().getBoundingClientRect().bottom, a.top - 4);
    f.options.value = {
      ...f.options.value,
      margin: { marginTop: 50, marginBottom: 0, marginLeft: 0, marginRight: 0 },
    };
    await settle();
    near(f.popup().getBoundingClientRect().top, a.bottom + 4);
    expect(f.trigger().getBoundingClientRect().top).toBe(a.top);
  } finally {
    await f.dispose();
  }
});

for (const position of ["relative", "absolute"] as const) {
  test(`positioned body ${position} with margins retains anchor alignment`, async () => {
    const previous = document.body.style.cssText;
    document.body.style.cssText = `position:${position};margin:29px 37px;width:650px;height:450px`;
    const f = await fixture({ position: "bottomLeft" });
    try {
      await settle();
      const a = f.trigger().getBoundingClientRect();
      const p = f.popup().getBoundingClientRect();
      near(p.left, a.left);
      near(p.top, a.bottom + 4);
    } finally {
      await f.dispose();
      document.body.style.cssText = previous;
    }
  });
}

for (const [from, to] of [
  ["static", "relative"],
  ["static", "absolute"],
  ["relative", "static"],
  ["absolute", "static"],
] as const) {
  test(`container positioning migration ${from} to ${to} preserves geometry and native content`, async () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.style.cssText = `position:${from};left:41px;top:23px;margin:17px 29px;width:600px;height:360px`;
    second.style.cssText = `position:${to};left:83px;top:61px;margin:31px 37px;width:620px;height:380px`;
    document.body.append(first, second);
    const destination = shallowRef(first);
    const f = await fixture({
      position: "top",
      spacing: { x: 24, y: 8 },
      getPopupContainer: () => destination.value,
    });
    const assertPosition = () => {
      const a = f.trigger().getBoundingClientRect();
      const p = f.popup().getBoundingClientRect();
      near(p.left + p.width / 2, a.left + a.width / 2 + 24);
      near(p.bottom, a.top - 8);
    };
    try {
      await settle();
      const popup = f.popup();
      const content = popup.querySelector("[data-geometry-content]");
      expect(first.contains(popup)).toBe(true);
      assertPosition();
      destination.value = second;
      await settle();
      expect(second.contains(popup)).toBe(true);
      expect(first.contains(popup)).toBe(false);
      expect(f.popup()).toBe(popup);
      expect(popup.querySelector("[data-geometry-content]")).toBe(content);
      assertPosition();
      const before = popup.getBoundingClientRect();
      f.size.value = { width: 210, height: 130 };
      await settle();
      expect(popup.getBoundingClientRect().width).toBeGreaterThan(
        before.width + 40,
      );
      expect(popup.getBoundingClientRect().height).toBeGreaterThan(
        before.height + 50,
      );
      assertPosition();
      destination.value = first;
      await settle();
      expect(first.contains(popup)).toBe(true);
      expect(f.popup()).toBe(popup);
      expect(popup.querySelector("[data-geometry-content]")).toBe(content);
      assertPosition();
    } finally {
      try {
        await f.dispose();
      } finally {
        first.remove();
        second.remove();
      }
    }
  });
}

test("default bottom spacing changes from four to ten with default arrow bounds and retains zero", async () => {
  const f = await fixture();
  try {
    await settle();
    const a = f.trigger().getBoundingClientRect();
    near(f.popup().getBoundingClientRect().top, a.bottom + 4);
    expect(f.popup().querySelector("svg")).toBeNull();
    f.options.value = { showArrow: true };
    await settle();
    near(f.popup().getBoundingClientRect().top, a.bottom + 10);
    expect(f.popup().querySelector("svg")?.getAttribute("width")).toBe("24");
    expect(f.popup().querySelector("svg")?.getAttribute("height")).toBe("8");
    expect(f.popup().querySelectorAll("svg path")).toHaveLength(2);
    f.options.value = { position: "rightTop", showArrow: true };
    f.anchor.value = { ...f.anchor.value, height: 8 };
    await settle();
    const short = f.trigger().getBoundingClientRect();
    near(
      f.popup().getBoundingClientRect().top,
      short.top + short.height / 2 - 18,
    );
    f.options.value = { position: "bottom", showArrow: true, spacing: 0 };
    await settle();
    near(f.popup().getBoundingClientRect().top, short.bottom);
  } finally {
    await f.dispose();
  }
});

test("arrow follows actual overflow-flipped placement and changes paths across axes", async () => {
  const f = await fixture({
    position: "top",
    showArrow: true,
    autoAdjustOverflow: true,
  });
  try {
    f.anchor.value = { ...f.anchor.value, top: 4 };
    await settle();
    const a = f.trigger().getBoundingClientRect();
    near(f.popup().getBoundingClientRect().top, a.bottom + 10);
    expect(f.popup().getAttribute("x-placement")).toBe("bottom");
    const first = f.popup().querySelector("svg path")!.getAttribute("d");
    expect(first).toContain("M0 0.5L0 1.5");
    f.options.value = {
      position: "right",
      showArrow: true,
      autoAdjustOverflow: false,
    };
    await settle();
    near(f.popup().getBoundingClientRect().left, a.right + 10);
    const path = f.popup().querySelector("svg path")!.getAttribute("d");
    expect(path).not.toBe(first);
    expect(path).toContain("M0.5 0L1.5 0");
  } finally {
    await f.dispose();
  }
});
