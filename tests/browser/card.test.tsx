import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import Card from "../../packages/semi-ui-vue/src/components/card/index.js";
import CardGroup from "../../packages/semi-ui-vue/src/components/card/cardGroup.js";
import type {
  CardProps,
  MetaProps,
} from "../../packages/semi-ui-vue/src/components/card/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Card defaults, undefined, null, header priority and runtime truthiness follow the source", async () => {
  const input = shallowRef<CardProps>({
    title: "Title",
    children: "Body",
    footer: "Footer",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("card-test");
      return <Card {...input.value} />;
    }),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-card")!;
    expect(root.classList.contains("semi-card-bordered")).toBe(true);
    expect(root.getAttribute("aria-busy")).toBe("false");
    expect(root.querySelector("h6")?.textContent).toBe("Title");
    expect(root.querySelector(".semi-card-header-bordered")).not.toBeNull();
    expect(root.querySelector(".semi-card-footer-bordered")).toBeNull();
    input.value = {
      title: "unused",
      header: "Header",
      headerExtraContent: "unused",
      bordered: undefined,
      headerLine: undefined,
      footerLine: true,
      footer: "Footer",
      shadows: "hover",
    };
    await nextTick();
    expect(root.querySelector(".semi-card-header")?.textContent).toBe("Header");
    expect(root.querySelector(".semi-card-header-wrapper")).toBeNull();
    expect(root.querySelector(".semi-card-footer-bordered")).not.toBeNull();
    expect(root.classList.contains("semi-card-shadows-hover")).toBe(true);
    input.value = {
      title: 0,
      headerExtraContent: "Extra",
      cover: 0,
      children: 0,
      footer: 0,
      actions: [],
      bordered: null,
      loading: null,
      headerLine: null,
    } as unknown as CardProps;
    await nextTick();
    expect(root.querySelector(".semi-card-header")?.textContent).toBe("Extra0");
    expect(root.querySelector(".semi-card-body")?.textContent).toBe("0");
    expect(root.querySelector(".semi-card-cover")).toBeNull();
    expect(root.querySelector(".semi-card-footer")).toBeNull();
    expect(root.querySelector(".semi-card-body-actions")).not.toBeNull();
    expect(root.textContent).toBe("Extra0000");
    expect(root.hasAttribute("aria-busy")).toBe(false);
    expect(root.classList.contains("semi-card-bordered")).toBe(false);
    input.value = {};
    await nextTick();
    expect(root.textContent).toBe("");
    expect(root.classList.contains("semi-card-bordered")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test.each([undefined, null, false, "", 0, Number.NaN])(
  "Card preserves raw falsy content %s without wrappers",
  (value) => {
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Card
          children={value}
          cover={value}
          footer={value}
          header={value}
          headerExtraContent={value}
          title={value}
        />
      )),
    );
    try {
      expect(fixture.host.querySelector(".semi-card-header")).toBeNull();
      expect(fixture.host.querySelector(".semi-card-cover")).toBeNull();
      expect(fixture.host.querySelector(".semi-card-footer")).toBeNull();
      expect(fixture.host.textContent).toBe(
        typeof value === "number" ? String(value).repeat(3) : "",
      );
    } finally {
      fixture.unmount();
    }
  },
);

test("Card actions preserve empty arrays, item markers, literal content and array replacement", async () => {
  const actions = shallowRef<CardProps["actions"]>([
    "<action>",
    0,
    false,
    () => <button>Go</button>,
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => <Card actions={actions.value} />),
  );
  try {
    expect(
      fixture.host.querySelectorAll(".semi-card-body-actions-item"),
    ).toHaveLength(4);
    expect(
      fixture.host.querySelector('[x-semi-prop="actions.1"]')?.textContent,
    ).toBe("0");
    expect(fixture.host.querySelector("action")).toBeNull();
    expect(
      fixture.host.querySelector<HTMLElement>(".semi-space")?.style.columnGap,
    ).toBe("12px");
    actions.value = [];
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-card-body-actions"),
    ).not.toBeNull();
    expect(
      fixture.host.querySelectorAll(".semi-card-body-actions-item"),
    ).toHaveLength(0);
    actions.value = "invalid" as unknown as CardProps["actions"];
    await nextTick();
    expect(fixture.host.querySelector(".semi-card-body-actions")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Card.Meta preserves wrapper gating, raw zero avatar and title/description values", async () => {
  const props = shallowRef<MetaProps>({
    avatar: 0,
    title: 0,
    description: "Description",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Card.Meta {...props.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("00Description");
    expect(fixture.host.querySelector(".semi-card-meta-avatar")).toBeNull();
    expect(
      fixture.host.querySelector(".semi-card-meta-wrapper-title"),
    ).toBeNull();
    props.value = { avatar: "Avatar", title: "Title", description: 0 };
    await nextTick();
    expect(fixture.host.textContent).toBe("AvatarTitle0");
    props.value = { avatar: Number.NaN, title: 0, description: false };
    await nextTick();
    expect(fixture.host.textContent).toBe("NaN");
    expect(fixture.host.querySelector(".semi-card-meta-wrapper")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("CardGroup uses source default16, grid zero and private Space overrides with data-only attributes", async () => {
  const props = shallowRef<Record<string, unknown>>({
    id: "ignored",
    role: "list",
    "aria-label": "ignored",
    "data-test": "group",
  });
  const click = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <CardGroup
        {...props.value}
        {...({ onClick: click } as unknown as Record<string, unknown>)}
      >
        {() => <Card children="Card" />}
      </CardGroup>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-card-group")!;
    expect(root.style.columnGap).toBe("16px");
    expect(root.classList.contains("semi-space-wrap")).toBe(true);
    expect(root.dataset.test).toBe("group");
    expect(root.hasAttribute("id")).toBe(false);
    expect(root.hasAttribute("role")).toBe(false);
    expect(root.hasAttribute("aria-label")).toBe(false);
    root.click();
    expect(click).not.toHaveBeenCalled();
    props.value = {
      spacing: [4, 8],
      wrap: false,
      align: "end",
      vertical: true,
    };
    await nextTick();
    expect(root.style.columnGap).toBe("4px");
    expect(root.style.rowGap).toBe("8px");
    expect(root.classList.contains("semi-space-vertical")).toBe(true);
    expect(root.classList.contains("semi-space-align-end")).toBe(true);
    expect(root.classList.contains("semi-space-wrap")).toBe(false);
    props.value = { type: "grid", spacing: 40 };
    await nextTick();
    expect(root.style.columnGap).toBe("0px");
    expect(root.classList.contains("semi-card-group-grid")).toBe(true);
    props.value = { spacing: null };
    await nextTick();
    expect(root.style.columnGap).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("CardGroup accepts native class arrays and objects without coercion", () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <CardGroup
        class={["alias", { enabled: true, disabled: false }]}
        className="custom"
      />
    )),
  );
  try {
    const root = fixture.host.querySelector(".semi-card-group")!;
    expect(root.classList.contains("alias")).toBe(true);
    expect(root.classList.contains("enabled")).toBe(true);
    expect(root.classList.contains("disabled")).toBe(false);
    expect(root.classList.contains("custom")).toBe(true);
    expect(root.className).not.toContain("object");
  } finally {
    fixture.unmount();
  }
});

test.each(["card", "meta"] as const)(
  "Card %s forwards safe attrs/events and blocks destructive HTML aliases",
  async (kind) => {
    const outer = vi.fn();
    const click = vi.fn();
    const attrs = shallowRef<Record<string, unknown>>({
      id: "safe",
      "data-label": "one",
      role: "region",
      "aria-label": "Label",
      tabIndex: 0,
      onClick: click,
      "inner-html": "<script>unsafe</script>",
      outerHTML: "<i>bad</i>",
      "outer-html": "<i>bad</i>",
      "text-content": "bad",
    });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <section onClick={outer}>
          {kind === "card" ? (
            <Card
              {...attrs.value}
              className="custom"
              style={{ padding: "3px" }}
            >
              {() => <button>content</button>}
            </Card>
          ) : (
            <Card.Meta
              {...attrs.value}
              className="custom"
              style={{ padding: "3px" }}
              title={() => <button>content</button>}
            />
          )}
        </section>
      )),
    );
    try {
      const root = fixture.host.querySelector<HTMLElement>(
        kind === "card" ? ".semi-card" : ".semi-card-meta",
      )!;
      expect(root.textContent).toBe("content");
      expect(root.id).toBe("safe");
      expect(root.getAttribute("aria-label")).toBe("Label");
      expect(root.getAttribute("role")).toBe("region");
      expect(root.style.padding).toBe("3px");
      for (const key of [
        "inner-html",
        "outer-html",
        "outerHTML",
        "text-content",
      ])
        expect(root.hasAttribute(key)).toBe(false);
      root.querySelector("button")!.click();
      expect(click).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenCalledTimes(1);
      attrs.value = { "data-label": "two" };
      await nextTick();
      expect(root.hasAttribute("id")).toBe(false);
      expect(root.dataset.label).toBe("two");
    } finally {
      fixture.unmount();
    }
  },
);

test("CardGroup runtime className arrays and objects retain source classnames behavior", () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <CardGroup
        class="alias"
        {...({
          className: ["custom", { enabled: true, disabled: false }],
        } as unknown as Record<string, unknown>)}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector(".semi-card-group")!;
    expect(root.classList.contains("custom")).toBe(true);
    expect(root.classList.contains("enabled")).toBe(true);
    expect(root.classList.contains("disabled")).toBe(false);
    expect(root.classList.contains("alias")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Card DOM listeners retain callable arrays while rejecting string and mixed listener payloads", () => {
  const first = vi.fn();
  const second = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Card
        {...({
          onClick: [first, second],
          onMouseenter: "dangerous()",
          onMouseleave: [first, "bad"],
          ".innerHTML": "<b>unsafe</b>",
          "^outer-text": "bad",
        } as unknown as Record<string, unknown>)}
        children="Safe"
      />
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-card")!;
    expect(root.textContent).toBe("Safe");
    root.click();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    root.dispatchEvent(new MouseEvent("mouseleave"));
    expect(first).toHaveBeenCalledTimes(1);
    expect(root.hasAttribute("onmouseenter")).toBe(false);
    expect(root.querySelector("b")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Card title/extra spacing, style removal, source loading coercion and owned aria-busy precedence update", async () => {
  const input = shallowRef<CardProps>({
    title: () => <b>Title</b>,
    headerExtraContent: "Extra",
    bodyStyle: { padding: "2px" },
    headerStyle: { padding: "3px" },
    footer: "Footer",
    footerStyle: { padding: "4px" },
    style: { margin: "5px" },
    loading: true,
    "aria-busy": false,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Card {...input.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-card")!;
    expect(root.getAttribute("aria-busy")).toBe("true");
    expect(
      root.querySelector(".semi-card-header-wrapper-spacing"),
    ).not.toBeNull();
    expect(
      root.querySelector<HTMLElement>(".semi-card-body")!.style.padding,
    ).toBe("2px");
    expect(
      root.querySelector<HTMLElement>(".semi-card-header")!.style.padding,
    ).toBe("3px");
    expect(
      root.querySelector<HTMLElement>(".semi-card-footer")!.style.padding,
    ).toBe("4px");
    expect(root.style.margin).toBe("5px");
    expect(root.querySelector(".semi-skeleton")).toBeNull();
    input.value = {
      title: () => <b>Title</b>,
      loading: undefined,
      "aria-busy": true,
    };
    await nextTick();
    expect(root.getAttribute("aria-busy")).toBe("false");
    expect(root.style.margin).toBe("");
    expect(
      root.querySelector<HTMLElement>(".semi-card-body")!.style.padding,
    ).toBe("");
    expect(
      root.querySelector<HTMLElement>(".semi-card-header")!.style.padding,
    ).toBe("");
    expect(root.querySelector(".semi-card-header-wrapper-spacing")).toBeNull();
    input.value = {
      children: "Body",
      loading: "yes",
      bordered: 0,
      shadows: "custom",
    } as unknown as CardProps;
    await nextTick();
    expect(root.getAttribute("aria-busy")).toBe("yes");
    expect(root.classList.contains("semi-card-bordered")).toBe(false);
    expect(root.classList.contains("semi-card-shadows-custom")).toBe(true);
    expect(root.querySelector(".semi-skeleton-active")).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});
