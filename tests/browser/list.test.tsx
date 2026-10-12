import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import List from "../../packages/semi-ui-vue/src/components/list/index.js";
import type { ListProps } from "../../packages/semi-ui-vue/src/components/list/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("List restores undefined defaults, appends children after data, and loading keeps content", async () => {
  const input = shallowRef<ListProps<string>>({
    dataSource: ["a", "b"],
    renderItem: (item, index) => <List.Item main={`${index}:${item}`} />,
    children: "tail",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <List {...input.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-list")!;
    expect([...root.classList].sort()).toEqual([
      "semi-list",
      "semi-list-default",
      "semi-list-split",
    ]);
    expect(root.textContent).toBe("0:a1:btail");
    const item = root.querySelector("li");
    input.value = {
      ...input.value,
      loading: true,
      layout: "horizontal",
      bordered: true,
      size: "large",
    };
    await nextTick();
    expect(root.querySelector("li")).toBe(item);
    expect(root.querySelector(".semi-spin-wrapper")).not.toBeNull();
    expect(root.classList.contains("semi-list-flex")).toBe(true);
    input.value = {
      size: undefined,
      split: undefined,
      loading: undefined,
      children: 0,
    };
    await nextTick();
    expect([...root.classList].sort()).toEqual([
      "semi-list",
      "semi-list-default",
      "semi-list-split",
    ]);
    expect(root.querySelector(".semi-list-empty")?.textContent).toBe(
      "暂无数据",
    );
    expect(root.textContent).toBe("暂无数据0");
    input.value = {
      size: null,
      split: null,
      bordered: null,
      layout: null,
    } as unknown as ListProps<string>;
    await nextTick();
    expect(root.className).toBe("semi-list");
    input.value = {};
    await nextTick();
    expect([...root.classList].sort()).toEqual([
      "semi-list",
      "semi-list-default",
      "semi-list-split",
    ]);
  } finally {
    fixture.unmount();
  }
});

test("List.Item inherits click and contextmenu with own truthy precedence and ordinary bubbling", async () => {
  const parent = vi.fn();
  const own = vi.fn();
  const outer = vi.fn();
  const right = vi.fn();
  const input = shallowRef<Record<string, unknown>>({});
  const extra = () => <button>action</button>;
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section onClick={outer}>
        <List onClick={parent} onRightClick={right}>
          {() => (
            <List.Item
              {...input.value}
              extra={extra}
              header="head"
              main="main"
            />
          )}
        </List>
      </section>
    )),
  );
  try {
    const button = fixture.host.querySelector<HTMLButtonElement>("button")!;
    button.click();
    expect(parent).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
    input.value = { onClick: own, align: "center" };
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(
      fixture.host.querySelector(".semi-list-item-body-center"),
    ).not.toBeNull();
    button.click();
    expect(own).toHaveBeenCalledTimes(1);
    expect(parent).toHaveBeenCalledTimes(1);
    button.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
    expect(right).toHaveBeenCalledTimes(1);
    expect(
      fixture.host.querySelector(".semi-list-item-body-center"),
    ).not.toBeNull();
    input.value = { onClick: null, align: null };
    await nextTick();
    button.click();
    expect(parent).toHaveBeenCalledTimes(2);
    expect(fixture.host.querySelector(".semi-list-item-body")?.className).toBe(
      "semi-list-item-body",
    );
  } finally {
    fixture.unmount();
  }
});

test.each([undefined, null, false, 0, "", NaN])(
  "List truthy wrappers discard %s while children remain raw",
  (value) => {
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <List
          children={value}
          emptyContent={value}
          footer={value}
          header={value}
          loadMore={value}
        />
      )),
    );
    try {
      expect(
        fixture.host.querySelector(".semi-list-header,.semi-list-footer"),
      ).toBeNull();
      expect(fixture.host.querySelector(".semi-list-empty")?.textContent).toBe(
        "暂无数据",
      );
      expect(fixture.host.textContent).toBe(
        `暂无数据${typeof value === "number" ? String(value) : ""}`,
      );
    } finally {
      fixture.unmount();
    }
  },
);

test("List and Item keep truthy empty wrappers, data-only attrs, escaped text and no invented roles", async () => {
  const props = shallowRef<Record<string, unknown>>({
    header: [],
    footer: [],
    loadMore: [],
    "data-test": "list",
    id: "ignored",
    role: "list",
    "aria-live": "polite",
    innerHTML: "bad",
  });
  const enter = vi.fn();
  const leave = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <List
        {...props.value}
        class="alias"
        className="custom"
        style={{ margin: "2px" }}
      >
        {() => (
          <List.Item
            {...({
              "data-test": "item",
              id: "ignored",
              role: "button",
              tabIndex: 0,
              innerHTML: "bad",
              header: [],
              main: [],
              extra: [],
            } as unknown as Record<string, unknown>)}
            children="<script>literal</script>"
            class="item-alias"
            className="item-custom"
            onMouseEnter={enter}
            onMouseLeave={leave}
          />
        )}
      </List>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-list")!;
    const item = root.querySelector<HTMLLIElement>("li")!;
    expect(root.querySelector(".semi-list-header")).not.toBeNull();
    expect(root.querySelector(".semi-list-footer")).not.toBeNull();
    expect(root.querySelector(".semi-list-item-body-header")).not.toBeNull();
    expect(root.querySelector(".semi-list-item-body-main")).not.toBeNull();
    expect(root.querySelector(".semi-list-item-extra")).not.toBeNull();
    expect(root.textContent).toBe("<script>literal</script>");
    expect(root.querySelector("script")).toBeNull();
    expect(root.dataset.test).toBe("list");
    expect(item.dataset.test).toBe("item");
    expect(root.style.margin).toBe("2px");
    expect(root.classList.contains("alias")).toBe(true);
    expect(item.classList.contains("item-alias")).toBe(true);
    for (const target of [root, item])
      for (const attr of ["id", "role", "aria-live", "tabindex", "innerHTML"])
        expect(target.hasAttribute(attr)).toBe(false);
    item.dispatchEvent(new MouseEvent("mouseenter"));
    item.dispatchEvent(new MouseEvent("mouseleave"));
    expect(enter).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);
    props.value = {};
    await nextTick();
    expect(root.hasAttribute("data-test")).toBe(false);
    expect(root.querySelector(".semi-list-header")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("List grid routes four Row fields and remaining Col props, then restores ul", async () => {
  const props = shallowRef<ListProps>({
    grid: {
      gutter: [16, 8],
      span: 12,
      xs: 24,
      align: "middle",
      justify: "center",
      style: { paddingLeft: "3px" },
      className: "column",
    },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <List {...props.value}>{() => <List.Item main="grid" />}</List>
    )),
  );
  try {
    const root = fixture.host.querySelector(".semi-list")!;
    const row = root.querySelector<HTMLElement>(".semi-row-flex")!;
    const col = row.querySelector<HTMLElement>(".semi-col")!;
    expect(root.querySelector("ul")).toBeNull();
    expect(col.querySelector("li")?.textContent).toBe("grid");
    expect(row.classList.contains("semi-row-flex-middle")).toBe(true);
    expect(row.classList.contains("semi-row-flex-center")).toBe(true);
    expect(row.style.marginLeft).toBe("-8px");
    expect(col.style.paddingLeft).toBe("3px");
    expect(col.style.paddingRight).toBe("8px");
    expect(col.classList.contains("semi-col-12")).toBe(true);
    expect(col.classList.contains("semi-col-xs-24")).toBe(true);
    expect(col.classList.contains("column")).toBe(true);
    props.value = { grid: { type: undefined } };
    await nextTick();
    expect(root.querySelector(".semi-row")).not.toBeNull();
    expect(root.querySelector(".semi-row-flex")).toBeNull();
    props.value = { grid: {} };
    await nextTick();
    expect(root.querySelector(".semi-row-flex")).not.toBeNull();
    props.value = {};
    await nextTick();
    expect(root.querySelector(".semi-list-items > li")).not.toBeNull();
    expect(root.querySelector(".semi-col")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("List nested context isolates callbacks and standalone Item is rejected", () => {
  const outer = vi.fn();
  const inner = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <List onClick={outer}>
        {() => <List onClick={inner}>{() => <List.Item main="nested" />}</List>}
      </List>
    )),
  );
  try {
    fixture.host.querySelector<HTMLLIElement>("li")!.click();
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  } finally {
    fixture.unmount();
  }
  const host = document.createElement("div");
  const app = createVaporApp(defineVaporComponent(() => <List.Item />));
  const errors: unknown[] = [];
  const warnings: string[] = [];
  app.config.errorHandler = (error) => errors.push(error);
  app.config.warnHandler = (warning) => warnings.push(warning);
  try {
    app.mount(host);
    expect(String(errors[0])).toMatch(/inside List/);
    expect(warnings.every((warning) => warning.includes("non-block"))).toBe(
      true,
    );
  } finally {
    app.unmount();
  }
});

test.each(["header", "footer", "loadMore"] as const)(
  "List %s stays outside its own item context provider",
  (name) => {
    const outer = vi.fn();
    const inner = vi.fn();
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <List onClick={outer}>
          {() => (
            <List
              onClick={inner}
              v-slots={{
                [name]: () => <List.Item main="outside" />,
                default: () => <List.Item main="inside" />,
              }}
            />
          )}
        </List>
      )),
    );
    try {
      const items = [...fixture.host.querySelectorAll<HTMLLIElement>("li")];
      items.find((item) => item.textContent === "outside")!.click();
      expect(outer).toHaveBeenCalledTimes(1);
      expect(inner).not.toHaveBeenCalled();
      items.find((item) => item.textContent === "inside")!.click();
      expect(outer).toHaveBeenCalledTimes(1);
      expect(inner).toHaveBeenCalledTimes(1);
    } finally {
      fixture.unmount();
    }
  },
);

test.each([false, 0, "", null, undefined])(
  "List item runtime falsy callbacks %s remain inactive",
  (value) => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createVaporApp(
      defineVaporComponent(() => (
        <List
          {...({ onClick: value, onRightClick: value } as unknown as Record<
            string,
            unknown
          >)}
        >
          {() => (
            <List.Item
              {...({
                onMouseEnter: value,
                onMouseLeave: value,
              } as unknown as Record<string, unknown>)}
              main="inactive"
            />
          )}
        </List>
      )),
    );
    const errors: unknown[] = [];
    app.config.errorHandler = (error) => errors.push(error);
    try {
      app.mount(host);
      const item = host.querySelector<HTMLLIElement>("li")!;
      for (const event of ["click", "contextmenu", "mouseenter", "mouseleave"])
        item.dispatchEvent(new MouseEvent(event, { bubbles: true }));
      expect(errors).toEqual([]);
    } finally {
      app.unmount();
      host.remove();
    }
  },
);

test.each([0, 15])(
  "List preserves loading truthiness and inherited invalid-falsy delay behavior (delay=%s)",
  async (delay) => {
    const { semiGlobal } =
      await import("../../packages/semi-ui-vue/src/context/index.js");
    semiGlobal.configure({ overrideDefaultProps: { Spin: { delay } } });
    try {
      for (const loading of [
        undefined,
        null,
        false,
        0,
        NaN,
        "",
        true,
        1,
        -1,
        "yes",
        {},
        [],
      ]) {
        const fixture = mountVapor(
          defineVaporComponent(() => (
            <List
              {...({ loading } as unknown as Record<string, unknown>)}
              children="retained"
            />
          )),
        );
        try {
          const busy = () => !!fixture.host.querySelector(".semi-spin-wrapper");
          const expected =
            !!loading ||
            (delay > 0 && loading !== false && loading !== undefined);
          expect(busy(), `loading=${String(loading)}`).toBe(expected);
          if (delay) await new Promise((resolve) => setTimeout(resolve, 30));
          expect(busy(), `settled loading=${String(loading)}`).toBe(expected);
          expect(
            fixture.host.querySelector(".semi-list-items")?.textContent,
          ).toBe("retained");
        } finally {
          fixture.unmount();
        }
      }
    } finally {
      semiGlobal.configure({});
    }
  },
);
