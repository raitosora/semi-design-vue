import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Badge from "../../packages/semi-ui-vue/src/components/badge/Badge.js";
import ConfigProvider from "../../packages/semi-ui-vue/src/components/configProvider/ConfigProvider.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import type { BadgeProps } from "../../packages/semi-ui-vue/src/components/badge/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Badge direction is reactive, explicit position wins, apps are isolated and global defaults are not applied", async () => {
  const previous = semiGlobal.config;
  semiGlobal.configure({
    overrideDefaultProps: { Badge: { count: 77, type: "danger", dot: true } },
  } as unknown as Parameters<typeof semiGlobal.configure>[0]);
  const direction = shallowRef<"rtl" | "ltr" | undefined>("rtl");
  const props = shallowRef<BadgeProps>({ children: "base", count: 4 });
  const first = mountVapor(
    defineVaporComponent(() => (
      <ConfigProvider direction={direction.value}>
        {() => <Badge {...props.value} />}
      </ConfigProvider>
    )),
  );
  const click = vi.fn();
  const second = mountVapor(
    defineVaporComponent(() => (
      <Badge children="base" count={2} onClick={click} />
    )),
  );
  try {
    const a = first.host.querySelector('[x-semi-prop="count"]')!;
    const b = second.host.querySelector('[x-semi-prop="count"]')!;
    expect(a.classList.contains("semi-badge-leftTop")).toBe(true);
    expect(b.classList.contains("semi-badge-rightTop")).toBe(true);
    expect(a.classList.contains("semi-badge-primary")).toBe(true);
    expect(a.textContent).toBe("4");
    for (const position of [
      "leftTop",
      "leftBottom",
      "rightTop",
      "rightBottom",
    ] as const) {
      props.value = { ...props.value, position };
      await nextTick();
      expect(a.classList.contains(`semi-badge-${position}`)).toBe(true);
    }
    direction.value = "ltr";
    await nextTick();
    expect(a.classList.contains("semi-badge-rightBottom")).toBe(true);
    props.value = { children: "base", count: 4, position: undefined };
    await nextTick();
    expect(a.classList.contains("semi-badge-rightTop")).toBe(true);
    direction.value = "rtl";
    await nextTick();
    expect(a.classList.contains("semi-badge-leftTop")).toBe(true);
    props.value = { children: "base", count: 4 };
    direction.value = undefined;
    await nextTick();
    expect(a.classList.contains("semi-badge-rightTop")).toBe(true);
    first.unmount();
    second.host.querySelector<HTMLElement>(".semi-badge")!.click();
    expect(click).toHaveBeenCalledTimes(1);
    expect(b.isConnected).toBe(true);
  } finally {
    if (first.host.isConnected) first.unmount();
    second.unmount();
    semiGlobal.configure(previous);
  }
  expect(first.host.childNodes).toHaveLength(0);
  expect(second.host.childNodes).toHaveLength(0);
});
