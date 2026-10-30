import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import Breadcrumb from "../../packages/semi-ui-vue/src/components/breadcrumb/index.js";
import {
  breadcrumbTooltip,
  notifyBreadcrumbItem,
} from "../../packages/semi-ui-vue/src/components/breadcrumb/input.js";
import type {
  BreadcrumbProps,
  BreadcrumbItemProps,
} from "../../packages/semi-ui-vue/src/components/breadcrumb/types.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

test("Breadcrumb null callbacks preserve source failure order while undefined uses defaults", async () => {
  const event = new MouseEvent("click");
  const own = vi.fn(),
    parent = vi.fn();
  expect(() =>
    notifyBreadcrumbItem(
      { name: "item" },
      event,
      null as unknown as BreadcrumbItemProps["onClick"],
      parent,
    ),
  ).toThrow(TypeError);
  expect(parent).not.toHaveBeenCalled();
  expect(() =>
    notifyBreadcrumbItem(
      { name: "item" },
      event,
      own,
      null as unknown as BreadcrumbProps["onClick"],
    ),
  ).toThrow(TypeError);
  expect(own).toHaveBeenCalledOnce();
  expect(() =>
    notifyBreadcrumbItem({ name: "item" }, event, undefined, undefined),
  ).not.toThrow();
  const mode = shallowRef("parent-null");
  const errors: unknown[] = [],
    calls: string[] = [];
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-null-callback");
      return (
        <Breadcrumb
          onClick={
            mode.value === "parent-null"
              ? (null as unknown as BreadcrumbProps["onClick"])
              : () => calls.push("parent")
          }
        >
          {() => (
            <Breadcrumb.Item
              children="item"
              onClick={
                mode.value === "own-null"
                  ? (null as unknown as BreadcrumbItemProps["onClick"])
                  : mode.value === "undefined"
                    ? undefined
                    : () => calls.push("own")
              }
            />
          )}
        </Breadcrumb>
      );
    }),
  );
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  app.mount(host);
  try {
    await settle();
    host.querySelector<HTMLElement>(".semi-breadcrumb-item")!.click();
    expect(calls).toEqual(["own"]);
    expect(errors[0]).toBeInstanceOf(TypeError);
    mode.value = "own-null";
    await settle();
    host.querySelector<HTMLElement>(".semi-breadcrumb-item")!.click();
    expect(calls).toEqual(["own"]);
    expect(errors).toHaveLength(2);
    mode.value = "undefined";
    await settle();
    host.querySelector<HTMLElement>(".semi-breadcrumb-item")!.click();
    expect(calls).toEqual(["own", "parent"]);
    expect(errors).toHaveLength(2);
  } finally {
    app.unmount();
    host.remove();
  }
});

test("Breadcrumb tooltip options preserve falsy runtime values and undefined merging", async () => {
  for (const opts of [null, false, 0, ""]) {
    const value = { opts } as unknown as BreadcrumbProps["showTooltip"];
    expect(breadcrumbTooltip(value)).toEqual({
      width: 150,
      ellipsisPos: "end",
      opts,
    });
  }
  expect(
    breadcrumbTooltip({
      opts: { position: undefined, autoAdjustOverflow: false },
    }),
  ).toEqual({
    width: 150,
    ellipsisPos: "end",
    opts: { position: "top", autoAdjustOverflow: false },
  });
  expect(breadcrumbTooltip(true).opts).toEqual({
    position: "top",
    autoAdjustOverflow: true,
  });
  expect(breadcrumbTooltip(false)).toEqual({ width: 150, ellipsisPos: "end" });
  const sheet = document.createElement("style");
  sheet.textContent = `.breadcrumb-tooltip-case .semi-typography{font:16px/24px monospace;margin:0}.breadcrumb-tooltip-case .semi-typography-ellipsis-single-line{overflow:hidden}.breadcrumb-tooltip-case .semi-typography-ellipsis-overflow-ellipsis{display:block;white-space:nowrap;text-overflow:ellipsis}`;
  document.head.append(sheet);
  const options = shallowRef<BreadcrumbProps["showTooltip"]>({
    width: 60,
    opts: { motion: false, mouseEnterDelay: 0, mouseLeaveDelay: 0 },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-tooltip-options");
      return (
        <div class="breadcrumb-tooltip-case">
          <button data-away="">away</button>
          <Breadcrumb
            routes={["A long label that really overflows"]}
            showTooltip={options.value}
          />
        </div>
      );
    }),
  );
  try {
    await settle();
    const title = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    expect(title.style.maxWidth).toBe("60px");
    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await userEvent.hover(fixture.host.querySelector("button")!);
    await userEvent.hover(title);
    await vi.waitFor(() =>
      expect(document.querySelector(".semi-tooltip-content")?.textContent).toBe(
        "A long label that really overflows",
      ),
    );
    for (const opts of [false, 0, "", null]) {
      await userEvent.hover(fixture.host.querySelector("button")!);
      options.value = {
        width: 60,
        opts,
      } as unknown as BreadcrumbProps["showTooltip"];
      await settle();
      const current =
        fixture.host.querySelector<HTMLElement>(".semi-typography")!;
      expect(current.style.maxWidth).toBe("60px");
      await userEvent.hover(current);
      await settle();
      expect(document.querySelector(".semi-tooltip-content")).toBeNull();
      expect(fixture.host.querySelector(".semi-typography")).toBe(current);
    }
    options.value = { width: "80px", opts: null as never };
    await settle();
    expect(
      fixture.host.querySelector<HTMLElement>(".semi-typography")!.style
        .maxWidth,
    ).toBe("80px");
    options.value = {
      width: null,
      opts: null,
    } as unknown as BreadcrumbProps["showTooltip"];
    await settle();
    expect(
      fixture.host.querySelector<HTMLElement>(".semi-typography")!.style
        .maxWidth,
    ).toBe("");
  } finally {
    fixture.unmount();
    sheet.remove();
  }
  expect(document.querySelector(".semi-tooltip-content")).toBeNull();
});
