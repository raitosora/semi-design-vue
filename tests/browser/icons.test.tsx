import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import { expect, test } from "vitest";
import Icon from "../../packages/semi-icons-vue/src/components/Icon.js";
import { convertIcon } from "../../packages/semi-icons-vue/src/components/convertIcon.js";
import type {
  IconHandle,
  IconProps,
  IconSlots,
} from "../../packages/semi-icons-vue/src/components/types.js";
import { IconHome } from "../../packages/semi-icons-vue/src/icons/IconHome.js";
import { IconDatePicker } from "../../packages/semi-icons-lab-vue/src/icons/IconDatePicker.js";
import { mountVapor } from "../support/mount-vapor.js";

test("icons convertIcon creates a reactive Vapor wrapper with an explicit DOM handle", async () => {
  const Svg: NonNullable<IconSlots["svg"]> = (slot) => (
    <svg height={slot.size} width={slot.size}>
      <path d="M0 0h1v1z" fill={slot.fill?.[0]} />
    </svg>
  );
  const Converted = convertIcon(Svg, "custom");
  const incoming = shallowRef<
    import("../../packages/semi-icons-vue/src/components/convertIcon.js").ConvertedIconProps
  >({ fill: ["red"], spin: true });
  const handle = ref<IconHandle | null>(null);
  const visible = ref(true);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Converted v-if={visible.value} {...incoming.value} ref={handle} />
    )),
  );
  try {
    const api = handle.value!;
    expect(api.getElement()!.classList.contains("semi-icon-custom")).toBe(true);
    expect(Converted.elementType).toBe("Icon");
    incoming.value = { fill: ["blue"] };
    await nextTick();
    expect(api.getElement()!.querySelector("path")!.getAttribute("fill")).toBe(
      "blue",
    );
    visible.value = false;
    await nextTick();
    expect(api.getElement()).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("icons preserve wrapper defaults, native attributes and explicit accessible names", async () => {
  const incoming = shallowRef<IconProps>({ type: "home" });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Icon {...incoming.value} data-icon="test">
        {() => <IconHome aria-hidden="true" size="inherit" />}
      </Icon>
    )),
  );
  try {
    const root = fixture.host.querySelector("span")!;
    expect(root.className).toBe("semi-icon semi-icon-default semi-icon-home");
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.hasAttribute("role")).toBe(false);
    incoming.value = { "aria-label": "首页", title: "主页", id: "home-icon" };
    await nextTick();
    expect(root.getAttribute("role")).toBe("img");
    expect(root.hasAttribute("aria-hidden")).toBe(false);
    expect(root.getAttribute("aria-label")).toBe("首页");
    expect(root.title).toBe("主页");
    incoming.value = {
      "aria-labelledby": "label-id",
      "aria-hidden": true,
      role: "presentation",
    };
    await nextTick();
    expect(root.getAttribute("aria-labelledby")).toBe("label-id");
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.getAttribute("role")).toBe("presentation");
    incoming.value = { "aria-label": "  ", "aria-hidden": false };
    await nextTick();
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(root.hasAttribute("role")).toBe(false);
    incoming.value = { "aria-hidden": undefined, role: undefined };
    await nextTick();
    expect(root.getAttribute("aria-hidden")).toBe("true");
    incoming.value = { "aria-label": "首页", role: undefined };
    await nextTick();
    expect(root.getAttribute("role")).toBe("img");
  } finally {
    fixture.unmount();
  }
});

test("icons keep custom IDs and live handles isolated in iframe documents and shadow hosts", async () => {
  const frame = document.createElement("iframe");
  const shadowHost = document.createElement("div");
  document.body.append(frame, shadowHost);
  const shadow = shadowHost.attachShadow({ mode: "open" });
  const frameDocument = frame.contentDocument!;
  const frameTarget = frameDocument.createElement("div");
  const shadowTarget = document.createElement("div");
  frameDocument.body.append(frameTarget);
  shadow.append(shadowTarget);
  const fill = ref("red");
  const firstHandle = ref<IconHandle | null>(null);
  const secondHandle = ref<IconHandle | null>(null);
  const slots: IconSlots = {
    svg: ({ id }) => (
      <svg>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect height="10" width="10" />
          </clipPath>
        </defs>
        <path
          clip-path={`url(#${id}-clip)`}
          d="M0 0h20v20z"
          fill={fill.value}
        />
      </svg>
    ),
  };
  const first = createVaporApp(
    defineVaporComponent(() => <Icon ref={firstHandle} v-slots={slots} />),
  );
  const second = createVaporApp(
    defineVaporComponent(() => <Icon ref={secondHandle} v-slots={slots} />),
  );
  let firstMounted = false;
  let secondMounted = false;
  try {
    first.mount(frameTarget);
    firstMounted = true;
    second.mount(shadowTarget);
    secondMounted = true;
    const firstApi = firstHandle.value!;
    const secondApi = secondHandle.value!;
    const frameRoot = firstApi.getElement()!;
    const shadowRoot = secondApi.getElement()!;
    expect(frameRoot.ownerDocument).toBe(frameDocument);
    expect(shadowRoot.getRootNode()).toBe(shadow);
    expect(frameRoot.querySelector("clipPath")!.id).not.toBe(
      shadowRoot.querySelector("clipPath")!.id,
    );
    for (const root of [frameRoot, shadowRoot]) {
      expect(root.querySelector("path")!.getAttribute("clip-path")).toBe(
        `url(#${root.querySelector("clipPath")!.id})`,
      );
    }
    fill.value = "blue";
    await nextTick();
    expect(frameRoot.querySelector("path")!.getAttribute("fill")).toBe("blue");
    expect(shadowRoot.querySelector("path")!.getAttribute("fill")).toBe("blue");
    first.unmount();
    firstMounted = false;
    second.unmount();
    secondMounted = false;
    expect(firstApi.getElement()).toBeNull();
    expect(secondApi.getElement()).toBeNull();
    expect(frameTarget.querySelector("svg")).toBeNull();
    expect(shadowTarget.querySelector("svg")).toBeNull();
  } finally {
    if (firstMounted) first.unmount();
    if (secondMounted) second.unmount();
    frame.remove();
    shadowHost.remove();
  }
});

test("icons update size, prefix, color, spin, safe rotation and caller style without mutating inputs", async () => {
  const style = Object.freeze({ transform: "scale(2)", color: "rgb(1, 2, 3)" });
  const incoming = shallowRef<IconProps>({
    size: "large",
    spin: true,
    rotate: 90,
    color: "red",
    className: "alias",
    class: "native",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Icon {...incoming.value}>{() => <IconHome size="inherit" />}</Icon>
    )),
  );
  try {
    const root = fixture.host.querySelector("span")!;
    expect(root.classList.contains("semi-icon-large")).toBe(true);
    expect(root.classList.contains("semi-icon-spinning")).toBe(true);
    expect(root.classList.contains("native")).toBe(true);
    expect(root.classList.contains("alias")).toBe(true);
    expect(root.style.transform).toBe("rotate(90deg)");
    expect(root.style.color).toBe("red");
    incoming.value = {
      size: "inherit",
      prefixCls: "custom",
      rotate: 1.5,
      style,
    };
    await nextTick();
    expect(root.className).toBe("custom-icon");
    expect(root.style.transform).toBe("scale(2)");
    expect(root.style.color).toBe("rgb(1, 2, 3)");
    expect(style.transform).toBe("scale(2)");
    incoming.value = { rotate: Number.POSITIVE_INFINITY };
    await nextTick();
    expect(root.style.transform).toBe("");
    expect(root.style.color).toBe("");
    incoming.value = {
      rotate: 0,
      style: "font-size: 32px; transform: rotate(15deg)",
    };
    await nextTick();
    expect(root.style.transform).toBe("rotate(15deg)");
    expect(root.style.fontSize).toBe("32px");
  } finally {
    fixture.unmount();
  }
});

test("icons custom svg slots receive reactive fill and independent IDs without cloning or replacing nodes", async () => {
  const fill = shallowRef<readonly string[]>(["red"]);
  const make = () => {
    const slots: IconSlots = {
      svg: (slot) => (
        <svg height={slot.size} viewBox="0 0 24 24" width={slot.size}>
          <defs>
            <linearGradient id={`${slot.id}-paint`}>
              <stop stop-color={slot.fill?.[0]} />
            </linearGradient>
          </defs>
          <path d="M0 0h24v24H0z" fill={`url(#${slot.id}-paint)`} />
        </svg>
      ),
      default: () => <i>fallback</i>,
    };
    return mountVapor(
      defineVaporComponent(() => <Icon fill={fill.value} v-slots={slots} />),
    );
  };
  const first = make();
  const second = make();
  try {
    const svg = first.host.querySelector("svg")!;
    const firstId = first.host.querySelector("linearGradient")!.id;
    expect(second.host.querySelector("linearGradient")!.id).not.toBe(firstId);
    expect(first.host.querySelector("path")!.getAttribute("fill")).toBe(
      `url(#${firstId})`,
    );
    expect(first.host.querySelector("i")).toBeNull();
    fill.value = ["blue"];
    await nextTick();
    expect(first.host.querySelector("svg")).toBe(svg);
    expect(svg.querySelector("stop")!.getAttribute("stop-color")).toBe("blue");
    expect(second.host.querySelector("stop")!.getAttribute("stop-color")).toBe(
      "blue",
    );
  } finally {
    first.unmount();
    second.unmount();
  }
});

test("icons expose a live explicit DOM handle, preserve event merging and release on unmount", async () => {
  const handle = ref<IconHandle | null>(null);
  const visible = ref(true);
  const calls: string[] = [];
  const onClick = () => calls.push("click");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div onClick={() => calls.push("parent")}>
        <Icon
          v-if={visible.value}
          {...{ onClick }}
          {...{ onClick }}
          ref={handle}
          tabindex={0}
        >
          {() => <IconDatePicker size="inherit" />}
        </Icon>
      </div>
    )),
  );
  try {
    const retained = handle.value!;
    const root = retained.getElement()!;
    expect(root.tagName).toBe("SPAN");
    root.click();
    expect(calls).toEqual(["click", "parent"]);
    root.focus();
    expect(document.activeElement).toBe(root);
    visible.value = false;
    await nextTick();
    expect(retained.getElement()).toBeNull();
    expect(fixture.host.querySelector("svg")).toBeNull();
    expect(Icon.elementType).toBe("Icon");
  } finally {
    fixture.unmount();
  }
});

test("icons allow empty content and replace or remove native event handlers reactively", async () => {
  const calls: string[] = [];
  const incoming = shallowRef<IconProps>({
    onClick: () => calls.push("first"),
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Icon {...incoming.value} />),
  );
  try {
    const root = fixture.host.querySelector("span")!;
    expect(root.children).toHaveLength(0);
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.hasAttribute("tabindex")).toBe(false);
    root.click();
    incoming.value = { onClick: () => calls.push("second") };
    await nextTick();
    root.click();
    incoming.value = {};
    await nextTick();
    root.click();
    expect(calls).toEqual(["first", "second"]);
  } finally {
    fixture.unmount();
  }
});
