import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Descriptions from "../../packages/semi-ui-vue/src/components/descriptions/index.js";
import type {
  Data,
  DescriptionsProps,
  DescriptionsItemProps,
} from "../../packages/semi-ui-vue/src/components/descriptions/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
const spans = (host: Element) =>
  [...host.querySelectorAll("td")].map((cell) => cell.getAttribute("colspan"));

// Fixed getHorizontalList uses JS >=, || and isNaN; invalid runtime values
// are observed literally, not normalized to a convenient positive column count.
test.each([
  [undefined, 1, ["3", "1"]],
  [null, 2, ["3", "1"]],
  [false, 2, ["3", "1"]],
  [0, 2, ["3", "1"]],
  [-1, 2, ["3", "1"]],
  [Number.NaN, 1, ["3", "1"]],
  [1, 2, ["3", "1"]],
  [2, 2, ["3", "3"]],
  [4, 1, ["3", "3"]],
] as const)(
  "Descriptions horizontal column %s keeps literal row grouping",
  async (column, rows, expected) => {
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Descriptions
          {...({ column } as unknown as DescriptionsProps)}
          data={[
            { key: "A", value: "a", span: 2 },
            { key: "B", value: "b" },
          ]}
          layout="horizontal"
        />
      )),
    );
    try {
      await settle();
      expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(rows);
      expect(spans(fixture.host)).toEqual(expected);
      expect(fixture.host.textContent).toBe("AaBb");
    } finally {
      fixture.unmount();
    }
  },
);

test("Descriptions column, hidden and span updates regroup and explicit undefined restores defaults", async () => {
  const input = shallowRef<DescriptionsProps>({
    column: 2,
    layout: "horizontal",
  });
  const item = shallowRef<DescriptionsItemProps>({ span: 2 });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions {...input.value}>
        {() => (
          <>
            <Descriptions.Item {...item.value} children="a" itemKey="A" />
            <Descriptions.Item children="b" itemKey="B" />
          </>
        )}
      </Descriptions>
    )),
  );
  try {
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(2);
    expect(spans(fixture.host)).toEqual(["3", "3"]);
    input.value = { column: undefined, layout: "horizontal" };
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(1);
    expect(spans(fixture.host)).toEqual(["3", "1"]);
    item.value = { hidden: true, span: 2 };
    await settle();
    expect(fixture.host.textContent).toBe("Bb");
    expect(spans(fixture.host)).toEqual(["5"]);
    item.value = { hidden: undefined, span: undefined };
    await settle();
    expect(spans(fixture.host)).toEqual(["1", "3"]);
    input.value = { layout: "horizontal", column: 1 };
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(2);
    input.value = { layout: "horizontal" };
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(1);
    item.value = {};
    await settle();
    expect(spans(fixture.host)).toEqual(["1", "3"]);
  } finally {
    fixture.unmount();
  }
});

test("Descriptions tail span null false zero and NaN retain upstream coercion", async () => {
  const item = shallowRef<DescriptionsItemProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions layout="horizontal">
        {() => (
          <Descriptions.Item {...item.value} children="value" itemKey="key" />
        )}
      </Descriptions>
    )),
  );
  try {
    await settle();
    expect(spans(fixture.host)).toEqual(["5"]);
    for (const span of [null, false, 0]) {
      item.value = { span } as unknown as DescriptionsItemProps;
      await settle();
      expect(spans(fixture.host)).toEqual(["1"]);
    }
    item.value = { span: Number.NaN };
    await settle();
    expect(spans(fixture.host)).toEqual(["5"]);
    item.value = { span: -1 };
    await settle();
    expect(spans(fixture.host)).toEqual(["-3"]);
    expect(fixture.host.querySelector("td")?.colSpan).toBe(1);
    item.value = {};
    await settle();
    expect(spans(fixture.host)).toEqual(["5"]);
  } finally {
    fixture.unmount();
  }
});

test("Descriptions horizontal nonplain entries consume columns without becoming cells", async () => {
  const data = shallowRef<Data[]>([
    [],
    { key: "B", value: "b" },
  ] as unknown as Data[]);
  const input = shallowRef<DescriptionsProps>({
    column: 1,
    layout: "horizontal",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions {...input.value} data={data.value} />
    )),
  );
  try {
    await settle();
    const rows = fixture.host.querySelectorAll("tbody > tr");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelectorAll("th,td")).toHaveLength(0);
    expect(rows[1]?.textContent).toBe("Bb");
    input.value = { column: 3, layout: "horizontal" };
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(1);
    expect(spans(fixture.host)).toEqual(["3"]);
    const sparse = new Array<Data>(4);
    sparse[2] = { key: "S", value: 0 };
    data.value = sparse;
    await settle();
    expect(fixture.host.textContent).toBe("S0");
    expect(spans(fixture.host)).toEqual(["5"]);
    data.value = Array(3);
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(0);
    data.value = [false, 0] as unknown as Data[];
    input.value = { column: 1, layout: "horizontal" };
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(2);
    expect(fixture.host.querySelectorAll("th,td")).toHaveLength(0);
  } finally {
    fixture.unmount();
  }
});

test("Descriptions runtime data fields preserve spread order and vertical-only row attrs", async () => {
  const input = shallowRef<DescriptionsProps>({});
  const data = [
    {
      key: "source-key",
      itemKey: "override-key",
      value: "value",
      children: "ignored",
      className: "data-row",
      style: { color: "red" },
      keyStyle: { color: "blue" },
      "data-row": "yes",
      role: "row",
      "aria-live": "polite",
    },
  ] as unknown as Data[];
  const fixture = mountVapor(
    defineVaporComponent(() => <Descriptions {...input.value} data={data} />),
  );
  try {
    const row = fixture.host.querySelector<HTMLTableRowElement>("tr")!;
    expect(row.textContent).toBe("override-keyvalue");
    expect(row.className).toBe("data-row");
    expect(row.style.color).toBe("red");
    expect(row.getAttribute("data-row")).toBe("yes");
    expect(row.hasAttribute("role")).toBe(false);
    expect(row.hasAttribute("aria-live")).toBe(false);
    expect(
      row.querySelector<HTMLElement>(".semi-descriptions-key")?.style.color,
    ).toBe("blue");
    input.value = { layout: "horizontal" };
    await settle();
    const horizontal = fixture.host.querySelector<HTMLTableRowElement>("tr")!;
    expect(horizontal.className).toBe("");
    expect(horizontal.style.color).toBe("");
    expect(horizontal.hasAttribute("data-row")).toBe(false);
    expect(horizontal.textContent).toBe("override-keyvalue");
  } finally {
    fixture.unmount();
  }
});

test("Descriptions empty itemKey and value slots suppress props without being preexecuted", async () => {
  const label = shallowRef<string | undefined>(undefined);
  const keyFactory = vi.fn(() => "unused key");
  const valueFactory = vi.fn(() => "unused value");
  const keySlot = vi.fn(() => <>{label.value ? <b>{label.value}</b> : null}</>);
  const valueSlot = vi.fn(() => <></>);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions>
        {() => (
          <Descriptions.Item
            children={valueFactory}
            itemKey={keyFactory}
            v-slots={{ itemKey: keySlot, default: valueSlot }}
          />
        )}
      </Descriptions>
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("");
    expect(keySlot).toHaveBeenCalledTimes(1);
    expect(valueSlot).toHaveBeenCalledTimes(1);
    expect(keyFactory).not.toHaveBeenCalled();
    expect(valueFactory).not.toHaveBeenCalled();
    label.value = "live key";
    await settle();
    expect(fixture.host.textContent).toBe("live key");
    expect(keySlot).toHaveBeenCalledTimes(1);
    expect(valueSlot).toHaveBeenCalledTimes(1);
    label.value = undefined;
    await settle();
    expect(fixture.host.textContent).toBe("");
    expect(keyFactory).not.toHaveBeenCalled();
  } finally {
    fixture.unmount();
  }
});

test.each(["bad", { length: 1 }, [null], [undefined]])(
  "Descriptions invalid horizontal data records actual error diagnostics: %j",
  async (data) => {
    const host = document.createElement("div");
    document.body.append(host);
    const errors: unknown[] = [];
    const warnings: string[] = [];
    const app = createVaporApp(
      defineVaporComponent(() => (
        <Descriptions data={data as unknown as Data[]} layout="horizontal" />
      )),
    );
    app.config.errorHandler = (error) => {
      errors.push(error);
    };
    app.config.warnHandler = (warning) => {
      warnings.push(warning);
    };
    try {
      app.mount(host);
      await settle();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every((error) => error instanceof TypeError)).toBe(true);
      expect(warnings.every((warning) => warning.includes("non-block"))).toBe(
        true,
      );
      expect(host.querySelectorAll("tr")).toHaveLength(0);
      console.info(
        "Descriptions invalid data diagnostics",
        JSON.stringify({ data, errors: errors.map(String), warnings }),
      );
    } finally {
      app.unmount();
      host.remove();
    }
  },
);
