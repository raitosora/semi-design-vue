import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Divider from "../../packages/semi-ui-vue/src/components/divider/index.js";
import type { DividerProps } from "../../packages/semi-ui-vue/src/components/divider/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("Divider applies only the fixed defaults and restores explicit undefined", async () => {
  const input = shallowRef<DividerProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider {...input.value} v-slots={{ default: () => <>Title</> }} />
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLDivElement>(".semi-divider")!;
    expect(root.className).toBe(
      "semi-divider semi-divider-horizontal semi-divider-with-text semi-divider-with-text-center",
    );
    expect(root.getAttribute("role")).toBeNull();
    expect(root.getAttribute("tabindex")).toBeNull();
    expect(root.getAttribute("aria-orientation")).toBeNull();
    input.value = { layout: "vertical", align: "right", dashed: true };
    await settle();
    expect(root.className).toBe(
      "semi-divider semi-divider-vertical semi-divider-dashed",
    );
    expect(root.textContent).toBe("");
    input.value = {
      layout: undefined,
      align: undefined,
      dashed: undefined,
      margin: undefined,
    };
    await settle();
    expect(root.className).toBe(
      "semi-divider semi-divider-horizontal semi-divider-with-text semi-divider-with-text-center",
    );
    input.value = { align: "left", dashed: true };
    await settle();
    expect(root.classList.contains("semi-divider-with-text-left")).toBe(true);
    expect(root.classList.contains("semi-divider-dashed")).toBe(true);
    input.value = { align: "right", dashed: false };
    await settle();
    expect(root.classList.contains("semi-divider-with-text-right")).toBe(true);
    expect(root.classList.contains("semi-divider-dashed")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Divider uses the active margin axis and lets live style override it", async () => {
  const style = Object.freeze({ marginTop: "7px", color: "red" });
  const input = shallowRef<DividerProps>({ margin: 12, style });
  const fixture = mountVapor(
    defineVaporComponent(() => <Divider {...input.value} />),
  );
  try {
    const root = fixture.host.querySelector<HTMLDivElement>(".semi-divider")!;
    expect(root.style.marginTop).toBe("7px");
    expect(root.style.marginBottom).toBe("12px");
    expect(style).toEqual({ marginTop: "7px", color: "red" });
    input.value = { layout: "vertical", margin: "2rem" };
    await settle();
    expect(root.style.marginTop).toBe("");
    expect(root.style.marginBottom).toBe("");
    expect(root.style.marginLeft).toBe("2rem");
    expect(root.style.marginRight).toBe("2rem");
    expect(root.style.color).toBe("");
    input.value = {
      margin: 0,
      style: [{ marginBottom: "5px" }, { color: "blue" }],
    };
    await settle();
    expect(root.style.marginLeft).toBe("");
    expect(root.style.marginRight).toBe("");
    expect(root.style.marginTop).toBe("0px");
    expect(root.style.marginBottom).toBe("5px");
    input.value = { margin: "10%", style: "margin-top: 4px; color: green" };
    await settle();
    expect(root.style.marginTop).toBe("4px");
    expect(root.style.marginBottom).toBe("10%");
    input.value = { margin: undefined, style: undefined };
    await settle();
    expect(root.style.cssText).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("Divider merges class aliases and forwards native attrs without replacing its slot", async () => {
  const click = vi.fn();
  const input = shallowRef<DividerProps>({
    class: ["native", { active: true }],
    className: "legacy",
    id: "divider-id",
    role: "separator",
    "aria-orientation": "vertical",
    "aria-label": "Section",
    title: "Title",
    onClick: click,
  });
  const forbidden = {
    innerHTML: "<b>unsafe</b>",
    textContent: "replacement",
    "inner-html": "<b>also unsafe</b>",
    "text-content": "also replacement",
  };
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider
        {...input.value}
        {...forbidden}
        data-purpose="section"
        v-slots={{ default: () => <strong>owned slot</strong> }}
      />
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLDivElement>(".semi-divider")!;
    expect(root.classList.contains("native")).toBe(true);
    expect(root.classList.contains("active")).toBe(true);
    expect(root.classList.contains("legacy")).toBe(true);
    expect(root.className.match(/\bnative\b/g)).toHaveLength(1);
    expect(root.getAttribute("className")).toBeNull();
    expect(root.id).toBe("divider-id");
    expect(root.getAttribute("role")).toBe("separator");
    expect(root.getAttribute("aria-orientation")).toBe("vertical");
    expect(root.dataset.purpose).toBe("section");
    expect(root.textContent).toBe("owned slot");
    expect(root.querySelector("b")).toBeNull();
    const event = new MouseEvent("click", { bubbles: true });
    root.dispatchEvent(event);
    expect(click).toHaveBeenCalledExactlyOnceWith(event);
    input.value = { class: { next: true }, className: undefined };
    await settle();
    expect(root.classList.contains("next")).toBe(true);
    expect(root.classList.contains("legacy")).toBe(false);
    expect(root.classList.contains("active")).toBe(false);
    expect(root.getAttribute("role")).toBeNull();
    expect(root.getAttribute("aria-orientation")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Divider distinguishes rendered empty content, whitespace and zero without probing slots", async () => {
  const value = shallowRef<string | number | boolean>("");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section>
        <Divider data-case="absent" />
        <Divider data-case="fragment" v-slots={{ default: () => <></> }} />
        <Divider
          data-case="false"
          v-slots={{ default: () => <>{false && <i />}</> }}
        />
        <Divider
          data-case="live"
          v-slots={{ default: () => <>{value.value}</> }}
        />
      </section>
    )),
  );
  try {
    await settle();
    for (const root of fixture.host.querySelectorAll(".semi-divider"))
      expect(root.classList.contains("semi-divider-with-text")).toBe(false);
    const root =
      fixture.host.querySelector<HTMLDivElement>('[data-case="live"]')!;
    for (const next of [" ", 0, "0", "title"]) {
      value.value = next;
      await settle();
      expect(root.textContent).toBe(String(next));
      expect(root.classList.contains("semi-divider-with-text")).toBe(true);
      expect(root.firstElementChild?.className).toBe("semi-divider_inner-text");
      expect(root.firstElementChild?.getAttribute("x-semi-prop")).toBe(
        "children",
      );
    }
    value.value = false;
    await settle();
    expect(root.textContent).toBe("");
    expect(root.classList.contains("semi-divider-with-text")).toBe(false);
    expect(root.firstElementChild?.className).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("Divider classifies native text and element branches while retaining its outlet", async () => {
  const element = shallowRef(false);
  const text = shallowRef("one");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider
        v-slots={{
          default: () => (
            <>
              {text.value}
              {element.value && <i>icon</i>}
            </>
          ),
        }}
      />
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLDivElement>(".semi-divider")!;
    const outlet = root.firstElementChild as HTMLSpanElement;
    expect(outlet.className).toBe("semi-divider_inner-text");
    element.value = true;
    await settle();
    expect(root.firstElementChild).toBe(outlet);
    expect(outlet.style.display).toBe("contents");
    expect(outlet.className).toBe("");
    expect(outlet.hasAttribute("x-semi-prop")).toBe(false);
    expect(root.textContent).toBe("oneicon");
    text.value = "";
    await settle();
    expect(root.classList.contains("semi-divider-with-text")).toBe(true);
    element.value = false;
    await settle();
    expect(root.firstElementChild).toBe(outlet);
    expect(root.classList.contains("semi-divider-with-text")).toBe(false);
    text.value = "restored";
    await settle();
    expect(outlet.className).toBe("semi-divider_inner-text");
    expect(outlet.style.display).toBe("");
    expect(root.textContent).toBe("restored");
  } finally {
    fixture.unmount();
  }
});

test("Divider preserves mounted slot state and focus through parent props and text updates", async () => {
  const label = shallowRef("first");
  const props = shallowRef<DividerProps>({ align: "left" });
  let mounts = 0;
  const Content = defineVaporComponent(() => {
    onMounted(() => mounts++);
    return (
      <>
        <input aria-label="slot input" />
        <span>{label.value}</span>
      </>
    );
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider {...props.value} v-slots={{ default: () => <Content /> }} />
    )),
  );
  try {
    await settle();
    const input = fixture.host.querySelector("input")!;
    input.value = "retained";
    input.focus();
    label.value = "next";
    props.value = { align: "right", margin: 7, dashed: true };
    await settle();
    expect(fixture.host.querySelector("input")).toBe(input);
    expect(input.value).toBe("retained");
    expect(document.activeElement).toBe(input);
    expect(fixture.host.textContent).toBe("next");
    expect(mounts).toBe(1);
  } finally {
    fixture.unmount();
  }
});

test("Divider never mounts vertical content and remounts it only on a new horizontal branch", async () => {
  const layout = shallowRef<DividerProps["layout"]>("vertical");
  let setups = 0;
  let mounts = 0;
  let unmounts = 0;
  const Content = defineVaporComponent(() => {
    setups++;
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <>text child</>;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider layout={layout.value} v-slots={{ default: () => <Content /> }} />
    )),
  );
  try {
    await settle();
    expect([setups, mounts, unmounts]).toEqual([0, 0, 0]);
    layout.value = "horizontal";
    await settle();
    expect([setups, mounts, unmounts]).toEqual([1, 1, 0]);
    expect(
      fixture.host.querySelector(".semi-divider_inner-text")?.textContent,
    ).toBe("text child");
    layout.value = "vertical";
    await settle();
    expect([setups, mounts, unmounts]).toEqual([1, 1, 1]);
    expect(fixture.host.querySelector(".semi-divider")!.textContent).toBe("");
    layout.value = undefined;
    await settle();
    expect([setups, mounts, unmounts]).toEqual([2, 2, 1]);
  } finally {
    fixture.unmount();
    expect(unmounts).toBe(2);
  }
});

test("Divider updates when the default slot itself is added and removed", async () => {
  const enabled = shallowRef(false);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider v-slots={enabled.value ? { default: () => <>added</> } : {}} />
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector(".semi-divider")!;
    expect(root.classList.contains("semi-divider-with-text")).toBe(false);
    enabled.value = true;
    await settle();
    expect(root.textContent).toBe("added");
    expect(root.classList.contains("semi-divider-with-text")).toBe(true);
    enabled.value = false;
    await settle();
    expect(root.textContent).toBe("");
    expect(root.classList.contains("semi-divider-with-text")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Divider does not normalize an invalid runtime layout into a horizontal margin", async () => {
  const input = shallowRef<DividerProps>({ margin: 12 });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Divider {...input.value} v-slots={{ default: () => <>text</> }} />
    )),
  );
  try {
    await settle();
    const root = fixture.host.querySelector<HTMLDivElement>(".semi-divider")!;
    expect(root.style.marginTop).toBe("12px");
    input.value = { layout: null, margin: 12 } as unknown as DividerProps;
    await settle();
    expect(root.className).toBe("semi-divider");
    expect(root.textContent).toBe("");
    expect(root.style.marginTop).toBe("");
    expect(root.style.marginBottom).toBe("");
    expect(root.style.marginLeft).toBe("");
    expect(root.style.marginRight).toBe("");
  } finally {
    fixture.unmount();
  }
});
