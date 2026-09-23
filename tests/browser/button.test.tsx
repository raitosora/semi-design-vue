import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Button from "../../packages/semi-ui-vue/src/components/button/index.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Button keeps native form/click semantics while loading and routes the icon slot", async () => {
  const input = shallowRef({ loading: false, htmlType: "submit" as const });
  const click = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Button
          {...input.value}
          onClick={click}
          v-slots={{
            icon: () => <i>icon</i>,
            default: () => <span>Save</span>,
          }}
        />
      </form>
    )),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(Button.elementType).toBe("Button");
    expect(button.type).toBe("submit");
    expect(button.classList.contains("semi-button-with-icon")).toBe(true);
    button.click();
    expect(click).toHaveBeenCalledOnce();
    input.value = { loading: true, htmlType: "submit" };
    await nextTick();
    expect(button.disabled).toBe(false);
    button.click();
    expect(click).toHaveBeenCalledTimes(2);
  } finally {
    fixture.unmount();
  }
});

test("Button captures global defaults and respects an explicit undefined", async () => {
  const { semiGlobal } =
    await import("../../packages/semi-ui-vue/src/context/index.js");
  semiGlobal.configure({
    overrideDefaultProps: { Button: { theme: "solid", type: "danger" } },
  });
  const input = shallowRef<Record<string, unknown>>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Button {...input.value} />),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(button.classList.contains("semi-button-solid")).toBe(true);
    expect(button.classList.contains("semi-button-danger")).toBe(true);
    input.value = { theme: undefined };
    await nextTick();
    expect(button.classList.contains("semi-button-solid")).toBe(true);
    input.value = { theme: undefined, type: undefined };
    await nextTick();
    expect(button.classList.contains("semi-button-danger")).toBe(true);
  } finally {
    fixture.unmount();
    semiGlobal.configure({});
  }
});

test("Button dynamically swaps raw loading and icon routes without losing slot ownership", async () => {
  const loading = shallowRef(false);
  const disabled = shallowRef(false);
  const icon = shallowRef(false);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Button
        disabled={disabled.value}
        loading={loading.value}
        v-slots={{
          default: () => <b>owned</b>,
          ...(icon.value ? { icon: () => <i data-icon-slot="" /> } : {}),
        }}
      />
    )),
  );
  try {
    const button = () => fixture.host.querySelector("button")!;
    expect(button().classList.contains("semi-button-with-icon")).toBe(false);
    loading.value = true;
    await nextTick();
    expect(button().querySelector('[data-icon="spin"]')).not.toBeNull();
    disabled.value = true;
    await nextTick();
    expect(button().disabled).toBe(true);
    expect(button().querySelector('[data-icon="spin"]')).toBeNull();
    disabled.value = false;
    loading.value = false;
    icon.value = true;
    await nextTick();
    expect(button().querySelector("[data-icon-slot]")).not.toBeNull();
    icon.value = false;
    await nextTick();
    expect(button().classList.contains("semi-button-with-icon")).toBe(false);
  } finally {
    fixture.unmount();
  }
});

test("Button preserves dynamic slots, native event identity, and IconButton visual props", async () => {
  const input = shallowRef({
    colorful: true,
    theme: "light" as const,
    type: "primary" as const,
    noHorizontalPadding: "left" as const,
    text: "fallback",
  });
  const label = shallowRef("first");
  const events: Event[] = [];
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Button
        {...input.value}
        onBlur={(event) => events.push(event)}
        onFocus={(event) => events.push(event)}
        onKeydown={(event) => events.push(event)}
        onMousedown={(event) => events.push(event)}
        v-slots={{
          default: () => <strong>{label.value}</strong>,
          icon: (scope) => <svg data-fill={JSON.stringify(scope.fill)} />,
        }}
      />
    )),
  );
  try {
    const button = fixture.host.querySelector("button")!;
    expect(button.style.paddingLeft).toBe("0px");
    expect(JSON.parse(button.querySelector("svg")!.dataset.fill!)).toHaveLength(
      4,
    );
    label.value = "second";
    await nextTick();
    expect(button.querySelector("strong")!.textContent).toBe("second");
    const down = new MouseEvent("mousedown");
    const key = new KeyboardEvent("keydown", { key: "Enter" });
    button.dispatchEvent(down);
    button.dispatchEvent(key);
    button.focus();
    button.blur();
    expect(events).toEqual([
      down,
      key,
      expect.any(FocusEvent),
      expect.any(FocusEvent),
    ]);
  } finally {
    fixture.unmount();
  }
});

test("Button content annotation is independent of caller class names", () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Button
        className="custom-with-icon"
        text="Plain"
        x-semi-children-alias="label"
      />
    )),
  );
  try {
    const content = fixture.host.querySelector(".semi-button-content")!;
    expect(content.getAttribute("x-semi-prop")).toBe("label");
    expect(content.textContent).toBe("Plain");
  } finally {
    fixture.unmount();
  }
});

test("Button icon content follows the hyphenated children alias dynamically", async () => {
  const alias = shallowRef("first-label");
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Button
        text="Icon text"
        v-slots={{ icon: () => <i /> }}
        x-semi-children-alias={alias.value}
      />
    )),
  );
  try {
    expect(
      fixture.host
        .querySelector(".semi-button-content-right")!
        .getAttribute("x-semi-prop"),
    ).toBe("first-label");
    alias.value = "second-label";
    await nextTick();
    expect(
      fixture.host
        .querySelector(".semi-button-content-right")!
        .getAttribute("x-semi-prop"),
    ).toBe("second-label");
  } finally {
    fixture.unmount();
  }
});
