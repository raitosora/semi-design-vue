import { computed, defineVaporComponent, nextTick, ref, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import InputGroup from "../../packages/semi-ui-vue/src/components/input/inputGroup.js";
import { useInputGroup } from "../../packages/semi-ui-vue/src/components/input/group-context.js";
import type { InputGroupProps } from "../../packages/semi-ui-vue/src/components/input/group-types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
};
// A protocol probe, not a placeholder public InputNumber implementation.
const Control = defineVaporComponent<{ id: string }, {}, string, {}>(
  (props) => {
    const root = ref<HTMLDivElement | null>(null);
    const group = useInputGroup(root);
    const size = computed(() => group.value?.size ?? "own");
    return (
      <div ref={root}>
        <input
          data-id={props.id}
          data-size={size.value}
          disabled={group.value?.disabled}
        />
      </div>
    );
  },
  { props: ["id"] },
);

test("InputGroup inherits only into participating direct roots and isolates nested groups", async () => {
  const props = shallowRef<InputGroupProps>({ size: "large", disabled: true });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <InputGroup {...props.value}>
        {() => (
          <>
            <Control id="direct" />
            <div>
              <Control id="wrapped" />
            </div>
            <InputGroup size="small">
              {() => <Control id="nested" />}
            </InputGroup>
          </>
        )}
      </InputGroup>
    )),
  );
  try {
    await settle();
    const direct =
      fixture.host.querySelector<HTMLInputElement>('[data-id="direct"]')!;
    const wrapped = fixture.host.querySelector<HTMLInputElement>(
      '[data-id="wrapped"]',
    )!;
    expect(direct.dataset.size).toBe("large");
    expect(direct.disabled).toBe(true);
    expect(wrapped.dataset.size).toBe("own");
    expect(wrapped.disabled).toBe(false);
    props.value = { size: "small", disabled: false };
    await settle();
    expect(direct.dataset.size).toBe("small");
    expect(direct.disabled).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("InputGroup label gates, names, sizes and bubbling follow the fixed source", async () => {
  const props = shallowRef<InputGroupProps>({
    label: { text: "Name", name: "group-id", required: true },
    labelPosition: "top",
    size: "small",
  });
  const focus = vi.fn(),
    blur = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <InputGroup {...props.value} onBlur={blur} onFocus={focus}>
        {() => <input />}
      </InputGroup>
    )),
  );
  try {
    await settle();
    expect(
      fixture.host.querySelector(".semi-input-group-wrapper-with-top-label"),
    ).not.toBeNull();
    expect(fixture.host.querySelector("label")?.htmlFor).toBe("group-id");
    const group = fixture.host.querySelector("[role=group]")!;
    expect(group.id).toBe("group-id");
    expect(group.hasAttribute("aria-label")).toBe(false);
    expect(group.classList.contains("semi-input-small")).toBe(true);
    fixture.host.querySelector("input")!.focus();
    expect(focus).toHaveBeenCalledTimes(1);
    fixture.host.querySelector("input")!.blur();
    expect(blur).toHaveBeenCalledTimes(1);
    for (const text of [undefined, null, false, 0, ""]) {
      props.value = { label: { text }, size: "default" };
      await settle();
      expect(fixture.host.querySelector("label")).toBeNull();
      expect(
        fixture.host.querySelector("[role=group]")?.getAttribute("aria-label"),
      ).toBe("Input group");
    }
    props.value = { label: { text: "label", name: "" }, labelPosition: "left" };
    await settle();
    expect(fixture.host.querySelector("label")?.htmlFor).toBe("");
    expect(fixture.host.querySelector("[role=group]")?.id).toBe("input-group");
    expect(
      fixture.host.querySelector(".semi-input-group-wrapper-with-left-label"),
    ).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("InputGroup has no implicit inheritance outside its nearest native group", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Control id="outside" />
        <InputGroup size="large">
          {() => (
            <InputGroup size="small">
              {() => <Control id="inside" />}
            </InputGroup>
          )}
        </InputGroup>
      </>
    )),
  );
  try {
    await settle();
    expect(
      fixture.host.querySelector<HTMLInputElement>('[data-id="outside"]')!
        .dataset.size,
    ).toBe("own");
    expect(
      fixture.host.querySelector<HTMLInputElement>('[data-id="inside"]')!
        .dataset.size,
    ).toBe("small");
  } finally {
    fixture.unmount();
  }
});

test("InputGroup observes native child moves, disconnects replaced roots and ignores late observer delivery", async () => {
  const Native = window.MutationObserver;
  const callbacks: MutationCallback[] = [],
    observations: Node[] = [];
  const disconnect = vi.fn();
  const spy = vi
    .spyOn(window, "MutationObserver")
    .mockImplementation(function (callback) {
      callbacks.push(callback);
      const native = new Native(callback);
      return {
        observe(target: Node, options: MutationObserverInit) {
          observations.push(target);
          native.observe(target, options);
        },
        disconnect() {
          disconnect();
          native.disconnect();
        },
        takeRecords: () => native.takeRecords(),
      } as MutationObserver;
    });
  const label = shallowRef<InputGroupProps["label"]>();
  let fixture: ReturnType<typeof mountVapor> | undefined;
  try {
    fixture = mountVapor(
      defineVaporComponent(() => (
        <InputGroup disabled={true} label={label.value} size="large">
          {() => (
            <>
              <Control id="moving" />
              <section />
            </>
          )}
        </InputGroup>
      )),
    );
    await settle();
    const group = fixture.host.querySelector("[role=group]")!;
    const input = fixture.host.querySelector<HTMLInputElement>("input")!;
    const root = input.parentElement!;
    fixture.host.querySelector("section")!.append(root);
    await settle();
    expect(input.disabled).toBe(false);
    expect(input.dataset.size).toBe("own");
    group.prepend(root);
    await settle();
    expect(input.disabled).toBe(true);
    expect(input.dataset.size).toBe("large");
    label.value = { text: "replacement" };
    await settle();
    expect(observations.at(-1)).not.toBe(group);
    expect(disconnect).toHaveBeenCalled();
    fixture.unmount();
    fixture = undefined;
    expect(disconnect.mock.calls.length).toBe(callbacks.length);
    const count = observations.length;
    const native = new Native(() => undefined);
    callbacks.forEach((callback) => callback([], native));
    await settle();
    expect(observations).toHaveLength(count);
    native.disconnect();
  } finally {
    fixture?.unmount();
    spy.mockRestore();
  }
});

test("InputGroup merged notification listeners run once each for native bubbling", async () => {
  const first = vi.fn(),
    second = vi.fn(),
    blur = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <InputGroup
        {...{ onFocus: first, onBlur: blur }}
        {...{ onFocus: second }}
        {...{ onFocus: first }}
      >
        {() => <input />}
      </InputGroup>
    )),
  );
  try {
    await settle();
    fixture.host.querySelector("input")!.focus();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    fixture.host.querySelector("input")!.blur();
    expect(blur).toHaveBeenCalledTimes(1);
    expect(first.mock.calls[0]![0]).toBeInstanceOf(FocusEvent);
  } finally {
    fixture.unmount();
  }
});
