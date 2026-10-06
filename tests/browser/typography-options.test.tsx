import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import Title from "../../packages/semi-ui-vue/src/components/typography/title.js";
import Paragraph from "../../packages/semi-ui-vue/src/components/typography/paragraph.js";
import {
  cssEllipsis,
  ellipsisOptions,
  typographyPopover,
} from "../../packages/semi-ui-vue/src/components/typography/input.js";
import type {
  Ellipsis,
  ParagraphProps,
  TextProps,
  TitleProps,
} from "../../packages/semi-ui-vue/src/components/typography/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Typography option spreads preserve explicit undefined, null and exceptional native runtime inputs", () => {
  expect(ellipsisOptions(false, "more", "less")).toEqual({});
  const defaultOptions = ellipsisOptions(true, "more", "less");
  expect(defaultOptions).toMatchObject({
    rows: 1,
    pos: "end",
    suffix: "",
    expandable: false,
    collapsible: false,
  });
  expect(cssEllipsis(false, defaultOptions)).toBe(true);
  expect(cssEllipsis(true, defaultOptions)).toBe(false);
  const options = ellipsisOptions(
    {
      expandable: true,
      collapsible: true,
      rows: undefined,
      pos: undefined,
      suffix: undefined,
    },
    "more",
    "less",
  );
  expect(options).toMatchObject({
    expandText: "more",
    collapseText: "less",
    rows: undefined,
    pos: undefined,
    suffix: undefined,
  });
  expect(cssEllipsis(false, options)).toBe(false);
  for (const suffix of [undefined, null])
    expect(() =>
      cssEllipsis(false, { ...defaultOptions, suffix } as Ellipsis),
    ).toThrow(TypeError);
  expect(cssEllipsis(false, { ...defaultOptions, expandText: "" })).toBe(false);
  for (const type of [undefined, null, 42]) {
    expect(typographyPopover(type as string | undefined, false)).toBe(false);
    expect(() => typographyPopover(type as string | undefined, true)).toThrow(
      TypeError,
    );
  }
  expect(typographyPopover("PoPoVeR", true)).toBe(true);
  expect(typographyPopover("tooltip", true)).toBe(false);
});

test("Typography style classes and semantic overrides update without inventing accessibility attributes", async () => {
  const text = shallowRef<TextProps>({ children: "plain" });
  const title = shallowRef<TitleProps>({ children: "heading" });
  const paragraph = shallowRef<ParagraphProps>({ children: "paragraph" });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Text {...text.value} />
        <Title {...title.value} />
        <Paragraph {...paragraph.value} />
      </>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>("span")!;
    for (const name of ["role", "tabindex", "aria-live", "aria-label"])
      expect(root.hasAttribute(name)).toBe(false);
    for (const type of [
      "primary",
      "secondary",
      "danger",
      "warning",
      "success",
      "tertiary",
      "quaternary",
    ] as const) {
      text.value = { children: "plain", type };
      await nextTick();
      expect(root.classList.contains(`semi-typography-${type}`)).toBe(true);
    }
    text.value = {
      children: "styled",
      size: "small",
      weight: 700,
      style: { fontWeight: 400 },
      className: "extra",
      underline: true,
    };
    await nextTick();
    expect(root.querySelector("u")?.textContent).toBe("styled");
    expect(root.style.fontWeight).toBe("400");
    expect(root.className).toContain("extra");
    expect(root.className).toContain("small");
    text.value = {
      children: "plain",
      type: null,
      size: null,
      weight: null,
    } as unknown as TextProps;
    await nextTick();
    expect(root.className).not.toContain("semi-typography-primary");
    expect(root.style.fontWeight).toBe("");
    text.value = { children: "plain", type: undefined, size: undefined };
    await nextTick();
    expect(root.className).toContain("semi-typography-primary");
    expect(root.className).toContain("semi-typography-normal");
    for (const heading of [1, 2, 3, 4, 5, 6] as const) {
      title.value = { children: "heading", heading, weight: "bold" };
      await nextTick();
      const node = fixture.host.querySelector(`h${heading}`)!;
      expect(node.className).toContain(
        `semi-typography-h${heading}-weight-bold`,
      );
    }
    title.value = {
      children: "override",
      heading: 99,
      component: "div",
      weight: 500,
    } as unknown as TitleProps;
    await nextTick();
    const custom = fixture.host.querySelector<HTMLElement>(
      "div.semi-typography",
    )!;
    expect(custom.className).toContain("semi-typography-h1");
    expect(custom.style.fontWeight).toBe("500");
    paragraph.value = { children: "p", spacing: "extended", size: "small" };
    await nextTick();
    expect(fixture.host.querySelector("p")!.className).toContain(
      "semi-typography-extended",
    );
  } finally {
    fixture.unmount();
  }
});

test("Typography inherited size and nested raw content keep their independent roots", () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Text size="small">
        {() => (
          <>
            <Text children="child" size="inherit" />
            <Text children="normal" />
          </>
        )}
      </Text>
    )),
  );
  try {
    const roots = fixture.host.querySelectorAll(".semi-typography");
    expect(roots).toHaveLength(3);
    expect(roots[1]!.className).toContain("small");
    expect(roots[2]!.className).toContain("normal");
  } finally {
    fixture.unmount();
  }
});

test("Typography JS ellipsis preserves explicit undefined pos and fractional rows instead of applying defaults", async () => {
  const props = shallowRef<TextProps>({
    children: "abcdef".repeat(60),
    ellipsis: { pos: undefined, suffix: "!" },
    style: { display: "block", width: "130px", font: "16px/24px monospace" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Text {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    await expect.poll(() => root.textContent!.includes("...")).toBe(true);
    expect(root.textContent!.split("...")[1]).not.toBe("!");
    props.value = { ...props.value, ellipsis: { rows: 0.5, suffix: "!" } };
    await expect.poll(() => root.textContent!.includes("...")).toBe(true);
    expect(root.textContent!.length).toBeLessThan("abcdef".repeat(60).length);
    expect(root.textContent!.endsWith("!")).toBe(true);
    for (const rows of [0, -1, null, undefined]) {
      props.value = {
        ...props.value,
        ellipsis: { rows, suffix: "!" } as Ellipsis,
      };
      await expect.poll(() => root.textContent).toBe("abcdef".repeat(60) + "!");
    }
  } finally {
    fixture.unmount();
  }
});

test("Typography empty JS content short-circuits undefined and null suffix before accessing length", async () => {
  const props = shallowRef<TextProps>({
    children: "",
    copyable: { render: () => <button>copy</button> },
    ellipsis: { suffix: undefined },
    style: { display: "block", width: "100px" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Text {...props.value} />),
  );
  try {
    for (const suffix of [undefined, null]) {
      props.value = { ...props.value, ellipsis: { suffix } as Ellipsis };
      await nextTick();
      await new Promise<void>((done) => requestAnimationFrame(() => done()));
      await nextTick();
      expect(
        fixture.host.querySelector(".semi-typography-ellipsis-expand"),
      ).toBeNull();
      expect(fixture.host.textContent).toBe("copy");
    }
  } finally {
    fixture.unmount();
  }
});

test("Typography leaf wrappers preserve owned slots under custom native tags and dynamic undefined defaults", async () => {
  const text = shallowRef<TextProps>({ component: "label" });
  const paragraph = shallowRef<ParagraphProps>({
    component: "section",
    className: "custom",
  });
  const title = shallowRef<TitleProps>({ component: "header", heading: 2 });
  const value = shallowRef("first");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Text {...text.value}>{() => <input value={value.value} />}</Text>
        <Paragraph {...paragraph.value}>{() => <b>{value.value}</b>}</Paragraph>
        <Title {...title.value}>{() => <i>{value.value}</i>}</Title>
      </>
    )),
  );
  try {
    const input = fixture.host.querySelector("input")!;
    input.focus();
    value.value = "next";
    await nextTick();
    expect(fixture.host.querySelector("input")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(
      fixture.host.querySelector("label input")!.getAttribute("value"),
    ).toBe("next");
    expect(input.value).toBe("next");
    expect(fixture.host.querySelector("section b")?.textContent).toBe("next");
    expect(fixture.host.querySelector("header i")?.textContent).toBe("next");
    text.value = { component: undefined };
    paragraph.value = { component: undefined, className: undefined };
    title.value = { component: undefined, heading: undefined };
    await nextTick();
    expect(fixture.host.querySelector("article input")).not.toBeNull();
    expect(fixture.host.querySelector("article b")).not.toBeNull();
    expect(fixture.host.querySelector("article i")).not.toBeNull();
    expect(fixture.host.querySelector(".custom")).toBeNull();
    text.value = {};
    paragraph.value = {};
    title.value = {};
    await nextTick();
    expect(fixture.host.querySelector("span input")).not.toBeNull();
    expect(fixture.host.querySelector("p b")).not.toBeNull();
    expect(fixture.host.querySelector("h1 i")).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Typography null link leaves strong decoration intact through dynamic removal", async () => {
  const link = shallowRef<TextProps["link"]>(
    null as unknown as TextProps["link"],
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Text children="strong text" link={link.value} strong />
    )),
  );
  try {
    expect(fixture.host.querySelector("strong")?.textContent).toBe(
      "strong text",
    );
    expect(fixture.host.querySelector("a")).toBeNull();
    link.value = { href: "#target" };
    await nextTick();
    expect(fixture.host.querySelector("a strong")?.textContent).toBe(
      "strong text",
    );
    link.value = undefined;
    await nextTick();
    expect(fixture.host.querySelector("a")).toBeNull();
    expect(fixture.host.querySelector("strong")?.textContent).toBe(
      "strong text",
    );
  } finally {
    fixture.unmount();
  }
});
