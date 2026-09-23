import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Button from "../../packages/semi-ui-vue/src/components/button/index.js";
import ButtonGroup from "../../packages/semi-ui-vue/src/components/button/buttonGroup.js";
import SplitButtonGroup from "../../packages/semi-ui-vue/src/components/button/splitButtonGroup.js";
import { semiGlobal } from "../../packages/semi-ui-vue/src/context/index.js";
import type {
  ButtonGroupProps,
  ButtonProps,
} from "../../packages/semi-ui-vue/src/components/button/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Button retains the plain upstream DOM contract as text and slots change", async () => {
  const input = shallowRef<ButtonProps>({
    text: "text",
    prefixCls: "acme-button",
  });
  const slotText = shallowRef("slot one");
  const useSlot = shallowRef(false);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Button
        {...input.value}
        v-slots={
          useSlot.value
            ? { default: () => <strong>{slotText.value}</strong> }
            : {}
        }
      />
    )),
  );
  try {
    await nextTick();
    const button = fixture.host.querySelector("button")!;
    const content = () => button.querySelector(".acme-button-content")!;
    expect(button.classList.contains("acme-button")).toBe(true);
    expect(content().getAttribute("x-semi-prop")).toBe("children");
    expect(content().textContent).toBe("text");
    input.value = { text: "zero", prefixCls: "acme-button" };
    await nextTick();
    expect(content().textContent).toBe("zero");
    useSlot.value = true;
    await nextTick();
    expect(content().querySelector("strong")!.textContent).toBe("slot one");
    slotText.value = "slot two";
    await nextTick();
    expect(content().textContent).toBe("slot two");
    useSlot.value = false;
    input.value = { text: "restored", prefixCls: "acme-button" };
    await nextTick();
    expect(content().textContent).toBe("restored");
  } finally {
    fixture.unmount();
  }
});

test("Button routes icon visuals without changing native loading or disabled activation", async () => {
  const input = shallowRef<ButtonProps>({
    colorful: true,
    iconPosition: "left" as const,
    loading: false,
    noHorizontalPadding: "left" as const,
    theme: "light" as const,
    type: "primary" as const,
  });
  const click = vi.fn();
  const events: Event[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Button
        {...input.value}
        onClick={click}
        onKeydown={(event) => events.push(event)}
        v-slots={{
          default: () => <span>Save</span>,
          icon: (scope) => <svg data-palette={JSON.stringify(scope.fill)} />,
        }}
      />
    )),
  );
  try {
    await nextTick();
    const button = fixture.host.querySelector("button")!;
    expect(button.style.paddingLeft).toBe("0px");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(
      button.querySelector(".semi-button-content")!.firstElementChild?.tagName,
    ).toBe("svg");
    expect(
      JSON.parse(button.querySelector("svg")!.dataset.palette!),
    ).toHaveLength(4);
    input.value = {
      ...input.value,
      iconPosition: "right",
      noHorizontalPadding: "right",
    };
    await nextTick();
    expect(button.style.paddingLeft).toBe("");
    expect(button.style.paddingRight).toBe("0px");
    expect(
      button.querySelector(".semi-button-content")!.lastElementChild?.tagName,
    ).toBe("svg");
    input.value = { ...input.value, loading: true };
    await nextTick();
    const keyboard = new KeyboardEvent("keydown", { key: "Enter" });
    button.dispatchEvent(keyboard);
    button.click();
    expect(events).toEqual([keyboard]);
    expect(click).toHaveBeenCalledExactlyOnceWith(expect.any(MouseEvent));
    input.value = { ...input.value, disabled: true };
    await nextTick();
    expect(button.disabled).toBe(true);
    expect(button.querySelector('[data-icon="spin"]')).toBeNull();
    button.click();
    expect(click).toHaveBeenCalledOnce();
  } finally {
    fixture.unmount();
  }
});

test("Button keeps exact native event objects and real form button semantics", () => {
  const received: Event[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <form>
        <Button
          htmlType="reset"
          onClick={(event) => received.push(event)}
          onMousedown={(event) => received.push(event)}
          onMouseenter={(event) => received.push(event)}
          onMouseleave={(event) => received.push(event)}
        />
      </form>
    )),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(button.type).toBe("reset");
    const events = [
      new MouseEvent("click"),
      new MouseEvent("mousedown"),
      new MouseEvent("mouseenter"),
      new MouseEvent("mouseleave"),
    ];
    for (const event of events) button.dispatchEvent(event);
    expect(received).toEqual(events);
  } finally {
    fixture.unmount();
  }
});

test("ButtonGroup observes public/default/global own-key precedence and theme override", async () => {
  semiGlobal.configure({
    overrideDefaultProps: { Button: { disabled: true, type: "danger" } },
  });
  const group = shallowRef<ButtonGroupProps>({
    disabled: false,
    size: "large",
    theme: "outline",
  });
  const child = shallowRef<ButtonProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        {...group.value}
        v-slots={{
          default: () => <Button {...child.value} theme="light" />,
        }}
      />
    )),
  );
  try {
    await nextTick();
    const button = fixture.host.querySelector("button")!;
    expect(button.disabled).toBe(true);
    expect(button.classList.contains("semi-button-danger-disabled")).toBe(true);
    expect(button.classList.contains("semi-button-size-large")).toBe(true);
    expect(button.classList.contains("semi-button-outline")).toBe(true);
    child.value = { disabled: false, type: "warning", size: "small" };
    await nextTick();
    expect(button.disabled).toBe(false);
    expect(button.classList.contains("semi-button-warning")).toBe(true);
    expect(button.classList.contains("semi-button-size-small")).toBe(true);
    group.value = { disabled: true, size: "large", theme: undefined };
    await nextTick();
    expect(button.classList.contains("semi-button-light")).toBe(true);
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("ButtonGroup places lines only between direct public Buttons across dynamic boundaries", async () => {
  const direct = shallowRef(true);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        v-slots={{
          default: () => (
            <>
              {direct.value && <Button text="first" />}
              <span>
                <Button text="wrapped" />
              </span>
              <ButtonGroup
                v-slots={{ default: () => <Button text="nested" /> }}
              />
              <button>native</button>
              <Button text="outline" theme="outline" />
              <Button text="last" />
            </>
          ),
        }}
      />
    )),
  );
  try {
    await nextTick();
    const outer = fixture.host.querySelector(".semi-button-group")!;
    const lineCount = () =>
      outer.querySelectorAll(":scope > [data-semi-button-line]").length;
    // Fixed React iterates raw children except the final one. A direct Button
    // followed by real wrapper/native children still receives a line.
    expect(lineCount()).toBe(1);
    direct.value = false;
    await nextTick();
    await Promise.resolve();
    expect(lineCount()).toBe(0);
    expect(outer.querySelector(":scope > span > button")).not.toBeNull();
    expect(
      outer.querySelector(":scope > .semi-button-group button"),
    ).not.toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("SplitButtonGroup updates nested descendants without observer feedback and cleans up on unmount", async () => {
  const count = shallowRef(3);
  const visible = shallowRef(true);
  const root = defineVaporComponent(() => (
    <SplitButtonGroup
      v-if={visible.value}
      v-slots={{
        default: () => (
          <section>
            {Array.from({ length: count.value }, (_, index) => (
              <button key={index}>{index}</button>
            ))}
          </section>
        ),
      }}
    />
  ));
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  const OriginalObserver = window.MutationObserver;
  let observations = 0;
  class ObservedMutationObserver extends OriginalObserver {
    connected = false;

    observe(...args: Parameters<MutationObserver["observe"]>) {
      super.observe(...args);
      if (!this.connected) {
        observations++;
        this.connected = true;
      }
    }

    disconnect() {
      super.disconnect();
      if (this.connected) {
        observations--;
        this.connected = false;
      }
    }
  }
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: ObservedMutationObserver,
  });
  const fixture = mountVapor(root);
  try {
    const buttons = () => [
      ...fixture.host.querySelectorAll<HTMLButtonElement>("button"),
    ];
    expect(buttons()[0]!.classList.contains("semi-button-first")).toBe(true);
    expect(buttons()[2]!.classList.contains("semi-button-last")).toBe(true);
    count.value = 1;
    await nextTick();
    await Promise.resolve();
    expect(buttons()).toHaveLength(1);
    expect(buttons()[0]!.classList.contains("semi-button-first")).toBe(true);
    expect(buttons()[0]!.classList.contains("semi-button-last")).toBe(true);
    visible.value = false;
    await nextTick();
  } finally {
    fixture.unmount();
    expect(observations).toBe(0);
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
});

test("SplitButtonGroup does not retain observer state across independent remounts", async () => {
  const root = defineVaporComponent(() => (
    <SplitButtonGroup v-slots={{ default: () => <button>only</button> }} />
  ));
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  const OriginalObserver = window.MutationObserver;
  let observations = 0;
  class ObservedMutationObserver extends OriginalObserver {
    connected = false;

    observe(...args: Parameters<MutationObserver["observe"]>) {
      super.observe(...args);
      if (!this.connected) {
        observations++;
        this.connected = true;
      }
    }

    disconnect() {
      super.disconnect();
      if (this.connected) {
        observations--;
        this.connected = false;
      }
    }
  }
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: ObservedMutationObserver,
  });
  for (let index = 0; index < 2; index++) {
    const app = createVaporApp(root);
    const host = document.createElement("div");
    document.body.append(host);
    try {
      app.mount(host);
      const button = host.querySelector("button")!;
      expect(button.classList.contains("semi-button-first")).toBe(true);
      expect(button.classList.contains("semi-button-last")).toBe(true);
      app.unmount();
      expect(observations).toBe(0);
    } finally {
      host.remove();
    }
  }
  Object.defineProperty(window, "MutationObserver", descriptor);
});
