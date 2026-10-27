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
import Timeline from "../../packages/semi-ui-vue/src/components/timeline/index.js";
import type {
  Data,
  TimelineItemProps,
  TimelineItemSlots,
  TimelineProps,
} from "../../packages/semi-ui-vue/src/components/timeline/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
const positions = (root: ParentNode) =>
  [...root.querySelectorAll("ul.semi-timeline > li")].map((item) =>
    [...item.classList].filter((name) =>
      /^semi-timeline-item-(left|right|odd)$/.test(name),
    ),
  );

test("Timeline data content wins over children and nonempty data suppresses default slot", async () => {
  const data = shallowRef<Data[] | undefined>([
    { content: "data", children: "ignored", time: "today" },
  ]);
  const slot = vi.fn(() => <Timeline.Item children="native" />);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline dataSource={data.value}>{slot}</Timeline>
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("datatoday");
    expect(slot).not.toHaveBeenCalled();
    data.value = [];
    await settle();
    expect(fixture.host.textContent).toBe("native");
    expect(slot).toHaveBeenCalledTimes(1);
    data.value = [{ content: 0, children: "ignored" }];
    await settle();
    expect(fixture.host.textContent).toBe("0");
    data.value = [{ content: undefined, children: "ignored" }];
    await settle();
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
});

test("Timeline mode and position track defaults, explicit undefined, removal and invalid runtime values", async () => {
  const input = shallowRef<TimelineProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline {...input.value}>
        {() => (
          <>
            <Timeline.Item children="a" position="right" />
            <Timeline.Item children="b" />
            <Timeline.Item children="c" />
          </>
        )}
      </Timeline>
    )),
  );
  try {
    await settle();
    expect(positions(fixture.host)).toEqual([
      ["semi-timeline-item-left"],
      ["semi-timeline-item-left"],
      ["semi-timeline-item-left"],
    ]);
    for (const mode of ["right", "center", "alternate"] as const) {
      input.value = { mode };
      await settle();
      expect(fixture.host.querySelector("ul")?.classList).toContain(
        `semi-timeline-${mode}`,
      );
      expect(positions(fixture.host)).toEqual(
        (mode === "right"
          ? ["right", "right", "right"]
          : mode === "center"
            ? ["right", "left", "left"]
            : ["right", "right", "left"]
        ).map((position) => [`semi-timeline-item-${position}`]),
      );
    }
    for (const mode of [null, false, 0, "odd"]) {
      input.value = { mode } as unknown as TimelineProps;
      await settle();
      expect(positions(fixture.host)).toEqual([
        ["semi-timeline-item-right"],
        [],
        [],
      ]);
    }
    for (const value of [{ mode: undefined }, {}]) {
      input.value = value;
      await settle();
      expect(fixture.host.querySelector("ul")?.classList).toContain(
        "semi-timeline-left",
      );
      expect(positions(fixture.host)[0]).toEqual(["semi-timeline-item-left"]);
    }
  } finally {
    fixture.unmount();
  }
});

test("Timeline sparse data skips holes while alternate keeps source indices", async () => {
  const data = Array<Data>(4);
  data[1] = { content: "one" };
  data[3] = { content: "three" };
  const fixture = mountVapor(
    defineVaporComponent(() => <Timeline dataSource={data} mode="alternate" />),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("onethree");
    expect(positions(fixture.host)).toEqual([
      ["semi-timeline-item-right"],
      ["semi-timeline-item-right"],
    ]);
  } finally {
    fixture.unmount();
  }
});

test("Timeline Item source truthiness controls dot, extra, time and type without coercion", async () => {
  const input = shallowRef<TimelineItemProps>({ children: "body" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Timeline.Item {...input.value} />),
  );
  try {
    const head = () =>
      fixture.host.querySelector<HTMLElement>(".semi-timeline-item-head")!;
    expect(head().classList).toContain("semi-timeline-item-head-default");
    expect(fixture.host.querySelector("li")?.classList).not.toContain(
      "semi-timeline-item-left",
    );
    for (const type of ["ongoing", "success", "warning", "error"] as const) {
      input.value = {
        children: "body",
        type,
        color: "red",
        dot: "dot",
        extra: "extra",
        time: "time",
      };
      await nextTick();
      expect(head().classList).toContain(`semi-timeline-item-head-${type}`);
      expect(head().classList).toContain("semi-timeline-item-head-custom");
      expect(head().style.backgroundColor).toBe("red");
      expect(fixture.host.textContent).toBe("dotbodyextratime");
    }
    input.value = { children: "body", dot: 0, extra: 0, time: 0 };
    await nextTick();
    expect(head().textContent).toBe("0");
    expect(head().style.backgroundColor).toBe("");
    expect(head().classList).not.toContain("semi-timeline-item-head-custom");
    expect(fixture.host.textContent).toBe("0body00");
    expect(
      fixture.host.querySelector(".semi-timeline-item-content-extra"),
    ).toBeNull();
    expect(
      fixture.host.querySelector(".semi-timeline-item-content-time"),
    ).toBeNull();
    for (const value of [null, false]) {
      input.value = {
        children: "body",
        dot: value,
        extra: value,
        time: value,
        type: value,
      } as unknown as TimelineItemProps;
      await nextTick();
      expect(fixture.host.textContent).toBe("body");
      expect(
        [...head().classList].filter((name) =>
          name.startsWith("semi-timeline-item-head-"),
        ),
      ).toEqual([]);
    }
    input.value = {
      type: undefined,
      dot: () => [],
      extra: () => [],
      time: () => [],
    };
    await nextTick();
    expect(head().classList).toContain("semi-timeline-item-head-default");
    expect(head().classList).toContain("semi-timeline-item-head-custom");
    expect(
      fixture.host.querySelector(".semi-timeline-item-content-extra"),
    ).not.toBeNull();
    expect(
      fixture.host.querySelector(".semi-timeline-item-content-time"),
    ).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Timeline declared empty slots own their containers and are never probed", () => {
  const dot = vi.fn(() => null);
  const extra = vi.fn(() => false);
  const time = vi.fn(() => []);
  const content = vi.fn(() => (
    <>
      <b>slot</b>
      <i>tail</i>
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline.Item
        children="ignored"
        dot="ignored"
        extra="ignored"
        time="ignored"
      >
        {{ default: content, dot, extra, time } as unknown as TimelineItemSlots}
      </Timeline.Item>
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("slottail");
    for (const render of [dot, extra, time, content])
      expect(render).toHaveBeenCalledTimes(1);
    expect(
      fixture.host.querySelector(".semi-timeline-item-head-custom"),
    ).not.toBeNull();
    expect(
      fixture.host.querySelector(".semi-timeline-item-content-extra"),
    ).not.toBeNull();
    expect(
      fixture.host.querySelector(".semi-timeline-item-content-time"),
    ).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Timeline native keyed ownership survives conditional fragments, reorder and nested timelines", async () => {
  const ids = shallowRef(["a", "b", "c"]);
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
    { props: ["id"] },
  );
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline mode="alternate">
        {() => (
          <>
            {shown.value ? (
              <For getKey={(id: string) => id} in={ids.value}>
                {(id: ShallowRef<string>) => (
                  <Timeline.Item>{() => <Owned id={id.value} />}</Timeline.Item>
                )}
              </For>
            ) : null}
            <Timeline.Item>
              {() => (
                <Timeline mode="right">
                  {() => <Timeline.Item children="inner" />}
                </Timeline>
              )}
            </Timeline.Item>
          </>
        )}
      </Timeline>
    )),
  );
  try {
    await settle();
    const input =
      fixture.host.querySelector<HTMLInputElement>('[data-id="a"]')!;
    input.focus();
    ids.value = ["a", "c", "b", "d"];
    await settle();
    expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    expect(
      [...fixture.host.querySelectorAll("input")].map((node) => node.value),
    ).toEqual(ids.value);
    expect(
      [...fixture.host.querySelector("ul")!.children].map((node) =>
        node.classList.contains("semi-timeline-item-right"),
      ),
    ).toEqual([false, true, false, true, false]);
    expect(fixture.host.querySelector("ul ul > li")?.classList).toContain(
      "semi-timeline-item-right",
    );
    ids.value = ["d", "b", "c", "a"];
    await settle();
    expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(mounts).toBe(4);
    expect(unmounts).toBe(0);
    ids.value = ["a", "c"];
    await settle();
    expect(unmounts).toBe(2);
    shown.value = false;
    await settle();
    expect(unmounts).toBe(4);
    shown.value = true;
    await settle();
    expect(mounts).toBe(6);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(6);
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Timeline preserves source DOM semantics, safe text, data attributes and native bubbling", () => {
  const click = vi.fn();
  const outer = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <section onClick={outer}>
        <Timeline
          aria-label="history"
          class="local"
          className="upstream"
          data-test="timeline"
          style={{ marginTop: "3px" }}
          {...{ title: "filtered", role: "tree", innerHTML: "<b>unsafe</b>" }}
        >
          {() => (
            <Timeline.Item
              class="item-local"
              className="item-upstream"
              data-test="item"
              onClick={click}
              style={{ paddingTop: "2px" }}
            >
              {() => <button>{"<img src=x onerror=alert(1)>"}</button>}
            </Timeline.Item>
          )}
        </Timeline>
      </section>
    )),
  );
  try {
    const root = fixture.host.querySelector("ul")!;
    const item = root.querySelector("li")!;
    expect(root.getAttribute("aria-label")).toBe("history");
    expect(root.getAttribute("data-test")).toBe("timeline");
    expect(root.classList).toContain("local");
    expect(root.classList).toContain("upstream");
    expect(root.style.marginTop).toBe("3px");
    expect(root.hasAttribute("title")).toBe(false);
    expect(root.hasAttribute("role")).toBe(false);
    expect(root.querySelector("img")).toBeNull();
    expect(item.getAttribute("data-test")).toBe("item");
    expect(item.classList).toContain("item-local");
    expect(item.classList).toContain("item-upstream");
    expect(item.style.paddingTop).toBe("2px");
    expect(root.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(root.querySelector("[aria-live], [tabindex], [role]")).toBeNull();
    root.querySelector("button")!.click();
    expect(click).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
    expect(click.mock.calls[0]![0]).toBeInstanceOf(MouseEvent);
  } finally {
    fixture.unmount();
  }
});

test("Timeline stops its direct-child observer and ignores queued notifications after unmount", async () => {
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
        <Timeline mode="alternate">
          {() => <Timeline.Item children="value" />}
        </Timeline>
      )),
    );
    await settle();
    expect(observe).toHaveBeenCalled();
    for (const call of observe.mock.calls)
      expect(call[1]).toEqual({ childList: true });
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
