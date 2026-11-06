import {
  defineVaporComponent,
  inject,
  nextTick,
  onMounted,
  onScopeDispose,
  onUnmounted,
  provide,
  shallowRef,
  type ShallowRef,
} from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test, vi } from "vitest";
import Steps from "../../packages/semi-ui-vue/src/components/steps/index.js";
import type {
  StepProps,
  StepSlots,
  StepsContent,
  StepsProps,
  StepsRenderResult,
} from "../../packages/semi-ui-vue/src/components/steps/types.js";
import { mountVapor } from "../support/mount-vapor.js";
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
test.each(["fill", "basic", "nav"] as const)(
  "Steps %s native ownership retains keyed DOM focus context and lifecycle",
  async (type: "fill" | "basic" | "nav") => {
    const ids = shallowRef(["a", "b", "c"]),
      shown = shallowRef(true),
      current = shallowRef(0),
      text = shallowRef("before");
    let mounts = 0,
      unmounts = 0;
    const Child = defineVaporComponent<{ id: string }, {}, string, {}>(
      (props) => {
        const context = inject("steps-context");
        onMounted(() => mounts++);
        onUnmounted(() => unmounts++);
        return (
          <>
            <input data-id={props.id} value={`${context}:${text.value}`} />
            <b>{props.id}</b>
          </>
        );
      },
      { props: ["id"] },
    );
    const fixture = mountVapor(
      defineVaporComponent(() => {
        provide("steps-context", "provided");
        return (
          <Steps current={current.value} type={type}>
            {() => (
              <>
                {shown.value ? (
                  <For getKey={(id: string) => id} in={ids.value}>
                    {(id: ShallowRef<string>) => (
                      <Steps.Step>
                        {{ title: () => <Child id={id.value} /> }}
                      </Steps.Step>
                    )}
                  </For>
                ) : null}
                <Steps.Step
                  title={() => (
                    <Steps type="nav">
                      {() => <Steps.Step title="nested" />}
                    </Steps>
                  )}
                />
              </>
            )}
          </Steps>
        );
      }),
    );
    try {
      await settle();
      const input =
        fixture.host.querySelector<HTMLInputElement>('[data-id="a"]')!;
      input.focus();
      expect(input.value).toBe("provided:before");
      ids.value = ["a", "c", "b", "d"];
      current.value = 2;
      text.value = "after";
      await settle();
      expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe("provided:after");
      expect(mounts).toBe(4);
      expect(unmounts).toBe(0);
      ids.value = ["d", "b", "c", "a"];
      await settle();
      expect(fixture.host.querySelector('[data-id="a"]')).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(mounts).toBe(4);
      expect(
        [...fixture.host.querySelectorAll<HTMLInputElement>("input")].map(
          (node) => node.dataset.id,
        ),
      ).toEqual(ids.value);
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
  },
);
test("Steps slots own empty containers without probing and nav never invokes unused content", async () => {
  const title = vi.fn(() => null),
    description = vi.fn(() => []),
    icon = vi.fn(() => null),
    ignored = vi.fn(() => <b>ignored</b>);
  const type = shallowRef<"basic" | "nav">("basic");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps type={type.value}>
        {() => (
          <Steps.Step description={ignored} icon={ignored} title={ignored}>
            {{ title, description, icon } as unknown as StepSlots}
          </Steps.Step>
        )}
      </Steps>
    )),
  );
  try {
    await settle();
    for (const callback of [title, description, icon])
      expect(callback).toHaveBeenCalledTimes(1);
    expect(ignored).not.toHaveBeenCalled();
    expect(
      fixture.host.querySelector(".semi-steps-item-description"),
    ).not.toBeNull();
    expect(
      fixture.host.querySelector(".semi-steps-item-custom-icon"),
    ).not.toBeNull();
    type.value = "nav";
    await settle();
    expect(title).toHaveBeenCalledTimes(2);
    expect(description).toHaveBeenCalledTimes(1);
    expect(icon).toHaveBeenCalledTimes(1);
    expect(ignored).not.toHaveBeenCalled();
  } finally {
    fixture.unmount();
  }
});
test.each(["fill", "basic"] as const)(
  "Steps %s icon presence, scalar gates and dynamic removal preserve source behavior",
  async (type) => {
    const input = shallowRef<StepProps>({ title: "title", description: 0 });
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Steps type={type}>{() => <Steps.Step {...input.value} />}</Steps>
      )),
    );
    const icon = () =>
      fixture.host.querySelector(
        type === "basic" ? ".semi-steps-item-icon" : ".semi-steps-item-left",
      );
    try {
      await settle();
      expect(icon()?.textContent).toBe("1");
      for (const value of [undefined, null, false, 0, ""]) {
        input.value = { title: "title", description: 0, icon: value };
        await settle();
        expect(icon()).toBeNull();
      }
      input.value = { title: "title", description: 0, icon: "custom" };
      await settle();
      expect(icon()?.textContent ?? "").toBe(type === "fill" ? "custom" : "");
      input.value = { title: "title", description: 0 };
      await settle();
      expect(icon()?.textContent).toBe("1");
      expect(
        fixture.host.querySelector(".semi-steps-item-description") !== null,
      ).toBe(type === "fill");
      expect(fixture.host.textContent).toBe("1title0");
    } finally {
      fixture.unmount();
    }
  },
);
test.each(["fill", "basic"] as const)(
  "Steps %s stable icon renderer classifies owned results once and cleans old scopes",
  async (type) => {
    const result = shallowRef<StepsRenderResult>("scalar");
    let runs = 0,
      disposed = 0;
    const render = () => {
      runs++;
      onScopeDispose(() => disposed++);
      return result.value;
    };
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Steps type={type}>
          {() => <Steps.Step icon={render} title="title" />}
        </Steps>
      )),
    );
    try {
      await settle();
      expect(fixture.host.textContent).toBe(
        type === "fill" ? "scalartitle" : "title",
      );
      for (const value of [0, null, false, undefined, "again"] as const) {
        result.value = value;
        await settle();
        expect(fixture.host.textContent).toBe(
          value === "again" && type === "fill" ? "againtitle" : "title",
        );
        expect(disposed).toBe(
          runs - (type === "basic" && value === "again" ? 0 : 1),
        );
      }
      result.value = document.createElement("i");
      await settle();
      expect(fixture.host.querySelector("i")).not.toBeNull();
      expect(disposed).toBe(runs - 1);
    } finally {
      fixture.unmount();
    }
    expect(disposed).toBe(runs);
  },
);
test("Steps renderers keep primitive updates, nested sparse arrays and escaped text", async () => {
  const result = shallowRef<StepsRenderResult>("before");
  const title = () => result.value;
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps type="basic">
        {() => (
          <Steps.Step
            description={() => [
              "text",
              [0, false, null, undefined, "<b>safe</b>"],
            ]}
            title={title}
          />
        )}
      </Steps>
    )),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("1beforetext0<b>safe</b>");
    result.value = ["after", [0, , false]];
    await settle();
    expect(fixture.host.textContent).toBe("1after0text0<b>safe</b>");
    expect(fixture.host.querySelector("b")).toBeNull();
  } finally {
    fixture.unmount();
  }
});
test("Steps children renderer and default declaration priority support sparse and empty lists", async () => {
  const ids = shallowRef<StepsRenderResult[]>([]);
  const source: StepsContent = () => ids.value;
  const fallback = vi.fn(() => <Steps.Step title="fallback" />);
  const slot = vi.fn(() => null);
  const first = mountVapor(
    defineVaporComponent(() => (
      <Steps children={fallback}>{slot as unknown as () => never}</Steps>
    )),
  );
  try {
    await settle();
    expect(slot).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  } finally {
    first.unmount();
  }
  const fixture = mountVapor(
    defineVaporComponent(() => <Steps children={source} type="nav" />),
  );
  try {
    await settle();
    expect(fixture.host.querySelectorAll(".semi-steps-item")).toHaveLength(0);
    ids.value = [null, false, 0, undefined];
    await settle();
    expect(fixture.host.textContent).toBe("0");
    ids.value = [];
    await settle();
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
});
test("Steps invalid type hides content without evaluating it and restoration remounts", async () => {
  const props = shallowRef<StepsProps>({});
  let mounts = 0,
    unmounts = 0;
  const Child = defineVaporComponent(() => {
    onMounted(() => mounts++);
    onUnmounted(() => unmounts++);
    return <b>title</b>;
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Steps {...props.value}>
        {() => <Steps.Step title={() => <Child />} />}
      </Steps>
    )),
  );
  try {
    await settle();
    expect(mounts).toBe(1);
    for (const type of [null, false, 0, "unknown"]) {
      props.value = { type } as unknown as StepsProps;
      await settle();
      expect(fixture.host.textContent).toBe("");
      expect(unmounts).toBe(1);
    }
    props.value = { type: undefined };
    await settle();
    expect(mounts).toBe(2);
    props.value = { type: "basic" };
    await settle();
    expect(mounts).toBe(3);
    expect(unmounts).toBe(2);
  } finally {
    fixture.unmount();
  }
  expect(unmounts).toBe(3);
});
