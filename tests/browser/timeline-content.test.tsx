import {
  createVaporApp,
  defineVaporComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Timeline from "../../packages/semi-ui-vue/src/components/timeline/index.js";
import { timelineEntries } from "../../packages/semi-ui-vue/src/components/timeline/data.js";
import { nativeTimelineContent } from "../../packages/semi-ui-vue/src/components/timeline/render.js";
import type {
  Data,
  TimelineContent,
  TimelineItemProps,
  TimelineRenderResult,
} from "../../packages/semi-ui-vue/src/components/timeline/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Timeline data boundaries preserve upstream map and content semantics", () => {
  for (const value of [undefined, null, false, 0, [], { length: 0 }]) {
    expect(timelineEntries(value as Data[])).toEqual([]);
  }
  for (const value of [
    [null],
    [undefined],
    "abc",
    { length: 1 },
    { length: 1, map: true },
  ]) {
    expect(() => timelineEntries(value as unknown as Data[])).toThrow(
      TypeError,
    );
  }
  for (const value of [false, true, 0, "text", []]) {
    expect(
      timelineEntries([value] as unknown as Data[])[0]?.item.content,
    ).toBeUndefined();
  }
  expect(timelineEntries(Array<Data>(3))).toEqual([]);
  const source = {
    content: "value",
    children: "ignored",
    position: "right" as const,
  };
  const result = timelineEntries([source]);
  expect(result[0]?.item).toEqual(source);
  expect(result[0]?.item).not.toBe(source);
  expect(result[0]?.key).toBe("timeline-item-0");
  const keyed = { content: "keyed", key: "caller" };
  expect(timelineEntries([keyed])[0]?.key).toBe("caller");
});

test("Timeline render adapter preserves native nodes and rejects async or object results", async () => {
  const element = document.createElement("b");
  expect(nativeTimelineContent(element)).toBe(element);
  const text = nativeTimelineContent("<safe>") as Text;
  expect(text.textContent).toBe("<safe>");
  expect((nativeTimelineContent(0) as Text).textContent).toBe("0");
  for (const value of [null, undefined, false, true])
    expect(nativeTimelineContent(value)).toEqual([]);
  expect(nativeTimelineContent([null, false, [], [,]])).toEqual([
    [],
    [],
    [],
    [[]],
  ]);
  for (const value of [
    {},
    h("b", "unsupported"),
    Symbol("x"),
    1n,
    () => null,
  ]) {
    expect(() => nativeTimelineContent(value as TimelineRenderResult)).toThrow(
      /supported native/,
    );
  }
  for (const value of [
    Promise.resolve(null),
    Promise.reject(new Error("expected")),
  ]) {
    expect(() =>
      nativeTimelineContent(value as unknown as TimelineRenderResult),
    ).toThrow(/synchronous/);
  }
  await Promise.resolve();
});

test.each(["children", "dot", "extra", "time"] as const)(
  "Timeline %s renderer retains native ownership, context, focus and lifecycle",
  async (field: "children" | "dot" | "extra" | "time") => {
    const ids = shallowRef(["a", "b"]);
    const label = shallowRef("one");
    const shown = shallowRef(true);
    let mounts = 0;
    let unmounts = 0;
    const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
      (props) => {
        const context = inject("timeline-owner");
        onMounted(() => mounts++);
        onUnmounted(() => unmounts++);
        return (
          <button data-id={props.id}>
            {context}:{props.id}:{label.value}
          </button>
        );
      },
      { props: ["id"] },
    );
    const render = vi.fn(() => (
      <>
        {shown.value ? (
          <For getKey={(id: string) => id} in={ids.value}>
            {(id: ShallowRef<string>) => <Child id={id.value} />}
          </For>
        ) : null}
        <i>tail</i>
      </>
    ));
    const input = shallowRef<TimelineContent>(render);
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provide("timeline-owner", "provided");
        return (
          <Timeline>
            {() => <Timeline.Item {...{ [field]: input.value }} />}
          </Timeline>
        );
      }),
    );
    try {
      const original =
        fixture.host.querySelector<HTMLButtonElement>('[data-id="a"]')!;
      original.focus();
      label.value = "two";
      await nextTick();
      expect(original.textContent).toBe("provided:a:two");
      expect(document.activeElement).toBe(original);
      expect(render).toHaveBeenCalledTimes(1);
      ids.value = ["a", "c", "b"];
      await nextTick();
      expect(fixture.host.querySelector('[data-id="a"]')).toBe(original);
      expect(document.activeElement).toBe(original);
      expect(mounts).toBe(3);
      expect(unmounts).toBe(0);
      ids.value = ["b", "a"];
      await nextTick();
      expect(fixture.host.querySelector('[data-id="a"]')).toBe(original);
      expect(unmounts).toBe(1);
      shown.value = false;
      await nextTick();
      expect(unmounts).toBe(3);
      shown.value = true;
      await nextTick();
      expect(mounts).toBe(5);
      input.value = () => <strong>replacement</strong>;
      await nextTick();
      expect(fixture.host.textContent).toBe("replacement");
      expect(unmounts).toBe(5);
      input.value = undefined;
      await nextTick();
      expect(fixture.host.textContent).toBe("");
    } finally {
      fixture.unmount();
    }
    expect(unmounts).toBe(5);
  },
);

test("Timeline root children renderer and data renderer retain context and reactive descendants", async () => {
  const label = shallowRef("one");
  const data = shallowRef<Data[] | undefined>(undefined);
  const Child = defineVaporComponent(() => {
    const context = inject("timeline-context");
    return (
      <button>
        {context}:{label.value}
      </button>
    );
  });
  const content = vi.fn(() => <Child />);
  const children = vi.fn(() => <Timeline.Item children={content} />);
  const fixture = mountVapor(
    defineVaporComponent(() => {
      provide("timeline-context", "provided");
      return <Timeline children={children} dataSource={data.value} />;
    }),
  );
  try {
    const original = fixture.host.querySelector("button");
    label.value = "two";
    await nextTick();
    expect(fixture.host.textContent).toBe("provided:two");
    expect(fixture.host.querySelector("button")).toBe(original);
    expect(content).toHaveBeenCalledTimes(1);
    expect(children).toHaveBeenCalledTimes(1);
    data.value = [{ content }];
    await nextTick();
    expect(fixture.host.textContent).toBe("provided:two");
    const dataButton = fixture.host.querySelector<HTMLButtonElement>("button")!;
    dataButton.focus();
    data.value = [...data.value, { content: "tail" }];
    await nextTick();
    expect(fixture.host.querySelector("button")).toBe(dataButton);
    expect(document.activeElement).toBe(dataButton);
    label.value = "three";
    await nextTick();
    expect(fixture.host.textContent).toBe("provided:threetail");
  } finally {
    fixture.unmount();
  }
});

test("Timeline initial and registered-item ordering works without MutationObserver", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  const shown = shallowRef(false);
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <Timeline mode="alternate">
          {() => (
            <>
              <Timeline.Item children="first" />
              {shown.value ? <Timeline.Item children="second" /> : null}
            </>
          )}
        </Timeline>
      )),
    );
    await nextTick();
    expect(fixture.host.querySelector("li")?.classList).toContain(
      "semi-timeline-item-left",
    );
    shown.value = true;
    await nextTick();
    expect(fixture.host.querySelectorAll("li")[1]?.classList).toContain(
      "semi-timeline-item-right",
    );
  } finally {
    fixture?.unmount();
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
});

test("Timeline data keys retain renderer identity when reordered and source position updates", async () => {
  const make = (key: string) => ({
    key,
    content: () => <button data-key={key}>{key}</button>,
  });
  const a = make("a");
  const b = make("b");
  const data = shallowRef([a, b]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline dataSource={data.value} mode="alternate" />
    )),
  );
  try {
    await nextTick();
    const original =
      fixture.host.querySelector<HTMLButtonElement>('[data-key="a"]')!;
    original.focus();
    data.value = [b, a];
    await nextTick();
    expect(
      [...fixture.host.querySelectorAll("button")].map(
        (button) => button.textContent,
      ),
    ).toEqual(["b", "a"]);
    expect(fixture.host.querySelector('[data-key="a"]')).toBe(original);
    expect(original.closest("li")?.classList).toContain(
      "semi-timeline-item-right",
    );
    expect(document.activeElement).toBe(original);
  } finally {
    fixture.unmount();
  }
});

test("Timeline dynamic attributes, positions and renderer values remove stale DOM state", async () => {
  const label = shallowRef<string | undefined>("history");
  const tag = shallowRef<string | undefined>("one");
  const position = shallowRef<"left" | "right" | undefined>("right");
  const field = shallowRef<TimelineContent>(() => ["one", 0]);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline aria-label={label.value} data-tag={tag.value} mode="center">
        {() => (
          <Timeline.Item
            data-tag={tag.value}
            dot={field.value}
            extra={field.value}
            position={position.value}
            time={field.value}
          />
        )}
      </Timeline>
    )),
  );
  try {
    await nextTick();
    const root = fixture.host.querySelector("ul")!;
    const item = root.querySelector("li")!;
    expect(item.classList).toContain("semi-timeline-item-right");
    expect(fixture.host.textContent).toBe("one0one0one0");
    position.value = "left";
    tag.value = "two";
    label.value = "updated";
    field.value = () => [];
    await nextTick();
    expect(item.classList).toContain("semi-timeline-item-left");
    expect(item.classList).not.toContain("semi-timeline-item-right");
    expect(root.getAttribute("aria-label")).toBe("updated");
    expect(root.getAttribute("data-tag")).toBe("two");
    expect(item.getAttribute("data-tag")).toBe("two");
    expect(fixture.host.textContent).toBe("");
    expect(
      root.querySelector(".semi-timeline-item-content-extra"),
    ).not.toBeNull();
    expect(
      root.querySelector(".semi-timeline-item-content-time"),
    ).not.toBeNull();
    field.value = undefined;
    label.value = undefined;
    tag.value = undefined;
    position.value = undefined;
    await nextTick();
    expect(root.hasAttribute("aria-label")).toBe(false);
    expect(root.hasAttribute("data-tag")).toBe(false);
    expect(item.hasAttribute("data-tag")).toBe(false);
    expect(root.querySelector(".semi-timeline-item-head-custom")).toBeNull();
    expect(root.querySelector(".semi-timeline-item-content-extra")).toBeNull();
    expect(root.querySelector(".semi-timeline-item-content-time")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Timeline nested Item registration follows actual direct-child DOM order without inheriting data index", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Timeline
        dataSource={[
          { content: "first" },
          { content: () => <Timeline.Item children="nested" data-nested="" /> },
        ]}
        mode="alternate"
      />
    )),
  );
  try {
    await nextTick();
    const root = fixture.host.querySelector("ul")!;
    const nested = root.querySelector<HTMLLIElement>("[data-nested]")!;
    expect([...nested.classList]).toEqual(["semi-timeline-item"]);
    root.append(nested);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
    expect(nested.classList).toContain("semi-timeline-item-left");
    expect(nested.classList).not.toContain("semi-timeline-item-right");
  } finally {
    fixture.unmount();
  }
});

test("Timeline ignores falsy runtime click handlers while reporting invalid truthy handlers", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const handler = shallowRef<unknown>(undefined);
  const errors: unknown[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Timeline.Item
        {...({ onClick: handler.value } as TimelineItemProps)}
        children="click"
      />
    )),
  );
  app.config.errorHandler = (error) => errors.push(error);
  try {
    app.mount(host);
    for (const value of [undefined, null, false, 0, ""]) {
      handler.value = value;
      await nextTick();
      host.querySelector("li")!.click();
    }
    expect(errors).toEqual([]);
    handler.value = "invalid";
    await nextTick();
    host.querySelector("li")!.click();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(TypeError);
  } finally {
    app.unmount();
    host.remove();
  }
});
