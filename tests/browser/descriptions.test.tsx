import {
  defineVaporComponent,
  nextTick,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test } from "vitest";
import Descriptions from "../../packages/semi-ui-vue/src/components/descriptions/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Descriptions data wins over children and horizontal spans preserve inputs", async () => {
  const data = shallowRef([
    { key: "a", value: 0 },
    { key: "b", value: "B" },
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions data={data.value} layout="horizontal">
        {() => (
          <Descriptions.Item itemKey="fallback">
            {() => <span>fallback</span>}
          </Descriptions.Item>
        )}
      </Descriptions>
    )),
  );
  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(1);
    expect(fixture.host.querySelectorAll("td")[1]?.colSpan).toBe(3);
    expect(fixture.host.textContent).toBe("a0bB");
    expect(data.value[1]).not.toHaveProperty("span");
    data.value = [];
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fixture.host.textContent).toBe("fallbackfallback");
  } finally {
    fixture.unmount();
  }
});

test("Descriptions native keyed children keep DOM and reorder inside a horizontal row", async () => {
  const ids = shallowRef(["a", "b", "c"]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions layout="horizontal">
        {() => (
          <For getKey={(id: string) => id} in={ids.value}>
            {(id: ShallowRef<string>) => (
              <Descriptions.Item itemKey={id.value} key={id.value}>
                {() => <input data-item={id.value} value={id.value} />}
              </Descriptions.Item>
            )}
          </For>
        )}
      </Descriptions>
    )),
  );
  try {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const original = fixture.host.querySelector('[data-item="a"]');
    expect(fixture.host.querySelectorAll("input")).toHaveLength(3);
    ids.value = ["c", "a", "b"];
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(
      [...fixture.host.querySelectorAll("input")].map((el) => el.value),
    ).toEqual(["c", "a", "b"]);
    expect(fixture.host.querySelector('[data-item="a"]')).toBe(original);
  } finally {
    fixture.unmount();
  }
});
