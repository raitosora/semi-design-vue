import {
  defineVaporComponent,
  nextTick,
  onMounted,
  onUnmounted,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Descriptions from "../../packages/semi-ui-vue/src/components/descriptions/index.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

test("Descriptions native ranges survive cross-row regrouping, fragment reorder, and remount", async () => {
  const ids = shallowRef(["a", "b", "c", "d"]);
  const column = shallowRef(2);
  const span = shallowRef<number | undefined>(undefined);
  const shown = shallowRef(true);
  let mounts = 0;
  let unmounts = 0;
  const Owned = defineVaporComponent<{ id: string }, {}, string, {}>(
    (props) => {
      onMounted(() => mounts++);
      onUnmounted(() => unmounts++);
      return (
        <>
          <input data-id={props.id} value={props.id} />
          <b>{props.id}</b>
        </>
      );
    },
    { props: ["id"], inheritAttrs: false },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions column={column.value} layout="horizontal">
        {() => (
          <>
            {shown.value ? (
              <For getKey={(id: string) => id} in={ids.value}>
                {(id: ShallowRef<string>) => (
                  <Descriptions.Item
                    itemKey={id.value}
                    span={id.value === "b" ? span.value : undefined}
                  >
                    {() => <Owned id={id.value} />}
                  </Descriptions.Item>
                )}
              </For>
            ) : null}
          </>
        )}
      </Descriptions>
    )),
  );
  try {
    await settle();
    expect(mounts).toBe(4);
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(2);
    const original =
      fixture.host.querySelector<HTMLInputElement>('[data-id="b"]')!;
    original.focus();
    original.setSelectionRange(0, 1);
    ids.value = ["b", "d", "a", "c"];
    await settle();
    expect(
      [...fixture.host.querySelectorAll<HTMLInputElement>("input")].map(
        (input) => input.value,
      ),
    ).toEqual(ids.value);
    expect(fixture.host.querySelector('[data-id="b"]')).toBe(original);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    // The retained range stays in its original row and is not unnecessarily moved.
    expect(document.activeElement).toBe(original);
    const moving =
      fixture.host.querySelector<HTMLInputElement>('[data-id="d"]')!;
    moving.focus();
    column.value = 1;
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(4);
    // A real Teleport relocation into another row retains the node but loses browser focus.
    expect(fixture.host.querySelector('[data-id="d"]')).toBe(moving);
    expect(document.activeElement).toBe(document.body);
    expect(fixture.host.querySelector('[data-id="b"]')).toBe(original);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    column.value = 4;
    span.value = 2;
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(2);
    expect(fixture.host.querySelector('[data-id="b"]')).toBe(original);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    ids.value = ["b", "c", "e"];
    await settle();
    expect(mounts).toBe(5);
    expect(unmounts).toBe(2);
    expect(fixture.host.querySelector('[data-id="b"]')).toBe(original);
    shown.value = false;
    await settle();
    expect(unmounts).toBe(5);
    expect(fixture.host.querySelectorAll("tr")).toHaveLength(0);
    shown.value = true;
    await settle();
    expect(mounts).toBe(8);
  } finally {
    fixture.unmount();
  }
  await settle();
  expect(unmounts).toBe(8);
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Descriptions releases observer and ignores queued delivery after unmount", async () => {
  const Native = window.MutationObserver;
  const callbacks: MutationCallback[] = [];
  const disconnect = vi.fn();
  const observe = vi.fn();
  const spy = vi
    .spyOn(window, "MutationObserver")
    .mockImplementation(function (callback) {
      callbacks.push(callback);
      return {
        observe,
        disconnect,
        takeRecords: () => [],
      } as unknown as MutationObserver;
    });
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Descriptions layout="horizontal">
          {() => <Descriptions.Item children="value" itemKey="a" />}
        </Descriptions>
      )),
    );
    await settle();
    expect(observe).toHaveBeenCalled();
    const observer = new Native(() => undefined);
    callbacks.forEach((callback) => callback([], observer));
    await settle();
    fixture.unmount();
    fixture = undefined;
    const count = observe.mock.calls.length;
    callbacks.forEach((callback) => callback([], observer));
    await settle();
    expect(observe).toHaveBeenCalledTimes(count);
    expect(disconnect).toHaveBeenCalled();
    observer.disconnect();
  } finally {
    fixture?.unmount();
    spy.mockRestore();
  }
});

test("Descriptions static registration and prop regrouping work without MutationObserver", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  const column = shallowRef(1);
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Descriptions
          column={column.value}
          data={[
            { key: "a", value: 1 },
            { key: "b", value: 2 },
          ]}
          layout="horizontal"
        />
      )),
    );
    await settle();
    expect(fixture.host.querySelectorAll("tr")).toHaveLength(2);
    column.value = 2;
    await settle();
    expect(fixture.host.querySelectorAll("tr")).toHaveLength(1);
  } finally {
    fixture?.unmount();
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
});

test("Descriptions data tail append avoids moving a focused existing native range", async () => {
  const content = () => <input data-existing="" value="stable" />;
  const data = shallowRef([{ key: "first", value: content }]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions data={data.value} layout="horizontal" />
    )),
  );
  try {
    await settle();
    const input = fixture.host.querySelector<HTMLInputElement>("input")!;
    input.focus();
    input.setSelectionRange(1, 4);
    data.value = [...data.value, { key: "second", value: () => <b>tail</b> }];
    await settle();
    expect(fixture.host.querySelector("[data-existing]")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(4);
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(1);
    expect(
      [...fixture.host.querySelectorAll(".semi-descriptions-key")].map(
        (key) => key.textContent,
      ),
    ).toEqual(["first", "second"]);
  } finally {
    fixture.unmount();
  }
});

test("Descriptions nonplain horizontal placeholders update their occupied span dynamically", async () => {
  const data = shallowRef([
    Object.assign([], { span: 1 }),
    { key: "real", value: "value" },
  ]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Descriptions data={data.value} layout="horizontal" />
    )),
  );
  try {
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(1);
    data.value = [
      Object.assign([], { span: 3 }),
      { key: "real", value: "value" },
    ];
    await settle();
    expect(fixture.host.querySelectorAll("tbody > tr")).toHaveLength(2);
    expect(
      fixture.host.querySelector("tr")?.querySelectorAll("td"),
    ).toHaveLength(0);
    expect(fixture.host.textContent).toBe("realvalue");
  } finally {
    fixture.unmount();
  }
});
