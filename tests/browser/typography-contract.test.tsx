import {
  createApp,
  defineComponent,
  defineVaporComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  vaporInteropPlugin,
} from "vue";
import { expect, test, vi } from "vitest";
import { Typography as RootTypography } from "../../packages/semi-ui-vue/src/index.js";
import Typography from "../../packages/semi-ui-vue/src/components/typography/index.js";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import Title from "../../packages/semi-ui-vue/src/components/typography/title.js";
import Paragraph from "../../packages/semi-ui-vue/src/components/typography/paragraph.js";
import Numeral from "../../packages/semi-ui-vue/src/components/typography/numeral.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import {
  cssEllipsis,
  typographyPopover,
  ellipsisOptions,
  safeTypographyAttrs,
  validateContent,
} from "../../packages/semi-ui-vue/src/components/typography/input.js";
import { nativeTypographyContent } from "../../packages/semi-ui-vue/src/components/typography/render.js";
import type {
  TypographyContent,
  TypographyProps,
  TypographyRenderResult,
  TypographySlots,
} from "../../packages/semi-ui-vue/src/components/typography/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Typography root entry and static members share exact component identities", () => {
  expect(RootTypography).toBe(Typography);
  expect(Typography.Text).toBe(Text);
  expect(Typography.Title).toBe(Title);
  expect(Typography.Paragraph).toBe(Paragraph);
  expect(Typography.Numeral).toBe(Numeral);
});

test("Typography captures global container defaults while live undefined and removal restore the capture", async () => {
  const previous = semiGlobal.config;
  const props = shallowRef<TypographyProps>({ children: "first" });
  semiGlobal.configure({
    overrideDefaultProps: {
      Typography: {
        component: "section",
        className: "captured",
        style: { color: "red" },
      },
    },
  });
  const one = mountVapor(
    defineVaporComponent(() => (
      <Typography {...props.value} data-instance="one" />
    )),
  );
  let two: ReturnType<typeof mountVapor> | undefined;
  try {
    const root = one.host.querySelector<HTMLElement>("section")!;
    expect(root.className).toBe("semi-typography captured");
    expect(root.style.color).toBe("red");
    semiGlobal.configure({
      overrideDefaultProps: {
        Typography: {
          component: "aside",
          className: "later",
          style: { color: "blue" },
        },
      },
    });
    props.value = {
      children: "second",
      className: undefined,
      style: undefined,
      component: undefined,
    };
    await nextTick();
    expect(one.host.querySelector("section")).toBe(root);
    expect(root.textContent).toBe("second");
    expect(root.className).toBe("semi-typography captured");
    props.value = {
      children: 0,
      className: "caller",
      style: { color: "green" },
    };
    await nextTick();
    expect(root.textContent).toBe("0");
    expect(root.classList.contains("caller")).toBe(true);
    expect(root.style.color).toBe("green");
    props.value = { children: "removed" };
    await nextTick();
    expect(root.className).toBe("semi-typography captured");
    expect(root.style.color).toBe("red");
    two = mountVapor(
      defineVaporComponent(() => (
        <>
          <Typography children="new" />
          <Text children="base-independent" />
        </>
      )),
    );
    expect(two.host.querySelector("aside")?.classList.contains("later")).toBe(
      true,
    );
    const text = two.host.querySelector("span.semi-typography")!;
    expect(text.textContent).toBe("base-independent");
    expect(text.classList.contains("later")).toBe(false);
  } finally {
    one.unmount();
    two?.unmount();
    semiGlobal.configure(previous);
  }
});

test("Typography forwardRef tracks actual DOM replacement and cleanup while tooltipRef stays internal", async () => {
  const props = shallowRef<TypographyProps>({});
  const rootRef = shallowRef<HTMLElement | null>(null);
  const ignoredRef = shallowRef<HTMLElement | null>(null);
  const callback = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Typography
        {...props.value}
        children="root"
        forwardRef={rootRef}
        tooltipRef={ignoredRef}
      />
    )),
  );
  try {
    const article = fixture.host.querySelector("article")!;
    expect(rootRef.value).toBe(article);
    expect(ignoredRef.value).toBeNull();
    expect(article.hasAttribute("forwardref")).toBe(false);
    expect(article.hasAttribute("tooltipref")).toBe(false);
    props.value = { component: "div" };
    await nextTick();
    expect(rootRef.value).toBe(fixture.host.querySelector("div"));
    expect(rootRef.value).not.toBe(article);
  } finally {
    fixture.unmount();
  }
  expect(rootRef.value).toBeNull();
  const second = mountVapor(
    defineVaporComponent(() => <Typography forwardRef={callback} />),
  );
  const node = second.host.querySelector("article")!;
  try {
    expect(callback.mock.calls.at(-1)?.[0]).toBe(node);
  } finally {
    second.unmount();
  }
  expect(callback.mock.calls.at(-1)?.[0]).toBeNull();
});

test("Typography default slot declaration owns rich content and ignores the unused renderer", async () => {
  const label = ref("one");
  const show = ref(true);
  const mounts = vi.fn();
  const unmounts = vi.fn();
  const Child = defineVaporComponent(() => {
    const context = inject("typography-contract-context");
    onMounted(mounts);
    onUnmounted(unmounts);
    return (
      <button>
        {context}:{label.value}
      </button>
    );
  });
  const fallback = vi.fn(() => <em>fallback</em>);
  const slots = shallowRef<TypographySlots>({
    default: () => (
      <>
        {show.value ? <Child /> : null}
        <i>tail</i>
      </>
    ),
  });
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("typography-contract-context", "provided");
      return <Typography children={fallback} v-slots={slots.value} />;
    }),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(button.textContent).toBe("provided:one");
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
    button.focus();
    label.value = "two";
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.textContent).toBe("provided:two");
    show.value = false;
    await nextTick();
    expect(unmounts).toHaveBeenCalledTimes(1);
    show.value = true;
    await nextTick();
    expect(mounts).toHaveBeenCalledTimes(2);
    slots.value = { default: () => [] };
    await nextTick();
    expect(fixture.host.textContent).toBe("");
    expect(fallback).not.toHaveBeenCalled();
    slots.value = {};
    await nextTick();
    expect(fixture.host.textContent).toBe("fallback");
    expect(fallback).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toHaveBeenCalledTimes(2);
});

test("Typography native renderer scalar arrays and nodes preserve escaping and owner lifecycle", async () => {
  const child = defineVaporComponent(() => <b>native child</b>);
  const Child = child;
  const node = document.createElement("i");
  node.textContent = "owned DOM";
  const content = shallowRef<TypographyContent>(() => [
    "<literal>",
    [0, false, null, undefined],
    node,
    <Child />,
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => <Typography children={content.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("<literal>0owned DOMnative child");
    expect(fixture.host.querySelector("literal")).toBeNull();
    expect(fixture.host.querySelector("i")).toBe(node);
    for (const [value, text] of [
      [null, ""],
      [undefined, ""],
      [false, ""],
      [true, ""],
      [NaN, "NaN"],
      [Infinity, "Infinity"],
      [0, "0"],
    ] as const) {
      content.value = value;
      await nextTick();
      expect(fixture.host.textContent).toBe(text);
    }
  } finally {
    fixture.unmount();
  }
});

test("Typography content and attribute boundaries reject objects without coercing or accepting unsafe HTML", async () => {
  const stringify = vi.fn(() => "must not execute");
  for (const value of [{ toString: stringify }, Symbol("bad"), 1n]) {
    expect(() =>
      validateContent(value as unknown as TypographyContent),
    ).toThrow(TypeError);
    expect(() =>
      nativeTypographyContent(value as unknown as TypographyRenderResult),
    ).toThrow(TypeError);
  }
  expect(stringify).not.toHaveBeenCalled();
  for (const value of [undefined, null, false, true, 0, "", () => null])
    expect(() => validateContent(value)).not.toThrow();
  expect(() =>
    nativeTypographyContent(
      Promise.resolve("later") as unknown as TypographyRenderResult,
    ),
  ).toThrow(/synchronous/);
  expect(() =>
    nativeTypographyContent(
      Promise.reject(
        new Error("expected rejection"),
      ) as unknown as TypographyRenderResult,
    ),
  ).toThrow(/synchronous/);
  await Promise.resolve();
  const click = vi.fn();
  expect(
    safeTypographyAttrs({
      id: "safe",
      "aria-label": "text",
      innerHTML: "<b>unsafe</b>",
      ".outerHTML": "bad",
      "^text-content": "bad",
      innerText: "bad",
      outerText: "bad",
      children: "bad",
      ref: {},
      editable: true,
      onClick: click,
      onFocus: [click],
      onBlur: [click, "bad"],
      onMouseenter: "bad",
    }),
  ).toEqual({
    id: "safe",
    "aria-label": "text",
    onClick: click,
    onFocus: [click],
  });
});

test("Typography ellipsis options keep upstream shallow defaults and explicit undefined or null", () => {
  expect(ellipsisOptions(false, "展开", "收起")).toEqual({});
  expect(ellipsisOptions(undefined, "展开", "收起")).toEqual({});
  const base = ellipsisOptions(true, "展开", "收起");
  expect(base).toEqual({
    rows: 1,
    expandable: false,
    pos: "end",
    suffix: "",
    showTooltip: false,
    collapsible: false,
    expandText: undefined,
    collapseText: undefined,
  });
  expect(
    ellipsisOptions({ expandable: true, collapsible: true }, "Open", "Close"),
  ).toMatchObject({ expandText: "Open", collapseText: "Close" });
  expect(
    ellipsisOptions(
      {
        rows: undefined,
        suffix: undefined,
        expandText: undefined,
        expandable: true,
      },
      "Open",
      "Close",
    ),
  ).toMatchObject({
    rows: undefined,
    suffix: undefined,
    expandText: undefined,
  });
  expect(
    ellipsisOptions({ suffix: null as never, rows: 0 }, "Open", "Close"),
  ).toMatchObject({ suffix: null, rows: 0 });
});

test("Typography applies captured global default content, native attributes and DOM refs", async () => {
  const previous = semiGlobal.config;
  const capturedRef = shallowRef<HTMLElement | null>(null);
  const props = shallowRef<TypographyProps>({});
  semiGlobal.configure({
    overrideDefaultProps: {
      Typography: {
        children: "global content",
        id: "global-typography",
        title: "global title",
        forwardRef: capturedRef,
      },
    },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Typography {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector("article")!;
    expect(root.textContent).toBe("global content");
    expect(root.id).toBe("global-typography");
    expect(root.title).toBe("global title");
    expect(capturedRef.value).toBe(root);
    props.value = {
      children: "caller",
      id: "caller-id",
      title: "caller title",
    };
    await nextTick();
    expect(root.textContent).toBe("caller");
    expect(root.id).toBe("caller-id");
    expect(root.title).toBe("caller title");
    props.value = { children: undefined, id: undefined, title: undefined };
    await nextTick();
    expect(root.textContent).toBe("global content");
    expect(root.id).toBe("global-typography");
    expect(root.title).toBe("global title");
  } finally {
    fixture.unmount();
    semiGlobal.configure(previous);
  }
  expect(capturedRef.value).toBeNull();
});

test("Typography ellipsis strategy and tooltip kind retain the fixed short-circuit semantics", () => {
  const options = ellipsisOptions(true, "Expand", "Collapse");
  expect(cssEllipsis(false, options)).toBe(true);
  for (const partial of [
    { expandable: true },
    { expandText: "" },
    { pos: "middle" as const },
    { suffix: "tail" },
  ])
    expect(cssEllipsis(false, { ...options, ...partial })).toBe(false);
  expect(cssEllipsis(true, options)).toBe(false);
  expect(
    cssEllipsis(false, {
      ...options,
      collapsible: true,
      collapseText: "Collapse",
    }),
  ).toBe(true);
  expect(() => cssEllipsis(false, { ...options, suffix: undefined })).toThrow(
    TypeError,
  );
  expect(() =>
    cssEllipsis(false, { ...options, suffix: null as never }),
  ).toThrow(TypeError);
  expect(typographyPopover("PoPoVeR", true)).toBe(true);
  expect(typographyPopover("tooltip", true)).toBe(false);
  expect(typographyPopover("popover", false)).toBe(true);
  expect(typographyPopover(undefined, false)).toBe(false);
  expect(() => typographyPopover(undefined, true)).toThrow(TypeError);
});

test.each(["article", "aside"] as const)(
  "Typography native leaves distinguish omitted component from explicit undefined with %s container default",
  async (fallback) => {
    const previous = semiGlobal.config;
    const input = shallowRef<Pick<TypographyProps, "component">>({});
    const clicked = vi.fn();
    semiGlobal.configure({
      overrideDefaultProps: { Typography: { component: fallback } },
    });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <div>
          <Text
            {...input.value}
            children="text"
            data-leaf="text"
            id="native-text"
            onClick={clicked}
          />
          <Title
            {...input.value}
            children="title"
            data-leaf="title"
            heading={3}
            onClick={clicked}
          />
          <Paragraph
            {...input.value}
            children="paragraph"
            data-leaf="paragraph"
            onClick={clicked}
          />
          <Numeral
            {...input.value}
            children={12}
            data-leaf="numeral"
            onClick={clicked}
          />
        </div>
      )),
    );
    try {
      for (const [props, expected] of [
        [{}, ["SPAN", "H3", "P", "SPAN"]],
        [
          { component: "section" },
          ["SECTION", "SECTION", "SECTION", "SECTION"],
        ],
        [
          { component: undefined },
          [
            fallback.toUpperCase(),
            fallback.toUpperCase(),
            fallback.toUpperCase(),
            fallback.toUpperCase(),
          ],
        ],
        [{}, ["SPAN", "H3", "P", "SPAN"]],
      ] as const) {
        input.value = props;
        await nextTick();
        const roots = [
          ...fixture.host.querySelectorAll<HTMLElement>("[data-leaf]"),
        ];
        expect(roots.map((root) => root.tagName)).toEqual(expected);
        expect(roots[0]!.id).toBe("native-text");
        for (const root of roots) {
          expect(root.hasAttribute("component")).toBe(false);
          expect(root.classList.contains("semi-typography")).toBe(true);
          const before = clicked.mock.calls.length;
          root.click();
          expect(clicked).toHaveBeenCalledTimes(before + 1);
        }
      }
    } finally {
      fixture.unmount();
      semiGlobal.configure(previous);
    }
  },
);

test.each(["article", "aside"] as const)(
  "Typography interop leaves distinguish omitted component from explicit undefined with %s container default",
  async (fallback) => {
    const previous = semiGlobal.config;
    const input = shallowRef<Pick<TypographyProps, "component">>({});
    const clicked = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    semiGlobal.configure({
      overrideDefaultProps: { Typography: { component: fallback } },
    });
    const app = createApp(
      defineComponent(
        () => () =>
          h("div", [
            h(Text, {
              ...input.value,
              children: "text",
              "data-leaf": "text",
              id: "interop-text",
              onClick: clicked,
            }),
            h(Title, {
              ...input.value,
              children: "title",
              "data-leaf": "title",
              heading: 3,
              onClick: clicked,
            }),
            h(Paragraph, {
              ...input.value,
              children: "paragraph",
              "data-leaf": "paragraph",
              onClick: clicked,
            }),
            h(Numeral, {
              ...input.value,
              children: 12,
              "data-leaf": "numeral",
              onClick: clicked,
            }),
          ]),
      ),
    ).use(vaporInteropPlugin);
    try {
      app.mount(host);
      for (const [props, expected] of [
        [{}, ["SPAN", "H3", "P", "SPAN"]],
        [
          { component: "section" },
          ["SECTION", "SECTION", "SECTION", "SECTION"],
        ],
        [
          { component: undefined },
          [
            fallback.toUpperCase(),
            fallback.toUpperCase(),
            fallback.toUpperCase(),
            fallback.toUpperCase(),
          ],
        ],
        [{}, ["SPAN", "H3", "P", "SPAN"]],
      ] as const) {
        input.value = props;
        await nextTick();
        const roots = [...host.querySelectorAll<HTMLElement>("[data-leaf]")];
        expect(roots.map((root) => root.tagName)).toEqual(expected);
        expect(roots[0]!.id).toBe("interop-text");
        for (const root of roots) {
          expect(root.hasAttribute("component")).toBe(false);
          expect(root.classList.contains("semi-typography")).toBe(true);
          const before = clicked.mock.calls.length;
          root.click();
          expect(clicked).toHaveBeenCalledTimes(before + 1);
        }
      }
    } finally {
      app.unmount();
      expect(host.childNodes).toHaveLength(0);
      host.remove();
      semiGlobal.configure(previous);
    }
  },
);
