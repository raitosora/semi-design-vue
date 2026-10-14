import {
  createVaporApp,
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Descriptions from "../../packages/semi-ui-vue/src/components/descriptions/index.js";
import { nativeDescriptionsContent } from "../../packages/semi-ui-vue/src/components/descriptions/render.js";
import { dataEntries } from "../../packages/semi-ui-vue/src/components/descriptions/data.js";
import type {
  Data,
  DescriptionsProps,
  DescriptionsItemProps,
  DescriptionsRenderResult,
} from "../../packages/semi-ui-vue/src/components/descriptions/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

test("Descriptions defaults, nulls, dynamic removals and data precedence remain literal", async () => {
  const input = shallowRef<DescriptionsProps>({});
  const fallback = vi.fn(() => (
    <Descriptions.Item children="fallback" itemKey="key" />
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions {...input.value}>{fallback}</Descriptions>
    )),
  );
  try {
    expect(
      [...fixture.host.querySelector(".semi-descriptions")!.classList].sort(),
    ).toEqual([
      "semi-descriptions",
      "semi-descriptions-center",
      "semi-descriptions-vertical",
    ]);
    expect(fixture.host.textContent).toBe("keyfallback");
    for (const data of [undefined, null, false, 0, []]) {
      input.value = { data } as DescriptionsProps;
      await settle();
      expect(fixture.host.textContent).toBe("keyfallback");
    }
    input.value = { data: Array(2) };
    await settle();
    expect(fixture.host.querySelectorAll("tr")).toHaveLength(0);
    input.value = {
      align: null,
      layout: null,
      row: null,
    } as unknown as DescriptionsProps;
    await settle();
    expect(fixture.host.querySelector(".semi-descriptions")?.className).toBe(
      "semi-descriptions semi-descriptions-null",
    );
    input.value = { align: "plain", row: true, size: "small" };
    await settle();
    expect(fixture.host.querySelectorAll("th")).toHaveLength(0);
    expect(fixture.host.textContent).toBe("key:fallback");
    input.value = {
      align: undefined,
      layout: undefined,
      row: undefined,
      size: undefined,
    };
    await settle();
    expect(
      [...fixture.host.querySelector(".semi-descriptions")!.classList].sort(),
    ).toEqual([
      "semi-descriptions",
      "semi-descriptions-center",
      "semi-descriptions-vertical",
    ]);
  } finally {
    fixture.unmount();
  }
});

test("Descriptions attributes, escaping, styling and event bubbling match supported wrappers", async () => {
  const props = shallowRef<DescriptionsProps>({});
  const item = shallowRef<DescriptionsItemProps>({
    className: "item-extra",
    style: { color: "red" },
    "data-item": "yes",
    keyStyle: { width: "90px" },
    itemKey: "<key>",
  });
  const outer = vi.fn();
  const ignored = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section onClick={outer}>
        <Descriptions
          {...props.value}
          {...{
            id: "ignored",
            onClick: ignored,
            role: "list",
            "aria-live": "polite",
          }}
          class="root-extra"
          data-root="yes"
        >
          {() => (
            <Descriptions.Item {...item.value}>
              {() => <button>{"<value>"}</button>}
            </Descriptions.Item>
          )}
        </Descriptions>
      </section>
    )),
  );
  try {
    const root = fixture.host.querySelector(".semi-descriptions")!;
    expect(root.getAttribute("data-root")).toBe("yes");
    for (const attr of ["id", "role", "aria-live"])
      expect(root.hasAttribute(attr)).toBe(false);
    expect(root.classList.contains("root-extra")).toBe(true);
    expect(root.querySelector("tr")?.getAttribute("data-item")).toBe("yes");
    expect(
      root.querySelector<HTMLElement>(".semi-descriptions-key")?.style.width,
    ).toBe("90px");
    root.querySelector<HTMLButtonElement>("button")!.click();
    expect(outer).toHaveBeenCalledTimes(1);
    expect(ignored).not.toHaveBeenCalled();
    expect(root.textContent).toBe("<key><value>");
    expect(root.querySelector("key,value")).toBeNull();
    props.value = { layout: "horizontal" };
    await settle();
    expect(root.querySelector("tr")?.hasAttribute("data-item")).toBe(false);
    expect(root.querySelector(".item-extra")).toBeNull();
    item.value = { itemKey: "next", span: 2 };
    await settle();
    expect(
      root.querySelector<HTMLElement>(".semi-descriptions-key")?.style.width,
    ).toBe("");
    expect(root.querySelector("td")?.colSpan).toBe(3);
  } finally {
    fixture.unmount();
  }
});

test("Descriptions renderer ownership, slot presence, nested context and unmount cleanup", async () => {
  const show = shallowRef(true);
  const label = shallowRef("first");
  const hidden = shallowRef(false);
  let mounts = 0;
  let unmounts = 0;
  const Owned = defineVaporComponent(() => {
    const context = inject("description-probe");
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <input data-owned="" value={`${context}:${label.value}`} />;
  });
  const renderer = vi.fn(() => <Owned />);
  const unused = vi.fn(() => <b>unused</b>);
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("description-probe", "provided");
      return (
        <>
          {show.value ? (
            <Descriptions layout="horizontal">
              {() => (
                <>
                  <Descriptions.Item
                    children={renderer}
                    hidden={hidden.value}
                    itemKey="outer"
                  />
                  <Descriptions.Item children={unused} itemKey="empty">
                    {() => null}
                  </Descriptions.Item>
                  <Descriptions.Item itemKey="nested">
                    {() => (
                      <Descriptions align="plain">
                        {() => (
                          <Descriptions.Item children="value" itemKey="inner" />
                        )}
                      </Descriptions>
                    )}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          ) : null}
        </>
      );
    }),
  );
  try {
    await settle();
    expect(renderer).toHaveBeenCalledTimes(1);
    expect(unused).not.toHaveBeenCalled();
    expect(mounts).toBe(1);
    const input = fixture.host.querySelector<HTMLInputElement>("[data-owned]")!;
    input.focus();
    label.value = "second";
    await settle();
    expect(fixture.host.querySelector("[data-owned]")).toBe(input);
    expect(input.value).toBe("provided:second");
    expect(document.activeElement).toBe(input);
    expect(fixture.host.textContent).toContain("inner:value");
    hidden.value = true;
    await settle();
    expect(unmounts).toBe(1);
    hidden.value = false;
    await settle();
    expect(mounts).toBe(2);
    show.value = false;
    await settle();
    expect(unmounts).toBe(2);
    show.value = true;
    await settle();
    expect(mounts).toBe(3);
  } finally {
    fixture.unmount();
  }
  await settle();
  expect(unmounts).toBe(3);
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Descriptions renderer primitives and invalid values are not stringified objects", async () => {
  const native = document.createElement("b");
  expect(nativeDescriptionsContent(native)).toBe(native);
  expect(
    nativeDescriptionsContent(["text", 0, null, false, undefined]),
  ).toHaveLength(5);
  for (const bad of [{}, Symbol("bad"), 1n])
    expect(() =>
      nativeDescriptionsContent(bad as DescriptionsRenderResult),
    ).toThrow(TypeError);
  const promise = Promise.reject(new Error("expected renderer rejection"));
  expect(() =>
    nativeDescriptionsContent(promise as unknown as DescriptionsRenderResult),
  ).toThrow("synchronous");
  await Promise.resolve();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions
        data={[
          { key: 0, value: false },
          { key: "x", value: () => ["A", 0, null, [false, "B"]] },
        ]}
      />
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("0xA0B");
  } finally {
    fixture.unmount();
  }
});

test("Descriptions preserves sparse selection, filters vertical nonobjects, and rejects malformed horizontal data", () => {
  const sparse = new Array<Data>(4);
  sparse[2] = { value: 0 };
  expect(dataEntries(sparse).map((entry) => entry.index)).toEqual([2]);
  expect(
    dataEntries([
      null,
      false,
      0,
      [],
      { value: "valid" },
    ] as unknown as Data[]).map((entry) => entry.index),
  ).toEqual([4]);
  expect(dataEntries([false, 0, []] as unknown as Data[], true)).toHaveLength(
    3,
  );
  for (const value of [null, undefined])
    expect(() => dataEntries([value] as unknown as Data[], true)).toThrow(
      TypeError,
    );
  for (const value of ["string", { length: 1 }])
    expect(() => dataEntries(value as unknown as Data[])).toThrow(TypeError);
  expect(dataEntries(undefined)).toEqual([]);
});

test("Descriptions.Item outside a provider fails without adding public methods", () => {
  const host = document.createElement("div");
  const app = createVaporApp(
    defineVaporComponent(() => <Descriptions.Item children="orphan" />),
  );
  app.config.warnHandler = () => undefined;
  app.config.errorHandler = () => undefined;
  try {
    app.mount(host);
    expect(host.textContent).toBe("");
  } finally {
    app.unmount();
  }
});
