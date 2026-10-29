import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Breadcrumb from "../../packages/semi-ui-vue/src/components/breadcrumb/index.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import type {
  BreadcrumbProps,
  BreadcrumbItemProps,
  RouteProps,
} from "../../packages/semi-ui-vue/src/components/breadcrumb/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test("Breadcrumb routes win only when nonempty and collapse expands permanently", async () => {
  const routes = shallowRef<string[] | undefined>([
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
  ]);
  const slot = vi.fn(() => <Breadcrumb.Item children="fallback" />);
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-basics");
      return <Breadcrumb routes={routes.value}>{slot}</Breadcrumb>;
    }),
  );
  try {
    await settle();
    expect(slot).not.toHaveBeenCalled();
    expect(
      fixture.host.querySelectorAll(".semi-breadcrumb-item-wrap"),
    ).toHaveLength(5);
    expect(fixture.host.textContent).toBe("one//four/five/six");
    fixture.host
      .querySelector<HTMLElement>(".semi-breadcrumb-item-more")!
      .click();
    await settle();
    expect(
      fixture.host.querySelectorAll(".semi-breadcrumb-item-wrap"),
    ).toHaveLength(6);
    routes.value = [];
    await settle();
    expect(fixture.host.textContent).toBe("fallback");
    routes.value = ["1", "2", "3", "4", "5"];
    await settle();
    expect(fixture.host.querySelector(".semi-breadcrumb-collapse")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

const fixtureFor = (render: () => import("vue-jsx").JSX.Element) =>
  mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-test");
      return render();
    }),
  );
test("Breadcrumb route and Item link/active/noLink/click preserve source semantics", async () => {
  const calls: string[] = [];
  const origin = {
    name: "safe <b>",
    href: "#breadcrumb-target",
    path: "route",
    key: "first",
    noLink: true,
    onClick: () => calls.push("item"),
  };
  const parent = vi.fn((info, event) => {
    calls.push("parent");
    expect(info).toBe(origin);
    expect(event).toBeInstanceOf(MouseEvent);
  });
  const input = shallowRef<BreadcrumbProps>({
    routes: [origin, { name: "last", href: "#last" }],
    onClick: parent,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-click");
      return (
        <section onClick={() => calls.push("outer")}>
          <Breadcrumb {...input.value} />
        </section>
      );
    }),
  );
  try {
    await settle();
    const root = fixture.host.querySelector("nav")!;
    expect(root.getAttribute("aria-label")).toBe("Breadcrumb");
    const a = root.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("#breadcrumb-target");
    expect(a.classList.contains("semi-breadcrumb-item-link")).toBe(false);
    expect(root.querySelector("b")).toBeNull();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(a.dispatchEvent(event)).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(calls).toEqual(["item", "parent", "outer"]);
    expect(
      root.querySelector('[aria-current="page"] > .semi-breadcrumb-item')
        ?.tagName,
    ).toBe("SPAN");
    expect(
      root.querySelector('[aria-current="page"] > span')?.getAttribute("href"),
    ).toBe("#last");
    for (const activeIndex of [0, 1, -1, NaN, null]) {
      input.value = {
        routes: [origin, { name: "last", href: "#last" }],
        activeIndex: activeIndex as number,
      };
      await settle();
      expect(root.querySelectorAll('[aria-current="page"]')).toHaveLength(
        activeIndex === 0 || activeIndex === 1 ? 1 : 0,
      );
      if (activeIndex === 0)
        expect(root.querySelector('[aria-current="page"]')?.textContent).toBe(
          "safe <b>/",
        );
    }
    input.value = {
      routes: [origin, { name: "last" }],
      activeIndex: undefined,
    };
    await settle();
    expect(root.querySelector('[aria-current="page"]')?.textContent).toBe(
      "last",
    );
  } finally {
    fixture.unmount();
  }
});
test("Breadcrumb root attributes are limited and Item BaseProps class/style stay upstream no-op", async () => {
  const fixture = fixtureFor(() => (
    <Breadcrumb
      aria-label="trail"
      class="vue"
      className="semi"
      data-test="root"
      style={{ marginTop: "3px" }}
      {...{ role: "list", title: "filtered", innerHTML: "<b>unsafe</b>" }}
    >
      {() => (
        <Breadcrumb.Item
          children="<img src=x>"
          class="ignored"
          className="ignored"
          data-test="item"
          style={{ color: "red" }}
        />
      )}
    </Breadcrumb>
  ));
  try {
    await settle();
    const root = fixture.host.querySelector("nav")!;
    expect(root.classList.contains("vue")).toBe(true);
    expect(root.classList.contains("semi")).toBe(true);
    expect(root.style.marginTop).toBe("3px");
    expect(root.getAttribute("aria-label")).toBe("trail");
    expect(root.getAttribute("data-test")).toBe("root");
    expect(root.hasAttribute("role")).toBe(false);
    expect(root.hasAttribute("title")).toBe(false);
    expect(root.querySelector("img,b")).toBeNull();
    const item = root.querySelector<HTMLElement>('[data-test="item"]')!;
    expect(item.className).toBe("semi-breadcrumb-item-wrap");
    expect(item.style.color).toBe("");
    expect(root.querySelector("[aria-live],[tabindex],[role]")).toBeNull();
  } finally {
    fixture.unmount();
  }
});
test("Breadcrumb separator truthiness, compact and defaults update and remove", async () => {
  const parent = shallowRef<BreadcrumbProps>({ separator: ">" });
  const item = shallowRef<BreadcrumbItemProps>({ separator: "!" });
  const fixture = fixtureFor(() => (
    <Breadcrumb {...parent.value}>
      {() => (
        <>
          <Breadcrumb.Item {...item.value} children="a" />
          <Breadcrumb.Item children="b" />
        </>
      )}
    </Breadcrumb>
  ));
  try {
    await settle();
    expect(fixture.host.textContent).toBe("a!b");
    for (const separator of [undefined, null, false, 0, ""]) {
      item.value = { separator };
      await settle();
      expect(fixture.host.textContent).toBe("a>b");
    }
    for (const separator of [null, false, 0, ""]) {
      parent.value = { separator, compact: false };
      await settle();
      expect(fixture.host.textContent).toBe(separator === 0 ? "a0b" : "ab");
      expect(
        fixture.host
          .querySelector("nav")
          ?.classList.contains("semi-breadcrumb-wrapper-loose"),
      ).toBe(true);
    }
    parent.value = { separator: undefined, compact: undefined };
    await settle();
    expect(fixture.host.textContent).toBe("a/b");
    expect(
      fixture.host
        .querySelector("nav")
        ?.classList.contains("semi-breadcrumb-wrapper-compact"),
    ).toBe(true);
    parent.value = {};
    await settle();
    expect(fixture.host.textContent).toBe("a/b");
  } finally {
    fixture.unmount();
  }
});
test("Breadcrumb counts source holes and preserves threshold coercion and Enter-only expansion", async () => {
  const routes = Array<RouteProps | string>(5);
  routes[1] = "one";
  routes[4] = "four";
  const input = shallowRef<BreadcrumbProps>({ routes, maxItemCount: 4 });
  const fixture = fixtureFor(() => <Breadcrumb {...input.value} />);
  try {
    await settle();
    expect(
      fixture.host.querySelector('[aria-current="page"]')?.textContent,
    ).toBe("four");
    expect(
      fixture.host.querySelector(".semi-breadcrumb-collapse"),
    ).not.toBeNull();
    expect(fixture.host.textContent).toBe("/four");
    input.value = { routes: ["0", "1", "2", "3", "4"], maxItemCount: 2.5 };
    await settle();
    expect(fixture.host.textContent).toBe("0//3/4");
    const more = fixture.host.querySelector<HTMLElement>(
      ".semi-breadcrumb-item-more",
    )!;
    more.dispatchEvent(
      new KeyboardEvent("keypress", { key: " ", bubbles: true }),
    );
    await settle();
    expect(
      fixture.host.querySelector(".semi-breadcrumb-collapse"),
    ).not.toBeNull();
    more.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    await settle();
    expect(
      fixture.host.querySelector(".semi-breadcrumb-collapse"),
    ).not.toBeNull();
    more.dispatchEvent(
      new KeyboardEvent("keypress", { key: "Enter", bubbles: true }),
    );
    await settle();
    expect(fixture.host.textContent).toBe("0/1/2/3/4");
    input.value = { routes: ["0", "1", "2", "3", "4", "5"], maxItemCount: 0 };
    await settle();
    expect(fixture.host.querySelector(".semi-breadcrumb-collapse")).toBeNull();
  } finally {
    fixture.unmount();
  }
  for (const maxItemCount of [0, -1, Infinity, -Infinity, NaN]) {
    const another = fixtureFor(() => (
      <Breadcrumb maxItemCount={maxItemCount} routes={["0", "1", "2"]} />
    ));
    try {
      await settle();
      expect(!!another.host.querySelector(".semi-breadcrumb-collapse")).toBe(
        maxItemCount === 0 || maxItemCount === -1 || maxItemCount === -Infinity,
      );
    } finally {
      another.unmount();
    }
  }
});
test("Breadcrumb nonempty route renderItem owns primitive output and original callback info", async () => {
  const origin = { key: "stable", name: "name", href: "#" };
  const value = shallowRef<unknown>("rendered");
  const render = shallowRef<BreadcrumbProps["renderItem"]>((route) => {
    expect(route).toBe(origin);
    return value.value as string;
  });
  const fixture = fixtureFor(() => (
    <Breadcrumb renderItem={render.value} routes={[origin]} />
  ));
  try {
    await settle();
    expect(fixture.host.querySelector(".semi-typography")?.textContent).toBe(
      "rendered",
    );
    for (const next of [null, false, 0, undefined, [], "changed"]) {
      value.value = next;
      render.value = (route) => {
        expect(route).toBe(origin);
        return next as string;
      };
      await settle();
      expect(fixture.host.textContent).toBe(
        next === "changed" ? "changed" : "",
      );
    }
    render.value = undefined;
    await settle();
    expect(fixture.host.textContent).toBe("name");
  } finally {
    fixture.unmount();
  }
});
test("Standalone Breadcrumb Item renders but click reports the missing parent after its own callback", async () => {
  const click = vi.fn();
  const props = shallowRef<BreadcrumbItemProps>({
    children: "alone",
    href: "#alone",
    onClick: click,
  });
  const host = document.createElement("div");
  document.body.append(host);
  const errors: unknown[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("breadcrumb-standalone");
      return <Breadcrumb.Item {...props.value} />;
    }),
  );
  app.config.errorHandler = (error) => {
    errors.push(error);
  };
  app.mount(host);
  const fixture = {
    host,
    unmount: () => {
      app.unmount();
      host.remove();
    },
  };
  try {
    await settle();
    expect(Breadcrumb.Item.isBreadcrumbItem).toBe(true);
    fixture.host.querySelector<HTMLElement>(".semi-breadcrumb-item")!.click();
    expect(click.mock.calls[0]?.[0]).toEqual({ name: "alone", href: "#alone" });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(TypeError);
    expect(
      fixture.host.querySelectorAll(".semi-breadcrumb-separator"),
    ).toHaveLength(1);
    props.value = { children: 0, active: true, shouldRenderSeparator: false };
    await settle();
    expect(fixture.host.textContent).toBe("");
    expect(
      fixture.host.querySelectorAll(".semi-breadcrumb-separator"),
    ).toHaveLength(0);
    expect(fixture.host.querySelector('[aria-current="page"]')).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});
