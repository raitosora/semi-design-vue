import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import { IconHome, type IconSvgScope } from "semi-icons-vue";
import Icon from "semi-icons-vue/Icon";
import IconButton from "../../packages/semi-ui-vue/src/components/iconButton/index.js";
import type { IconButtonProps } from "../../packages/semi-ui-vue/src/components/iconButton/types.js";
import { mountVapor } from "../support/mount-vapor.js";
import { installResourceTracker } from "../support/resource-tracker.js";

test("IconButton preserves defaults, scalar children and dynamic native slots", async () => {
  const input = shallowRef<IconButtonProps>({});
  const content = shallowRef(false);
  const label = shallowRef("first");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <IconButton
        {...input.value}
        v-slots={{
          icon: () => <IconHome data-test-icon="" />,
          ...(content.value ? { default: () => <b>{label.value}</b> } : {}),
        }}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector("button")!;
    expect(IconButton.elementType).toBe("IconButton");
    expect(root.type).toBe("button");
    expect(root.className).toBe(
      "semi-button semi-button-primary semi-button-light semi-button-with-icon semi-button-with-icon-only",
    );
    expect(root.getAttribute("aria-disabled")).toBe("false");
    for (const text of ["", 0, "label"]) {
      input.value = { text };
      await nextTick();
      expect(root.classList.contains("semi-button-with-icon-only")).toBe(false);
      expect(root.querySelector("[x-semi-prop=children]")?.textContent).toBe(
        String(text),
      );
    }
    input.value = {
      text: null,
      iconPosition: "right",
      iconSize: "extra-large",
      iconStyle: { color: "red" },
    };
    content.value = true;
    await nextTick();
    expect(
      root.querySelector(".semi-button-content")!.firstElementChild?.className,
    ).toBe("semi-button-content-left");
    expect(root.querySelector("svg")!.getAttribute("width")).toBe("16px");
    expect(root.querySelector("svg")!.style.color).toBe("");
    label.value = "updated";
    await nextTick();
    expect(root.querySelector("b")!.textContent).toBe("updated");
    content.value = false;
    input.value = { size: undefined, theme: undefined, htmlType: undefined };
    await nextTick();
    expect(root.classList.contains("semi-button-with-icon-only")).toBe(true);
    expect(root.classList.contains("semi-button-light")).toBe(true);
    expect(root.type).toBe("button");
  } finally {
    fixture.unmount();
  }
});

test("IconButton retains disabled/loading precedence and one native callback", async () => {
  const input = shallowRef<IconButtonProps>({});
  const clicked = vi.fn();
  const down = vi.fn();
  const parent = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div onClick={parent}>
        <IconButton
          {...input.value}
          onClick={clicked}
          onMousedown={down}
          v-slots={{ icon: () => <IconHome />, default: () => <i>Save</i> }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector("button")!;
    root.click();
    root.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(clicked.mock.calls[0]![0]).toBeInstanceOf(MouseEvent);
    expect(down).toHaveBeenCalledTimes(1);
    expect(parent).toHaveBeenCalledTimes(1);
    input.value = { loading: true };
    await nextTick();
    expect(root.disabled).toBe(false);
    expect(root.querySelector('[data-icon="spin"]')).not.toBeNull();
    root.click();
    expect(clicked).toHaveBeenCalledTimes(2);
    input.value = { loading: true, disabled: true };
    await nextTick();
    expect(root.disabled).toBe(true);
    expect(root.getAttribute("aria-disabled")).toBe("true");
    expect(root.classList.contains("semi-button-loading")).toBe(true);
    expect(root.querySelector('[data-icon="spin"]')).toBeNull();
    root.click();
    root.querySelector("i")!.click();
    expect(clicked).toHaveBeenCalledTimes(2);
    expect(parent).toHaveBeenCalledTimes(2);
  } finally {
    fixture.unmount();
  }
});

test("IconButton keeps padding immutable and preserves prefix and content classes", async () => {
  const style = Object.freeze({
    paddingLeft: "9px",
    paddingRight: "10px",
    color: "red",
  });
  const input = shallowRef<IconButtonProps>({
    style,
    text: "Text",
    prefixCls: "custom",
    className: "alias",
    class: ["native"],
    contentClassName: "inside",
    block: true,
    circle: true,
    size: "large",
    type: "danger",
    theme: "outline",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <IconButton {...input.value} />),
  );
  try {
    const root = fixture.host.querySelector("button")!;
    for (const padding of [
      true,
      false,
      "left",
      "right",
      ["left"],
      ["right"],
      ["left", "right"],
      [],
    ] as const) {
      input.value = { ...input.value, noHorizontalPadding: padding };
      await nextTick();
      const left =
        padding === true ||
        padding === "left" ||
        (Array.isArray(padding) && padding.includes("left"));
      const right =
        padding === true ||
        padding === "right" ||
        (Array.isArray(padding) && padding.includes("right"));
      expect(root.style.paddingLeft).toBe(left ? "0px" : "9px");
      expect(root.style.paddingRight).toBe(right ? "0px" : "10px");
    }
    expect(style.paddingLeft).toBe("9px");
    expect(root.classList.contains("semi-button")).toBe(true);
    expect(root.classList.contains("custom-with-icon")).toBe(true);
    expect(root.classList.contains("native")).toBe(true);
    expect(root.classList.contains("alias")).toBe(true);
    expect(root.querySelector(".semi-button-content.inside")).not.toBeNull();
    expect(root.classList.contains("semi-button-block")).toBe(true);
    expect(root.classList.contains("semi-button-circle")).toBe(true);
    expect(root.classList.contains("semi-button-size-large")).toBe(true);
    input.value = { size: "small", disabled: true, type: "warning" };
    await nextTick();
    expect(root.classList.contains("semi-button-warning-disabled")).toBe(true);
    expect(root.classList.contains("semi-button-size-small")).toBe(true);
    expect(root.style.cssText).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("IconButton colorful scope and loading use raw upstream theme/type branches", async () => {
  const input = shallowRef<IconButtonProps>({ colorful: true, loading: true });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <IconButton
        {...input.value}
        v-slots={{
          icon: (scope) => <svg data-fill={JSON.stringify(scope.fill)} />,
        }}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector("button")!;
    expect(root.querySelector('[data-icon="spin"]')).not.toBeNull();
    input.value = { colorful: true, theme: "light", loading: true };
    await nextTick();
    expect(
      root.querySelector(".semi-button-content-loading-icon"),
    ).not.toBeNull();
    input.value = {
      colorful: false,
      theme: "solid",
      type: "tertiary",
      loading: true,
    };
    await nextTick();
    expect(
      root.querySelector(".semi-button-content-loading-icon"),
    ).not.toBeNull();
    for (const theme of ["solid", "light", "borderless", "outline"] as const) {
      for (const type of ["primary", "tertiary", "secondary"] as const) {
        for (const disabled of [false, true]) {
          input.value = { colorful: true, theme, type, disabled };
          await nextTick();
          const multiple =
            (theme === "solid" && type === "tertiary") ||
            (type === "primary" && ["light", "borderless"].includes(theme));
          const two =
            type === "tertiary" &&
            ["light", "borderless", "outline"].includes(theme);
          const encoded = root.querySelector("svg")!.getAttribute("data-fill");
          const expected = multiple ? 4 : two ? 2 : 0;
          if (expected) {
            const fill = JSON.parse(encoded!) as string[];
            expect(fill).toHaveLength(expected);
            expect(
              fill.every((color) =>
                disabled
                  ? color === "var(--semi-color-disabled-text)"
                  : color.includes("semi-button-colorful"),
              ),
            ).toBe(true);
          } else expect(encoded).toBeNull();
        }
      }
    }
    input.value = { colorful: false };
    await nextTick();
    expect(root.querySelector("[data-fill]")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("IconButton empty slots and rapid loading replacements preserve child ownership", async () => {
  const loading = shallowRef(false);
  const visible = shallowRef(true);
  const empty = shallowRef(false);
  const position = shallowRef<"left" | "right">("left");
  let mounts = 0;
  let unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => {
      mounts++;
    });
    onUnmounted(() => {
      unmounts++;
    });
    return <i data-owned-icon="" />;
  });
  const root = defineVaporComponent(() => (
    <IconButton
      v-if={visible.value}
      iconPosition={position.value}
      loading={loading.value}
      v-slots={{
        icon: () => (
          <>
            <Child v-if={!empty.value} />
          </>
        ),
        default: () => [],
      }}
    />
  ));
  const fixture = mountVapor(root);
  try {
    const button = fixture.host.querySelector("button")!;
    expect(button.classList.contains("semi-button-with-icon-only")).toBe(false);
    expect(mounts).toBe(1);
    loading.value = true;
    loading.value = false;
    await nextTick();
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);
    for (const side of ["left", "right"] as const) {
      position.value = side;
      await nextTick();
      loading.value = true;
      await nextTick();
      expect(button.querySelector("[data-owned-icon]")).toBeNull();
      expect(button.querySelector('[data-icon="spin"]')).not.toBeNull();
      loading.value = false;
      await nextTick();
      expect(button.querySelector("[data-owned-icon]")).not.toBeNull();
    }
    empty.value = true;
    await nextTick();
    expect(button.querySelector("[data-owned-icon]")).toBeNull();
    expect(mounts).toBe(unmounts);
    empty.value = false;
    visible.value = false;
    await nextTick();
    expect(fixture.host.querySelector("button")).toBeNull();
    visible.value = true;
    await nextTick();
    expect(mounts).toBe(unmounts + 1);
  } finally {
    fixture.unmount();
  }
  expect(mounts).toBe(unmounts);
});

test("IconButton forwards changing listeners once and preserves cancellation and native attributes", async () => {
  const first = vi.fn((event: MouseEvent) => event.preventDefault());
  const second = vi.fn();
  const handler = shallowRef(first);
  const attrs = shallowRef<IconButtonProps>({
    id: "native-button",
    name: "operation",
    value: "save",
    form: "external",
    title: "Action",
    tabindex: 2,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <IconButton
        {...attrs.value}
        {...{ onClick: handler.value }}
        onClick={handler.value}
        text="Action"
      />
    )),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(button.id).toBe("native-button");
    expect(button.name).toBe("operation");
    expect(button.value).toBe("save");
    expect(button.getAttribute("form")).toBe("external");
    expect(button.tabIndex).toBe(2);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(button.dispatchEvent(event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    handler.value = second;
    attrs.value = { title: "Updated", tabindex: 0 };
    await nextTick();
    button.click();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(button.id).toBe("");
    expect(button.title).toBe("Updated");
    expect(button.getAttribute("form")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("IconButton mount/unmount does not leave component timers or document resources", async () => {
  const loading = shallowRef(true);
  const root = defineVaporComponent(() => (
    <IconButton loading={loading.value} />
  ));
  mountVapor(root).unmount();
  for (let index = 0; index < 3; index++) {
    const app = createVaporApp(root);
    const host = document.createElement("div");
    document.body.append(host);
    const resources = installResourceTracker(window, document);
    let mounted = false;
    try {
      app.mount(host);
      mounted = true;
      const id = host.querySelector("linearGradient")!.id;
      loading.value = false;
      await nextTick();
      loading.value = true;
      await nextTick();
      expect(host.querySelector("linearGradient")!.id).not.toBe(id);
      app.unmount();
      mounted = false;
      resources.assertClean();
      expect(host.childElementCount).toBe(0);
    } finally {
      if (mounted) app.unmount();
      resources.restore();
      host.remove();
    }
  }
});

test("IconButton forwards exact colorful palettes through the real Icon slot", async () => {
  const input = shallowRef<IconButtonProps>({
    colorful: true,
    type: "primary",
    theme: "light",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <IconButton
        {...input.value}
        v-slots={{
          icon: (button) => (
            <Icon
              fill={button.fill}
              v-slots={{
                svg: (svg: IconSvgScope) => (
                  <svg data-palette={JSON.stringify(svg.fill)}>
                    <path
                      d="M0 0h1v1z"
                      fill={svg.fill?.[0] ?? "currentColor"}
                    />
                  </svg>
                ),
              }}
            />
          ),
        }}
      />
    )),
  );
  try {
    const svg = () => fixture.host.querySelector("svg")!;
    expect(JSON.parse(svg().getAttribute("data-palette")!)).toEqual([
      "var(--semi-button-colorful-multiple-fill-0)",
      "var(--semi-button-colorful-multiple-fill-1)",
      "var(--semi-button-colorful-multiple-fill-2)",
      "var(--semi-button-colorful-multiple-fill-3)",
    ]);
    expect(svg().querySelector("path")!.getAttribute("fill")).toBe(
      "var(--semi-button-colorful-multiple-fill-0)",
    );
    input.value = { colorful: true, type: "tertiary", theme: "outline" };
    await nextTick();
    expect(JSON.parse(svg().getAttribute("data-palette")!)).toEqual([
      "var(--semi-button-colorful-fill-primary)",
      "var(--semi-button-colorful-fill-secondary)",
    ]);
    input.value = { ...input.value, disabled: true };
    await nextTick();
    expect(JSON.parse(svg().getAttribute("data-palette")!)).toEqual([
      "var(--semi-color-disabled-text)",
      "var(--semi-color-disabled-text)",
    ]);
    expect(svg().querySelector("path")!.getAttribute("fill")).toBe(
      "var(--semi-color-disabled-text)",
    );
    input.value = { colorful: undefined, theme: undefined, type: undefined };
    await nextTick();
    expect(svg().getAttribute("data-palette")).toBeNull();
    expect(svg().querySelector("path")!.getAttribute("fill")).toBe(
      "currentColor",
    );
  } finally {
    fixture.unmount();
  }
});

test("IconButton native mouse, keyboard and focus handlers retain event identity", () => {
  const seen: Event[] = [];
  const receive = (event: Event) => {
    seen.push(event);
  };
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <IconButton
        onBlur={receive}
        onFocus={receive}
        onKeydown={receive}
        onKeyup={receive}
        onMousedown={receive}
        onMouseenter={receive}
        onMouseleave={receive}
        onMouseup={receive}
        text="Native events"
      />
    )),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    const events = [
      ...["mousedown", "mouseup", "mouseenter", "mouseleave"].map(
        (name) => new MouseEvent(name),
      ),
      ...["keydown", "keyup"].map(
        (name) => new KeyboardEvent(name, { key: "Enter" }),
      ),
    ];
    for (const event of events) button.dispatchEvent(event);
    expect(seen).toHaveLength(events.length);
    events.forEach((event, index) => expect(seen[index]).toBe(event));
    button.focus();
    button.blur();
    expect(seen).toHaveLength(8);
    expect(seen[6]).toBeInstanceOf(FocusEvent);
    expect(seen[7]).toBeInstanceOf(FocusEvent);
  } finally {
    fixture.unmount();
  }
});
