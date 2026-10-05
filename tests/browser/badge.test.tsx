import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Badge from "../../packages/semi-ui-vue/src/components/badge/Badge.js";
import type { BadgeProps } from "../../packages/semi-ui-vue/src/components/badge/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Badge scalar count preserves the fixed numeric expression and empty inner span", async () => {
  const props = shallowRef<BadgeProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Badge {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-badge")!;
    const inner = root.querySelector<HTMLElement>('[x-semi-prop="count"]')!;
    expect(inner.className).toContain("semi-badge-block");
    for (const [count, overflowCount, text] of [
      [0, undefined, "0"],
      [100, undefined, "100"],
      [100, 0, "100"],
      [99, 99, "99"],
      [100, 99, "99+"],
      [-1, -2, "-2+"],
      [1.25, 1.2, "1.2+"],
      [-1.25, undefined, "-1.25"],
      [NaN, 99, "NaN"],
      [Infinity, 99, "99+"],
      [-Infinity, 99, "-Infinity"],
      [100, NaN, "100"],
      [Infinity, Infinity, "Infinity"],
      ["100", 99, "100"],
      ["", 99, ""],
      [false, undefined, ""],
      [null, undefined, ""],
      [undefined, undefined, ""],
    ] as const) {
      props.value = { count, overflowCount };
      await nextTick();
      expect(root.querySelector('[x-semi-prop="count"]')).toBe(inner);
      expect(inner.textContent).toBe(text);
      expect(inner.classList.contains("semi-badge-count")).toBe(count != null);
      expect(inner.classList.contains("semi-badge-custom")).toBe(false);
    }
  } finally {
    fixture.unmount();
  }
});

test("Badge style precedence, defaults, native attributes and bubbling use the correct spans", async () => {
  const props = shallowRef<BadgeProps>({
    count: 3,
    children: "base",
    countStyle: { color: "red" },
  });
  const click = vi.fn();
  const parent = vi.fn();
  const enter = vi.fn();
  const leave = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div onClick={parent}>
        <Badge
          {...props.value}
          aria-label="Inbox"
          id="badge-id"
          onClick={click}
          onMouseEnter={enter}
          onMouseLeave={leave}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-badge")!;
    const inner = root.querySelector<HTMLElement>('[x-semi-prop="count"]')!;
    expect(inner.className).toContain("semi-badge-rightTop");
    expect(inner.style.color).toBe("red");
    expect(root.style.color).toBe("");
    expect(root.id).toBe("badge-id");
    expect(root.getAttribute("aria-label")).toBe("Inbox");
    for (const name of ["role", "aria-live", "tabindex", "aria-hidden"])
      expect(root.hasAttribute(name)).toBe(false);
    inner.click();
    expect(click).toHaveBeenCalledTimes(1);
    expect(parent).toHaveBeenCalledTimes(1);
    root.dispatchEvent(new MouseEvent("mouseenter"));
    root.dispatchEvent(new MouseEvent("mouseleave"));
    expect(enter).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);
    props.value = {
      count: true,
      dot: true,
      style: {},
      countStyle: { color: "red" },
      countClassName: "count-class",
      className: "outer-class",
    };
    await nextTick();
    expect(inner.style.color).toBe("");
    expect(inner.textContent).toBe("");
    expect(inner.classList.contains("semi-badge-custom")).toBe(true);
    expect(inner.classList.contains("semi-badge-primary")).toBe(false);
    expect(inner.classList.contains("semi-badge-dot")).toBe(true);
    expect(inner.classList.contains("semi-badge-count")).toBe(false);
    expect(inner.classList.contains("count-class")).toBe(true);
    expect(root.classList.contains("outer-class")).toBe(true);
    props.value = {
      count: 1,
      dot: undefined,
      type: undefined,
      theme: undefined,
      position: undefined,
    };
    await nextTick();
    expect(inner.className).toContain("semi-badge-primary");
    expect(inner.className).toContain("semi-badge-solid");
    expect(inner.className).not.toContain("semi-badge-dot");
    props.value = {};
    await nextTick();
    expect(inner.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
});
