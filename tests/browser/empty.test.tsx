import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test } from "vitest";
import Empty from "../../packages/semi-ui-vue/src/components/empty/index.js";
import type { EmptyProps } from "../../packages/semi-ui-vue/src/components/empty/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Empty keeps both empty wrappers and restores only the undefined layout default", async () => {
  const props = shallowRef<EmptyProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector(".semi-empty")!;
    expect(root.children).toHaveLength(2);
    expect(root.querySelector(".semi-empty-image")?.children).toHaveLength(0);
    expect(root.querySelector(".semi-empty-image")?.textContent).toBe("");
    expect(root.querySelector("img,svg,h4,h6")).toBeNull();
    for (const [layout, className] of [
      ["horizontal", "semi-empty-horizontal"],
      [undefined, "semi-empty-vertical"],
      [null, ""],
      [false, ""],
      [0, ""],
      ["diagonal", "semi-empty-diagonal"],
    ] as const) {
      props.value = { layout: layout as EmptyProps["layout"] };
      await nextTick();
      expect(root.className).toBe(
        ["semi-empty", className].filter(Boolean).join(" "),
      );
    }
    props.value = {};
    await nextTick();
    expect(root.className).toBe("semi-empty semi-empty-vertical");
  } finally {
    fixture.unmount();
  }
});

test("Empty preserves truthy content gating and empty URL image heading semantics", async () => {
  const props = shallowRef<EmptyProps>({
    title: "Title",
    description: "Description",
    children: "Action",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty {...props.value} />),
  );
  try {
    expect(fixture.host.querySelector("h6")?.style.fontWeight).toBe("400");
    for (const value of [0, NaN, "", false, null, undefined]) {
      props.value = { title: value, description: value, children: value };
      await nextTick();
      expect(
        fixture.host.querySelector(
          ".semi-empty-title,.semi-empty-description,.semi-empty-footer",
        ),
      ).toBeNull();
    }
    props.value = { title: true, description: true, children: true };
    await nextTick();
    expect(
      fixture.host.querySelectorAll(
        ".semi-empty-title,.semi-empty-description,.semi-empty-footer",
      ),
    ).toHaveLength(3);
    expect(fixture.host.textContent).toBe("");
    props.value = { title: "Title", image: "", description: "" };
    await nextTick();
    expect(fixture.host.querySelector("h4")).not.toBeNull();
    expect(fixture.host.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(fixture.host.querySelector("img")?.getAttribute("src")).toBe("");
    props.value = { title: "Title", image: 0, description: false };
    await nextTick();
    expect(fixture.host.querySelector("h6")).not.toBeNull();
    expect(fixture.host.querySelector(".semi-empty-image")?.textContent).toBe(
      "0",
    );
  } finally {
    fixture.unmount();
  }
});

test("Empty native symbol ignores viewBox/url and URL alt follows string description", async () => {
  const props = shallowRef<EmptyProps>({
    image: { id: "symbol", viewBox: "0 0 20 20", url: "/unused" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty {...props.value} />),
  );
  try {
    const svg = fixture.host.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.hasAttribute("viewBox")).toBe(false);
    expect(svg.querySelector("use")?.getAttribute("xlink:href")).toBe(
      "#symbol",
    );
    props.value = {
      image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
      description: 1,
    };
    await nextTick();
    expect(fixture.host.querySelector("img")?.alt).toBe("empty");
    props.value = { ...props.value, description: "<escaped>" };
    await nextTick();
    expect(fixture.host.querySelector("img")?.alt).toBe("<escaped>");
    expect(fixture.host.querySelector("escaped")).toBeNull();
    const image = fixture.host.querySelector("img");
    props.value = { ...props.value, description: false };
    await nextTick();
    expect(fixture.host.querySelector("img")).toBe(image);
    expect(image?.alt).toBe("empty");
  } finally {
    fixture.unmount();
  }
});

test("Empty clears removed style, imageStyle and className on stable native wrappers", async () => {
  const initial: EmptyProps = {
    className: "first",
    style: { padding: "13px", backgroundColor: "red" },
    imageStyle: { width: "150px", height: "120px" },
    title: "Title",
    description: "Description",
    children: "Action",
  };
  const props = shallowRef<EmptyProps>(initial);
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty {...props.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-empty")!;
    const image = root.querySelector<HTMLElement>(".semi-empty-image")!;
    const content = root.querySelector<HTMLElement>(".semi-empty-content")!;
    const expectStable = () => {
      expect(fixture.host.querySelector(".semi-empty")).toBe(root);
      expect(root.querySelector(".semi-empty-image")).toBe(image);
      expect(root.querySelector(".semi-empty-content")).toBe(content);
      expect(image.querySelector("img,svg")).toBeNull();
    };
    const expectCleared = () => {
      expectStable();
      expect(root.style.padding).toBe("");
      expect(root.style.backgroundColor).toBe("");
      expect(image.style.width).toBe("");
      expect(image.style.height).toBe("");
      expect(root.className).toBe("semi-empty semi-empty-vertical");
    };
    expectStable();
    expect(root.style.padding).toBe("13px");
    expect(image.style.width).toBe("150px");
    props.value = {
      ...initial,
      className: undefined,
      style: undefined,
      imageStyle: undefined,
    };
    await nextTick();
    expectCleared();
    for (const cleared of [null, false] as const) {
      props.value = {
        ...initial,
        className: "restored",
        style: { padding: "7px", backgroundColor: "blue" },
        imageStyle: { width: "80px", height: "60px" },
      };
      await nextTick();
      expectStable();
      expect(root.classList.contains("restored")).toBe(true);
      expect(root.style.padding).toBe("7px");
      expect(image.style.width).toBe("80px");
      // classnames accepts falsy className; style is cleared only with source-supported null.
      props.value = {
        ...initial,
        className: cleared as unknown as string,
        style: null as unknown as EmptyProps["style"],
        imageStyle: null as unknown as EmptyProps["imageStyle"],
      };
      await nextTick();
      expectCleared();
    }
    props.value = initial;
    await nextTick();
    expect(content.textContent).toBe("TitleDescriptionAction");
    expect(root.classList.contains("first")).toBe(true);
    props.value = {};
    await nextTick();
    expectCleared();
    expect(
      content.querySelector(
        ".semi-empty-title,.semi-empty-description,.semi-empty-footer",
      ),
    ).toBeNull();
    expect(content.textContent).toBe("");
    props.value = initial;
    await nextTick();
    expectStable();
    expect(content.textContent).toBe("TitleDescriptionAction");
    props.value = {
      title: undefined,
      description: undefined,
      children: undefined,
    };
    await nextTick();
    expectCleared();
    expect(
      content.querySelector(
        ".semi-empty-title,.semi-empty-description,.semi-empty-footer",
      ),
    ).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Empty symbol id presence includes inherited and empty values without using URL metadata", async () => {
  const props = shallowRef<EmptyProps>({ image: { id: "first" } });
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty {...props.value} />),
  );
  try {
    for (const [value, href] of [
      [{ id: "" }, "#"],
      [{ id: undefined }, "#undefined"],
      [{ id: null }, "#null"],
      [Object.create({ id: "inherited" }), "#inherited"],
    ] as const) {
      props.value = { image: value as EmptyProps["image"] };
      await nextTick();
      expect(
        fixture.host
          .querySelector("use")
          ?.getAttributeNS("http://www.w3.org/1999/xlink", "href"),
      ).toBe(href);
    }
    for (const value of [NaN, false, null, undefined]) {
      props.value = { image: value, title: "Title" };
      await nextTick();
      expect(fixture.host.querySelector("h6")).not.toBeNull();
      expect(fixture.host.querySelector(".semi-empty-image")?.textContent).toBe(
        Number.isNaN(value) ? "NaN" : "",
      );
    }
  } finally {
    fixture.unmount();
  }
});

test.each([true, 1, -1, Infinity, {}, { url: "/not-a-string" }])(
  "Empty rejects unsupported image input %j at its actual render boundary",
  (value) => {
    const errors: unknown[] = [];
    const warnings: string[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Empty image={value as EmptyProps["image"]} />
      )),
    );
    app.config.errorHandler = (error) => errors.push(error);
    app.config.warnHandler = (warning) => warnings.push(warning);
    try {
      app.mount(host);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every((error) => error instanceof TypeError)).toBe(true);
      expect(warnings).toEqual([
        "Vapor component setup() returned non-block value, and has no render function.",
      ]);
    } finally {
      app.unmount();
      host.remove();
    }
  },
);
