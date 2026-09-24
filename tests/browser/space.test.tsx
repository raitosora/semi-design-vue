import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Space from "../../packages/semi-ui-vue/src/components/space/index.js";
import type { SpaceProps } from "../../packages/semi-ui-vue/src/components/space/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

test("Space restores upstream defaults after explicit undefined and dynamic removal", async () => {
  const input = shallowRef<SpaceProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Space {...input.value}>{() => <button>item</button>}</Space>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-space")!;
    expect(root.className).toBe(
      "semi-space semi-space-align-center semi-space-horizontal semi-space-tight-horizontal semi-space-tight-vertical",
    );
    expect(root.children).toHaveLength(1);
    expect(root.getAttribute("role")).toBeNull();
    input.value = {
      vertical: true,
      wrap: true,
      align: "baseline",
      spacing: "loose",
    };
    await settle();
    expect(root.classList.contains("semi-space-vertical")).toBe(true);
    expect(root.classList.contains("semi-space-wrap")).toBe(false);
    expect(root.classList.contains("semi-space-align-baseline")).toBe(true);
    input.value = {
      vertical: undefined,
      wrap: undefined,
      align: undefined,
      spacing: undefined,
    };
    await settle();
    expect(root.className).toBe(
      "semi-space semi-space-align-center semi-space-horizontal semi-space-tight-horizontal semi-space-tight-vertical",
    );
    input.value = { wrap: true, align: "end", spacing: "medium" };
    await settle();
    expect(root.classList.contains("semi-space-wrap")).toBe(true);
    expect(root.classList.contains("semi-space-align-end")).toBe(true);
    expect(root.classList.contains("semi-space-medium-horizontal")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Space resolves both gap axes and preserves upstream inline style precedence", async () => {
  const style = Object.freeze({
    columnGap: "33px",
    rowGap: "41px",
    color: "red",
  });
  const input = shallowRef<SpaceProps>({ spacing: "tight", style });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Space {...input.value}>
        {() => (
          <>
            <i>A</i>
            <i>B</i>
          </>
        )}
      </Space>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-space")!;
    expect(root.style.columnGap).toBe("33px");
    expect(root.style.rowGap).toBe("41px");
    input.value = { spacing: 0, style };
    await settle();
    expect(root.style.columnGap).toBe("0px");
    expect(root.style.rowGap).toBe("0px");
    expect(style).toEqual({ columnGap: "33px", rowGap: "41px", color: "red" });
    input.value = { spacing: [10, "loose"], style };
    await settle();
    expect(root.style.columnGap).toBe("10px");
    expect(root.style.rowGap).toBe("41px");
    expect(root.classList.contains("semi-space-loose-vertical")).toBe(true);
    input.value = { spacing: ["medium", 12], style: { color: "blue" } };
    await settle();
    expect(root.style.columnGap).toBe("");
    expect(root.style.rowGap).toBe("12px");
    expect(root.classList.contains("semi-space-medium-horizontal")).toBe(true);
    input.value = { spacing: [7] };
    await settle();
    expect(root.style.columnGap).toBe("7px");
    expect(root.style.rowGap).toBe("");
    input.value = { spacing: [1, 2, 999] };
    await settle();
    expect(root.style.columnGap).toBe("1px");
    expect(root.style.rowGap).toBe("2px");
    input.value = { spacing: [] };
    await settle();
    expect(root.style.cssText).toBe("");
    expect(root.className).toBe(
      "semi-space semi-space-align-center semi-space-horizontal",
    );
    input.value = {};
    await settle();
    expect(root.classList.contains("semi-space-tight-horizontal")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("Space forwards root attributes while the native slot owns empty, text and fragment content", async () => {
  const click = vi.fn();
  const text = shallowRef<string | number | boolean>("");
  const input = shallowRef<SpaceProps>({
    class: ["custom", { active: true }],
    className: "legacy",
    id: "space-id",
    role: "group",
    "aria-label": "Actions",
    onClick: click,
  });
  const forbidden = {
    innerHTML: "<b>unsafe</b>",
    textContent: "replacement",
    "inner-html": "<b>unsafe</b>",
    "text-content": "replacement",
  };
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Space {...input.value} {...forbidden} data-purpose="actions">
        {() => (
          <>
            {text.value}
            <>
              <button>A</button>
              {false && <i />}
              <button>B</button>
            </>
          </>
        )}
      </Space>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-space")!;
    expect(root.querySelectorAll(":scope > button")).toHaveLength(2);
    expect(root.querySelector("b")).toBeNull();
    expect(root.id).toBe("space-id");
    expect(root.dataset.purpose).toBe("actions");
    expect(root.classList.contains("custom")).toBe(true);
    expect(root.classList.contains("legacy")).toBe(true);
    const event = new MouseEvent("click", { bubbles: true });
    root.dispatchEvent(event);
    expect(click).toHaveBeenCalledExactlyOnceWith(event);
    for (const value of [" ", 0, "word", false]) {
      text.value = value;
      await settle();
      expect(root.textContent).toBe(`${value === false ? "" : value}AB`);
      expect(root.querySelectorAll(":scope > button")).toHaveLength(2);
    }
    input.value = { class: "next" };
    await settle();
    expect(root.classList.contains("legacy")).toBe(false);
    expect(root.classList.contains("next")).toBe(true);
    expect(root.getAttribute("role")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Space leaves empty and conditional fragments unwrapped and supports nested spaces", async () => {
  const visible = shallowRef(false);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section>
        <Space data-case="absent" />
        <Space data-case="empty">{() => <></>}</Space>
        <Space data-case="dynamic">
          {() => (
            <>
              {visible.value && (
                <>
                  <span>A</span>
                  <Space spacing={4}>
                    {() => (
                      <>
                        <i>B</i>
                        <i>C</i>
                      </>
                    )}
                  </Space>
                </>
              )}
            </>
          )}
        </Space>
      </section>
    )),
  );
  try {
    const absent = fixture.host.querySelector<HTMLElement>(
      '[data-case="absent"]',
    )!;
    const empty = fixture.host.querySelector<HTMLElement>(
      '[data-case="empty"]',
    )!;
    const dynamic = fixture.host.querySelector<HTMLElement>(
      '[data-case="dynamic"]',
    )!;
    expect(absent.children).toHaveLength(0);
    expect(empty.children).toHaveLength(0);
    expect(dynamic.children).toHaveLength(0);
    visible.value = true;
    await settle();
    expect([...dynamic.children].map((child) => child.tagName)).toEqual([
      "SPAN",
      "DIV",
    ]);
    expect(dynamic.querySelectorAll(":scope > .semi-space > i")).toHaveLength(
      2,
    );
    visible.value = false;
    await settle();
    expect(dynamic.children).toHaveLength(0);
  } finally {
    fixture.unmount();
  }
});

test("Space uses browser flex items for text while whitespace creates no extra gap", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section>
        <Space
          data-case="text-gap"
          spacing={8}
          style={{ display: "inline-flex" }}
        >
          {() => (
            <>
              甲<button>乙</button>
            </>
          )}
        </Space>
        <Space
          data-case="whitespace-gap"
          spacing={8}
          style={{ display: "inline-flex" }}
        >
          {() => (
            <>
              <span>A</span>
              {"   "}
              <span>B</span>
            </>
          )}
        </Space>
      </section>
    )),
  );
  try {
    const textRoot = fixture.host.querySelector<HTMLElement>(
      '[data-case="text-gap"]',
    )!;
    const text = [...textRoot.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE,
    )!;
    const range = document.createRange();
    range.selectNodeContents(text);
    const textBox = range.getBoundingClientRect();
    const buttonBox = textRoot.querySelector("button")!.getBoundingClientRect();
    expect(Math.abs(buttonBox.left - textBox.right - 8)).toBeLessThan(1);
    expect(textRoot.children).toHaveLength(1);
    const whitespaceRoot = fixture.host.querySelector<HTMLElement>(
      '[data-case="whitespace-gap"]',
    )!;
    const [first, second] = [...whitespaceRoot.children].map((child) =>
      child.getBoundingClientRect(),
    );
    expect(Math.abs(second.left - first.right - 8)).toBeLessThan(1);
    expect(whitespaceRoot.children).toHaveLength(2);
  } finally {
    fixture.unmount();
  }
});

test("Space preserves keyed slot items, state and focus through layout updates and reordering", async () => {
  const items = shallowRef(["a", "b", "c"]);
  const input = shallowRef<SpaceProps>({});
  const mounted = ref(true);
  let mounts = 0;
  let unmounts = 0;
  const Item = defineVaporComponent<{ id: string }>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      const count = ref(0);
      return (
        <button data-id={props.id} onClick={() => count.value++}>
          {props.id}:{count.value}
        </button>
      );
    },
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <div>
        {mounted.value && (
          <Space {...input.value}>
            {() => (
              <For getKey={(id: string) => id} in={items.value}>
                {{
                  default: (id: ShallowRef<unknown>) => (
                    <Item id={id.value as string} />
                  ),
                }}
              </For>
            )}
          </Space>
        )}
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-space")!;
    const button = root.querySelector<HTMLButtonElement>('[data-id="b"]')!;
    button.click();
    button.focus();
    input.value = {
      vertical: true,
      align: "start",
      spacing: [4, 12],
      wrap: true,
    };
    await settle();
    expect(root.querySelector('[data-id="b"]')).toBe(button);
    expect(button.textContent).toBe("b:1");
    expect(document.activeElement).toBe(button);
    items.value = ["c", "b", "d"];
    await settle();
    expect(
      [...root.querySelectorAll("button")].map((node) => node.dataset.id),
    ).toEqual(["c", "b", "d"]);
    expect(root.querySelector('[data-id="b"]')).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(1);
    mounted.value = false;
    await settle();
    expect(unmounts).toBe(4);
    mounted.value = true;
    await settle();
    expect(mounts).toBe(7);
  } finally {
    fixture.unmount();
  }
});
