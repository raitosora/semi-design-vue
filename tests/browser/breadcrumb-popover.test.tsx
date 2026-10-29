import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import Breadcrumb from "../../packages/semi-ui-vue/src/components/breadcrumb/index.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import type { BreadcrumbProps } from "../../packages/semi-ui-vue/src/components/breadcrumb/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 80));
  await nextTick();
};
test("Breadcrumb popover exposes omitted items in order and root expansion releases overlay", async () => {
  const click = vi.fn();
  const routes = shallowRef<BreadcrumbProps["routes"]>([
    "first",
    { name: "hidden-a", href: "#hidden" },
    "hidden-b",
    "last",
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-popover");
      return (
        <Breadcrumb
          maxItemCount={2}
          moreType="popover"
          onClick={click}
          routes={routes.value}
        />
      );
    }),
  );
  try {
    await settle();
    const nav = fixture.host.querySelector("nav")!;
    expect(nav.textContent).toBe("first//last");
    const more = nav.querySelector<HTMLElement>(".semi-breadcrumb-item-more")!;
    const trigger = more.querySelector<HTMLElement>("span")!;
    await userEvent.hover(trigger);
    trigger.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await vi.waitFor(() =>
      expect(document.querySelector(".semi-popover-content")).not.toBeNull(),
    );
    const popup = document.querySelector<HTMLElement>(".semi-popover-content")!;
    expect(
      document.querySelector<HTMLElement>(".semi-popover-wrapper")!.style
        .padding,
    ).toBe("12px");
    expect(popup.textContent).toBe("hidden-a/hidden-b");
    expect(popup.querySelectorAll(".semi-breadcrumb-separator")).toHaveLength(
      0,
    );
    expect(popup.querySelectorAll(".semi-breadcrumb-restItem")).toHaveLength(1);
    expect(
      document.querySelector(".semi-popover-wrapper")?.getAttribute("role"),
    ).toBe("tooltip");
    popup
      .querySelector("a")!
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    expect(click).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]?.[0]).toEqual({
      name: "hidden-a",
      href: "#hidden",
    });
    await settle();
    expect(nav.querySelector(".semi-breadcrumb-collapse")).toBeNull();
    expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
    expect(nav.textContent).toBe("first/hidden-a/hidden-b/last");
  } finally {
    fixture.unmount();
  }
  expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
});
test("Breadcrumb renderMore precedence and invalid runtime moreType follow fixed source", async () => {
  const props = shallowRef<BreadcrumbProps>({
    moreType: "popover",
    renderMore: (rest) => `rest=${rest.length}`,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-more-type");
      return (
        <Breadcrumb
          {...props.value}
          maxItemCount={2}
          routes={["first", "middle", "last"]}
        />
      );
    }),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("first/rest=1/last");
    expect(fixture.host.querySelector("svg")).toBeNull();
    props.value = { moreType: "invalid" as "default" };
    await settle();
    expect(
      fixture.host.querySelector(".semi-breadcrumb-collapse"),
    ).not.toBeNull();
    expect(fixture.host.querySelector("svg")).toBeNull();
    props.value = { moreType: "default" };
    await settle();
    expect(
      fixture.host.querySelector(".semi-icon.semi-icon-more svg"),
    ).not.toBeNull();
    for (const renderMore of [undefined, null, false, 0, "wrong"]) {
      props.value = { renderMore: renderMore as BreadcrumbProps["renderMore"] };
      await settle();
      expect(
        fixture.host.querySelector(".semi-icon.semi-icon-more svg"),
      ).not.toBeNull();
      expect(fixture.host.textContent).toBe("first//last");
    }
    props.value = { renderMore: (rest) => `again=${rest.length}` };
    await settle();
    expect(fixture.host.textContent).toBe("first/again=1/last");
    props.value = {};
    await settle();
    expect(
      fixture.host.querySelector(".semi-icon.semi-icon-more svg"),
    ).not.toBeNull();
    props.value = { autoCollapse: false };
    await settle();
    expect(fixture.host.textContent).toBe("first/middle/last");
    props.value = { autoCollapse: undefined };
    await settle();
    expect(
      fixture.host.querySelector(".semi-breadcrumb-collapse"),
    ).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test.each([
  ["keypress", "Enter", true],
  ["keypress", " ", false],
  ["keydown", "Enter", false],
] as const)(
  "Breadcrumb popup %s %s follows the source Enter protocol",
  async (type, key, expanded) => {
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provideAriaIdScope(
          `breadcrumb-popup-${type}-${key === " " ? "space" : key}`,
        );
        return (
          <Breadcrumb
            maxItemCount={2}
            moreType="popover"
            routes={["first", "hidden", "last"]}
          />
        );
      }),
    );
    try {
      await settle();
      const more = fixture.host.querySelector<HTMLElement>(
        ".semi-breadcrumb-item-more",
      )!;
      await userEvent.hover(more.querySelector("span")!);
      await vi.waitFor(() =>
        expect(
          document.querySelector(".semi-popover-content .semi-breadcrumb-item"),
        ).not.toBeNull(),
      );
      const event = new KeyboardEvent(type, {
        key,
        bubbles: true,
        cancelable: true,
      });
      document
        .querySelector(".semi-popover-content .semi-breadcrumb-item")!
        .dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      await settle();
      expect(!!fixture.host.querySelector(".semi-breadcrumb-collapse")).toBe(
        !expanded,
      );
      expect(!!document.querySelector(".semi-popover-wrapper")).toBe(!expanded);
    } finally {
      fixture.unmount();
    }
  },
);

test("Breadcrumb popup keeps native stopPropagation and preventDefault behavior", async () => {
  const stop = shallowRef(true);
  const calls: string[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-popup-propagation");
      return (
        <Breadcrumb
          maxItemCount={2}
          moreType="popover"
          onClick={() => calls.push("parent")}
          routes={[
            "first",
            {
              name: "hidden",
              href: "#never-navigate",
              onClick: (_route: unknown, event: MouseEvent) => {
                calls.push("own");
                event.preventDefault();
                if (stop.value) event.stopPropagation();
              },
            },
            "last",
          ]}
        />
      );
    }),
  );
  try {
    await settle();
    await userEvent.hover(
      fixture.host.querySelector(".semi-breadcrumb-item-more span")!,
    );
    await vi.waitFor(() =>
      expect(document.querySelector(".semi-popover-content a")).not.toBeNull(),
    );
    const link = document.querySelector(".semi-popover-content a")!;
    const first = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(first);
    await settle();
    expect(first.defaultPrevented).toBe(true);
    expect(calls).toEqual(["own", "parent"]);
    expect(
      fixture.host.querySelector(".semi-breadcrumb-collapse"),
    ).not.toBeNull();
    stop.value = false;
    const second = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(second);
    await settle();
    expect(second.defaultPrevented).toBe(true);
    expect(calls).toEqual(["own", "parent", "own", "parent"]);
    expect(fixture.host.querySelector(".semi-breadcrumb-collapse")).toBeNull();
    expect(document.querySelector(".semi-popover-wrapper")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Breadcrumb sparse hidden routes preserve renderMore length and popup trailing separators", async () => {
  const custom = shallowRef(true);
  const routes = ["first", "hidden", , "last"] as string[];
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-sparse-rest");
      return (
        <Breadcrumb
          maxItemCount={2}
          moreType="popover"
          renderMore={
            custom.value
              ? (rest) => `${rest.length}:${Object.keys(rest).join(",")}`
              : undefined
          }
          routes={routes}
        />
      );
    }),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("first/2:0/last");
    custom.value = false;
    await settle();
    await userEvent.hover(
      fixture.host.querySelector(".semi-breadcrumb-item-more span")!,
    );
    await vi.waitFor(() =>
      expect(document.querySelector(".semi-popover-content")).not.toBeNull(),
    );
    const popup = document.querySelector(".semi-popover-content")!;
    expect(popup.textContent).toBe("hidden/");
    expect(popup.querySelectorAll(".semi-breadcrumb-restItem")).toHaveLength(1);
  } finally {
    fixture.unmount();
  }
});

test("Breadcrumb all-hole routes still expose source collapse and sparse rest", async () => {
  const render = shallowRef<BreadcrumbProps["renderMore"]>(
    (rest) => `${rest.length}:${Object.keys(rest).length}`,
  );
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-all-holes");
      return (
        <Breadcrumb
          maxItemCount={2}
          renderMore={render.value}
          routes={Array(4)}
        />
      );
    }),
  );
  try {
    await settle();
    expect(
      fixture.host.querySelectorAll(".semi-breadcrumb-collapse"),
    ).toHaveLength(1);
    expect(fixture.host.textContent).toBe("2:0/");
    render.value = undefined;
    await settle();
    expect(fixture.host.querySelector(".semi-icon-more svg")).not.toBeNull();
    fixture.host
      .querySelector<HTMLElement>(".semi-breadcrumb-item-more")!
      .click();
    await settle();
    expect(fixture.host.querySelector(".semi-breadcrumb-collapse")).toBeNull();
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
});
