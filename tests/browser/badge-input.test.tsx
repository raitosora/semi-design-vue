import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Badge from "../../packages/semi-ui-vue/src/components/badge/Badge.js";
import {
  badgeCallbacks,
  safeBadgeAttrs,
  validateBadgeProps,
} from "../../packages/semi-ui-vue/src/components/badge/input.js";
import type { BadgeProps } from "../../packages/semi-ui-vue/src/components/badge/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Badge preserves upstream safe runtime truthiness, classes and overflow coercion", async () => {
  const props = shallowRef<BadgeProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Badge {...props.value} />),
  );
  try {
    const inner = fixture.host.querySelector('[x-semi-prop="count"]')!;
    props.value = {
      count: 100,
      overflowCount: "99",
      dot: "",
      type: null,
      theme: "unlisted",
      position: "",
      children: "base",
    } as unknown as BadgeProps;
    await nextTick();
    expect(inner.textContent).toBe("99+");
    expect(inner.classList.contains("semi-badge-null")).toBe(true);
    expect(inner.classList.contains("semi-badge-unlisted")).toBe(true);
    expect(inner.classList.contains("semi-badge-block")).toBe(false);
    expect(inner.classList.contains("semi-badge-")).toBe(false);
    props.value = {
      count: 100,
      overflowCount: null,
      dot: null,
      position: null,
    } as unknown as BadgeProps;
    await nextTick();
    expect(inner.textContent).toBe("100");
    expect(inner.classList.contains("semi-badge-count")).toBe(true);
    props.value = {
      count: new Number(5),
      overflowCount: 3,
    } as unknown as BadgeProps;
    await nextTick();
    expect(inner.textContent).toBe("3+");
    expect(inner.classList.contains("semi-badge-count")).toBe(true);
    props.value = { count: new String("boxed") } as unknown as BadgeProps;
    await nextTick();
    expect(inner.textContent).toBe("boxed");
    expect(inner.classList.contains("semi-badge-custom")).toBe(false);
    props.value = { count: 1, dot: "yes" } as unknown as BadgeProps;
    await nextTick();
    expect(inner.textContent).toBe("");
    expect(inner.classList.contains("semi-badge-dot")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Badge limits raw content to supported native inputs and blocks DOM string injection", () => {
  for (const props of [
    { count: {} },
    { children: [] },
    { count: Symbol() },
    { onClick: false },
    { onMouseEnter: [() => undefined, 1] },
    { onMouseLeave: "bad" },
  ])
    expect(() => validateBadgeProps(props as unknown as BadgeProps)).toThrow();
  for (const props of [
    {},
    { count: null, children: false },
    { count: () => null },
    { count: NaN },
    { onClick: [() => undefined] },
    { onMouseEnter: null },
  ])
    expect(() =>
      validateBadgeProps(props as unknown as BadgeProps),
    ).not.toThrow();
  expect(badgeCallbacks(null)).toEqual([]);
  expect(badgeCallbacks(undefined)).toEqual([]);
  const callback = vi.fn();
  expect(
    safeBadgeAttrs({
      ".innerHTML": "unsafe",
      "^text-content": "unsafe",
      outerHTML: "unsafe",
      ref: callback,
      onclick: "bad",
      onBlur: [callback, "bad"],
      onFocus: [callback],
      onClick: callback,
      id: "safe",
      "aria-label": "safe",
    }),
  ).toEqual({
    onFocus: [callback],
    onClick: callback,
    id: "safe",
    "aria-label": "safe",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Badge
        {...({
          ".innerHTML": "<b>unsafe</b>",
          onclick: "bad",
          "^outerHTML": "bad",
        } as BadgeProps)}
        count="<img>"
      />
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("<img>");
    expect(fixture.host.querySelector("img")).toBeNull();
    expect(fixture.host.querySelector("b")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test.each(["click", "mouseenter", "mouseleave"] as const)(
  "Badge %s snapshots merged callback arrays and retained DOM is inert after unmount",
  (eventName) => {
    const received: string[] = [];
    let changed = false;
    const callbacks = [
      () => {
        received.push("first");
        if (!changed) {
          changed = true;
          callbacks.splice(1, 1);
          callbacks.push(() => received.push("added"));
        }
      },
      () => received.push("original"),
    ];
    const props = {
      [eventName === "click"
        ? "onClick"
        : eventName === "mouseenter"
          ? "onMouseEnter"
          : "onMouseLeave"]: callbacks,
    } as unknown as BadgeProps;
    const fixture = mountVapor(
      defineVaporComponent(() => <Badge {...props} count={1} />),
    );
    const root = fixture.host.querySelector<HTMLElement>(".semi-badge")!;
    try {
      root.dispatchEvent(new MouseEvent(eventName));
      expect(received).toEqual(["first", "original"]);
      root.dispatchEvent(new MouseEvent(eventName));
      expect(received).toEqual(["first", "original", "first", "added"]);
    } finally {
      fixture.unmount();
    }
    root.dispatchEvent(new MouseEvent(eventName));
    expect(received).toEqual(["first", "original", "first", "added"]);
  },
);

test("Badge boxed numbers preserve upstream comparison and display coercion hooks", async () => {
  const count = Object.assign(new Number(5), {
    [Symbol.toPrimitive]: (hint: string) =>
      hint === "number" ? 12 : "display",
  });
  const props = shallowRef<BadgeProps>({
    count,
    overflowCount: 10,
  } as unknown as BadgeProps);
  const fixture = mountVapor(
    defineVaporComponent(() => <Badge {...props.value} />),
  );
  try {
    const inner = fixture.host.querySelector('[x-semi-prop="count"]')!;
    expect(inner.textContent).toBe("10+");
    props.value = { count, overflowCount: 0 } as unknown as BadgeProps;
    await nextTick();
    expect(inner.textContent).toBe("display");
  } finally {
    fixture.unmount();
  }
});
