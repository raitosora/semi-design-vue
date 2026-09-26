import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Progress from "../../packages/semi-ui-vue/src/components/progress/index.js";
import type { ProgressProps } from "../../packages/semi-ui-vue/src/components/progress/index.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Progress resolves absent/undefined defaults and renders immediate line geometry", async () => {
  const input = shallowRef<ProgressProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    expect(root.tagName).toBe("DIV");
    expect(root.className).toBe("semi-progress semi-progress-horizontal");
    expect(root.getAttribute("role")).toBe("progressbar");
    expect(root.getAttribute("aria-valuenow")).toBe("0");
    expect(root.querySelector(".semi-progress-line-text")).toBeNull();
    for (const percent of [0, 100, -4, 120, 12.75]) {
      input.value = { percent, showInfo: true, motion: false };
      await nextTick();
      const value = Math.min(100, Math.max(0, percent));
      expect(root.getAttribute("aria-valuenow")).toBe(String(value));
      expect(
        root.querySelector<HTMLElement>(".semi-progress-track-inner")!.style
          .width,
      ).toBe(`${value}%`);
      expect(root.textContent).toBe(`${value}%`);
    }
    input.value = {
      percent: undefined,
      showInfo: undefined,
      direction: undefined,
      size: undefined,
    };
    await nextTick();
    expect(root.getAttribute("aria-valuenow")).toBe("0");
    expect(root.textContent).toBe("");
    input.value = {};
    await nextTick();
    expect(root.className).toBe("semi-progress semi-progress-horizontal");
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Progress preserves root attr filtering, class/style priority and vertical/indeterminate changes", async () => {
  const input = shallowRef<ProgressProps>({
    id: "p",
    className: "custom",
    class: "native",
    style: { width: "120px", color: "red" },
    percent: 25,
    motion: false,
    showInfo: true,
    "aria-label": "Upload",
    "aria-labelledby": "label",
    "aria-valuetext": "quarter",
    "data-owner": "app",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Progress
        {...input.value}
        {...{
          title: "ignored",
          role: "button",
          onClick: () => {
            throw new Error("ignored listener");
          },
        }}
      />
    )),
  );
  try {
    const root = fixture.host.firstElementChild as HTMLElement;
    expect(root.className).toBe(
      "semi-progress native custom semi-progress-horizontal",
    );
    expect(root.style.width).toBe("120px");
    expect(root.id).toBe("p");
    expect(root.getAttribute("data-owner")).toBe("app");
    expect(root.getAttribute("title")).toBeNull();
    expect(root.getAttribute("role")).toBe("progressbar");
    expect(root.getAttribute("aria-label")).toBe("Upload");
    expect(root.getAttribute("aria-labelledby")).toBe("label");
    expect(root.getAttribute("aria-valuetext")).toBe("quarter");
    root.click();
    input.value = {
      percent: 70,
      motion: false,
      direction: "vertical",
      size: "large",
      showInfo: true,
      orbitStroke: "red",
      stroke: "blue",
    };
    await nextTick();
    const inner = root.querySelector<HTMLElement>(
      ".semi-progress-track-inner",
    )!;
    expect(inner.style.height).toBe("70%");
    expect(inner.style.width).toBe("");
    expect(inner.style.background).toBe("blue");
    expect(
      root.querySelector<HTMLElement>(".semi-progress-track")!.style
        .backgroundColor,
    ).toBe("red");
    expect(root.className).toBe(
      "semi-progress semi-progress-vertical semi-progress-large",
    );
    expect(root.style.width).toBe("");
    expect(root.getAttribute("aria-label")).toBeNull();
    input.value = { ...input.value, indeterminate: true };
    await nextTick();
    expect(inner.style.height).toBe("");
    expect(
      inner.classList.contains("semi-progress-track-inner-indeterminate"),
    ).toBe(true);
    expect(root.getAttribute("aria-valuenow")).toBeNull();
    expect(root.querySelector(".semi-progress-line-text")).toBeNull();
    input.value = {
      percent: 30,
      motion: false,
      indeterminate: undefined,
      showInfo: true,
    };
    await nextTick();
    expect(inner.style.width).toBe("30%");
    expect(inner.style.background).toBe("");
    expect(root.textContent).toBe("30%");
  } finally {
    fixture.unmount();
  }
});

test("Progress circle matches SVG geometry, default sizes, caps and live mode replacement", async () => {
  const input = shallowRef<ProgressProps>({
    type: "circle",
    percent: 25,
    motion: false,
    showInfo: true,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    const svg = () => root.querySelector("svg")!;
    const ring = () => root.querySelector(".semi-progress-circle-ring-inner")!;
    expect(root.className).toBe("semi-progress-circle");
    expect(svg().getAttribute("width")).toBe("72");
    expect(svg().getAttribute("aria-hidden")).toBe("true");
    expect(ring().getAttribute("r")).toBe("34");
    expect(ring().getAttribute("cx")).toBe("36");
    expect(ring().getAttribute("stroke-linecap")).toBe("round");
    expect(Number(ring().getAttribute("stroke-dashoffset"))).toBeCloseTo(
      0.75 * 68 * Math.PI,
    );
    expect(root.querySelector("span")?.textContent).toBe("25%");
    input.value = { ...input.value, size: "small" };
    await nextTick();
    expect(svg().getAttribute("width")).toBe("24");
    expect(root.querySelector("span")).toBeNull();
    input.value = {
      ...input.value,
      size: "large",
      width: 90,
      strokeWidth: 10,
      strokeLinecap: "square",
      stroke: "red",
      orbitStroke: "blue",
    };
    await nextTick();
    expect(svg().getAttribute("height")).toBe("90");
    expect(ring().getAttribute("r")).toBe("40");
    expect(ring().getAttribute("stroke-width")).toBe("10");
    expect(ring().getAttribute("stroke-linecap")).toBe("square");
    expect((ring() as SVGElement).style.stroke).toBe("red");
    expect(root.querySelector("span")?.textContent).toBe("25%");
    input.value = { ...input.value, width: 0, indeterminate: true };
    await nextTick();
    expect(svg().getAttribute("width")).toBe("24");
    expect(ring().getAttribute("stroke-dashoffset")).toBe("0");
    expect(ring().getAttribute("stroke-dasharray")).toBe(
      `${14 * Math.PI * 0.3} ${14 * Math.PI}`,
    );
    expect(root.getAttribute("aria-valuenow")).toBeNull();
    input.value = { type: "line", percent: 100, showInfo: true, motion: false };
    await nextTick();
    expect(fixture.host.firstElementChild).toBe(root);
    expect(root.querySelector("svg")).toBeNull();
    expect(root.querySelector(".semi-progress-line-text")?.textContent).toBe(
      "100%",
    );
  } finally {
    fixture.unmount();
  }
});

test("Progress safely normalizes non-finite inputs and restores finite values", async () => {
  const input = shallowRef<ProgressProps>({
    type: "circle",
    showInfo: true,
    motion: false,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    for (const [percent, expected] of [
      [NaN, 0],
      [Infinity, 100],
      [-Infinity, 0],
      [12.5, 12.5],
    ] as const) {
      input.value = {
        ...input.value,
        percent,
        width: Infinity,
        strokeWidth: NaN,
      };
      await nextTick();
      const root = fixture.host.firstElementChild!;
      expect(root.getAttribute("aria-valuenow")).toBe(String(expected));
      expect(root.textContent).toBe(`${expected}%`);
      expect(root.querySelector("svg")!.getAttribute("width")).toBe("72");
      expect(root.querySelector("circle")!.getAttribute("stroke-width")).toBe(
        "4",
      );
      expect(root.innerHTML).not.toMatch(/NaN|Infinity/);
    }
    input.value = { ...input.value, width: -20, strokeWidth: -2 };
    await nextTick();
    expect(fixture.host.querySelector("svg")!.getAttribute("width")).toBe(
      "-20",
    );
    expect(fixture.host.querySelector("circle")!.getAttribute("r")).toBe("-9");
    input.value = { ...input.value, width: 80, strokeWidth: 8 };
    await nextTick();
    expect(fixture.host.querySelector("circle")!.getAttribute("r")).toBe("36");
  } finally {
    fixture.unmount();
  }
});

test("Progress forwards the upstream bare data- attribute and removes it dynamically", async () => {
  const input = shallowRef<ProgressProps>({ "data-": "bare" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    expect(root.getAttribute("data-")).toBe("bare");
    input.value = {};
    await nextTick();
    expect(root.getAttribute("data-")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Progress captures global defaults with dynamic data attribute and undefined fallback", async () => {
  semiGlobal.configure({
    overrideDefaultProps: {
      Progress: {
        percent: 30,
        showInfo: true,
        motion: false,
        "data-": "global",
        "data-owner": "global",
      },
    },
  });
  const input = shallowRef<ProgressProps>({ "data-owner": "local" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    expect(root.textContent).toBe("30%");
    expect(root.getAttribute("data-")).toBe("global");
    expect(root.getAttribute("data-owner")).toBe("local");
    semiGlobal.configure({
      overrideDefaultProps: {
        Progress: { percent: 80, "data-owner": "later" },
      },
    });
    input.value = { percent: undefined, "data-owner": undefined };
    await nextTick();
    expect(root.textContent).toBe("30%");
    expect(root.getAttribute("data-owner")).toBe("global");
    input.value = {};
    await nextTick();
    expect(root.getAttribute("data-owner")).toBe("global");
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("Progress captures global ARIA defaults and restores them after undefined/removal", async () => {
  semiGlobal.configure({
    overrideDefaultProps: {
      Progress: {
        "aria-label": "global label",
        "aria-labelledby": "global-id",
        "aria-valuetext": "global text",
      },
    },
  });
  const input = shallowRef<ProgressProps>({
    "aria-label": "local label",
    "aria-labelledby": "local-id",
    "aria-valuetext": "local text",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    expect(root.getAttribute("aria-label")).toBe("local label");
    expect(root.getAttribute("aria-labelledby")).toBe("local-id");
    expect(root.getAttribute("aria-valuetext")).toBe("local text");
    input.value = {
      "aria-label": undefined,
      "aria-labelledby": undefined,
      "aria-valuetext": undefined,
    };
    await nextTick();
    expect(root.getAttribute("aria-label")).toBe("global label");
    expect(root.getAttribute("aria-labelledby")).toBe("global-id");
    expect(root.getAttribute("aria-valuetext")).toBe("global text");
    input.value = {};
    await nextTick();
    expect(root.getAttribute("aria-label")).toBe("global label");
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("Progress reads body token colors on prop updates without observing theme mutations or using local overrides", async () => {
  const property = "--semi-blue-5";
  const previous = document.body.style.getPropertyValue(property);
  const priority = document.body.style.getPropertyPriority(property);
  const stroke = Object.freeze([
    Object.freeze({ percent: 100, color: "#fff" }),
    Object.freeze({ percent: 0, color: "blue" }),
  ]);
  const percent = shallowRef(20);
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    document.body.style.setProperty(property, "10, 20, 30");
    fixture = mountVapor(
      defineVaporComponent(() => (
        <section style={{ "--semi-blue-5": "200, 210, 220" }}>
          <Progress
            motion={false}
            percent={percent.value}
            stroke={stroke as unknown as ProgressProps["stroke"]}
          />
        </section>
      )),
    );
    const inner = fixture.host.querySelector<HTMLElement>(
      ".semi-progress-track-inner",
    )!;
    expect(getComputedStyle(inner).getPropertyValue(property).trim()).toBe(
      "200, 210, 220",
    );
    expect(inner.style.background).toBe("rgb(10, 20, 30)");
    expect(stroke[0]!.percent).toBe(100);
    document.body.style.setProperty(property, "40, 50, 60");
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
    expect(
      getComputedStyle(document.body).getPropertyValue(property).trim(),
    ).toBe("40, 50, 60");
    expect(percent.value).toBe(20);
    expect(inner.style.background).toBe("rgb(10, 20, 30)");
    percent.value = 25;
    await nextTick();
    expect(inner.style.background).toBe("rgb(40, 50, 60)");
    document.body.style.removeProperty(property);
    percent.value = 30;
    await nextTick();
    expect(getComputedStyle(inner).getPropertyValue(property).trim()).toBe(
      "200, 210, 220",
    );
    expect(inner.style.background).toBe("");
  } finally {
    try {
      fixture?.unmount();
    } finally {
      if (previous)
        document.body.style.setProperty(property, previous, priority);
      else document.body.style.removeProperty(property);
    }
  }
});

test("Progress finite zero/fractional dimensions retain upstream SVG geometry and stable size identity", async () => {
  const input = shallowRef<ProgressProps>({
    type: "circle",
    width: 20.5,
    strokeWidth: 0,
    motion: false,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const svg = fixture.host.querySelector("svg")!;
    expect(svg.getAttribute("width")).toBe("20.5");
    expect(svg.querySelector("circle")!.getAttribute("r")).toBe("10.25");
    input.value = {
      ...input.value,
      width: -20.5,
      strokeWidth: 2.5,
      size: "large",
    };
    await nextTick();
    expect(fixture.host.querySelector("svg")).toBe(svg);
    expect(svg.querySelector("circle")!.getAttribute("r")).toBe("-11.5");
    input.value = {
      ...input.value,
      width: undefined,
      strokeWidth: undefined,
      size: "small",
    };
    await nextTick();
    expect(fixture.host.querySelector("svg")).toBe(svg);
    expect(svg.getAttribute("width")).toBe("24");
    expect(svg.querySelector("circle")!.getAttribute("stroke-width")).toBe("4");
    input.value = { ...input.value, size: "default" };
    await nextTick();
    expect(fixture.host.querySelector("svg")).toBe(svg);
    expect(svg.getAttribute("width")).toBe("72");
  } finally {
    fixture.unmount();
  }
});

test("Progress renders fixed HSL interval colors and gradient selection without mutating intervals", async () => {
  const input = shallowRef<ProgressProps>({ percent: 50, motion: false });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const inner = fixture.host.querySelector<HTMLElement>(
      ".semi-progress-track-inner",
    )!;
    for (const [hue, color] of [
      [0, "rgb(255, 0, 0)"],
      [60, "rgb(255, 255, 0)"],
      [120, "rgb(0, 255, 0)"],
      [180, "rgb(0, 255, 255)"],
      [240, "rgb(0, 0, 255)"],
      [300, "rgb(255, 0, 255)"],
    ] as const) {
      input.value = {
        ...input.value,
        stroke: [{ percent: 0, color: `hsl(${hue}, 100%, 50%)` }],
      };
      await nextTick();
      expect(inner.style.background).toBe(color);
    }
    input.value = {
      ...input.value,
      stroke: [
        { percent: 0, color: "#f00" },
        { percent: 100, color: "#00f" },
      ],
      strokeGradient: true,
    };
    await nextTick();
    expect(inner.style.background).toBe("rgb(128, 0, 127)");
    input.value = {
      ...input.value,
      stroke: [{ percent: 0, color: "not-a-token" }],
    };
    await nextTick();
    expect(inner.style.background).toBe("");
    input.value = { ...input.value, stroke: [] };
    await nextTick();
    expect(inner.style.background).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("Progress safely handles captured own-undefined global format and numeric defaults", async () => {
  semiGlobal.configure({
    overrideDefaultProps: {
      Progress: {
        percent: undefined,
        strokeWidth: undefined,
        format: undefined,
        showInfo: true,
        type: "circle",
        motion: false,
      },
    },
  });
  const input = shallowRef<ProgressProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    expect(root.getAttribute("aria-valuenow")).toBe("0");
    expect(root.querySelector("circle")!.getAttribute("stroke-width")).toBe(
      "4",
    );
    expect(root.querySelector(".semi-progress-circle-text")!.textContent).toBe(
      "",
    );
    input.value = {
      percent: 40,
      strokeWidth: 8,
      format: (value) => `${value} units`,
    };
    await nextTick();
    expect(root.textContent).toBe("40 units");
    expect(root.querySelector("circle")!.getAttribute("stroke-width")).toBe(
      "8",
    );
    input.value = {
      percent: undefined,
      strokeWidth: undefined,
      format: undefined,
    };
    await nextTick();
    expect(root.getAttribute("aria-valuenow")).toBe("0");
    expect(root.querySelector("circle")!.getAttribute("stroke-width")).toBe(
      "4",
    );
    expect(root.textContent).toBe("");
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("Progress retains upstream finite extreme numeric geometry and recovers from overflowed SVG circumference", async () => {
  const input = shallowRef<ProgressProps>({
    type: "circle",
    motion: false,
    showInfo: true,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Progress {...input.value} />),
  );
  try {
    const root = fixture.host.firstElementChild!;
    for (const [percent, expected] of [
      [Number.MAX_VALUE, 100],
      [-Number.MAX_VALUE, 0],
      [Number.MIN_VALUE, Number.MIN_VALUE],
      [-0.5, 0],
      [0, 0],
    ] as const) {
      input.value = { ...input.value, percent };
      await nextTick();
      expect(root.getAttribute("aria-valuenow")).toBe(String(expected));
      expect(root.textContent).toBe(`${expected}%`);
    }
    input.value = {
      ...input.value,
      percent: 50,
      width: Number.MAX_VALUE,
      strokeWidth: 4,
    };
    await nextTick();
    const ring = root.querySelector(".semi-progress-circle-ring-inner")!;
    expect(root.querySelector("svg")!.getAttribute("width")).toBe(
      String(Number.MAX_VALUE),
    );
    expect(ring.getAttribute("stroke-dasharray")).toBe("Infinity Infinity");
    expect(ring.getAttribute("stroke-dashoffset")).toBe("Infinity");
    input.value = { ...input.value, width: 72 };
    await nextTick();
    expect(ring.getAttribute("stroke-dasharray")).toBe(
      `${68 * Math.PI} ${68 * Math.PI}`,
    );
    expect(Number(ring.getAttribute("stroke-dashoffset"))).toBeCloseTo(
      34 * Math.PI,
    );
    expect(root.innerHTML).not.toMatch(/NaN|Infinity/);
  } finally {
    fixture.unmount();
  }
});
