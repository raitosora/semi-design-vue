import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Button from "../../packages/semi-ui-vue/src/components/button/index.js";
import ButtonGroup from "../../packages/semi-ui-vue/src/components/button/buttonGroup.js";
import type { ButtonGroupProps } from "../../packages/semi-ui-vue/src/components/button/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("ButtonGroup updates direct Buttons through the native group context and keeps child priority", async () => {
  const group = shallowRef<ButtonGroupProps>({
    disabled: true,
    size: "large",
    type: "danger",
    theme: "solid",
  });
  const visible = shallowRef(true);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        {...group.value}
        v-slots={{
          default: () => (
            <>
              {visible.value && <Button size="small" type="primary" />}
              <Button />
            </>
          ),
        }}
      />
    )),
  );
  try {
    await nextTick();
    const buttons = () => [
      ...fixture.host.querySelectorAll<HTMLButtonElement>(
        ".semi-button-group > button",
      ),
    ];
    expect(buttons()).toHaveLength(2);
    expect(buttons()[0]!.disabled).toBe(true);
    expect(buttons()[0]!.classList.contains("semi-button-size-small")).toBe(
      true,
    );
    expect(
      buttons()[0]!.classList.contains("semi-button-primary-disabled"),
    ).toBe(true);
    expect(
      buttons()[1]!.classList.contains("semi-button-danger-disabled"),
    ).toBe(true);
    expect(
      fixture.host.querySelectorAll(".semi-button-group-line"),
    ).toHaveLength(1);
    visible.value = false;
    group.value = {
      disabled: false,
      size: "small",
      type: "warning",
      theme: "outline",
    };
    await nextTick();
    expect(buttons()).toHaveLength(1);
    expect(buttons()[0]!.disabled).toBe(false);
    expect(buttons()[0]!.classList.contains("semi-button-warning")).toBe(true);
    expect(
      fixture.host.querySelectorAll(".semi-button-group-line"),
    ).toHaveLength(0);
  } finally {
    fixture.unmount();
  }
});

test("ButtonGroup keeps nested groups isolated and honors group rest undefined", async () => {
  const outer = shallowRef({ theme: "solid" as const, colorful: true });
  const inner = shallowRef({ type: "warning" as const });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        {...outer.value}
        v-slots={{
          default: () => (
            <>
              <Button theme="outline" />
              <ButtonGroup
                {...inner.value}
                v-slots={{ default: () => <Button theme="light" /> }}
              />
            </>
          ),
        }}
      />
    )),
  );
  try {
    await nextTick();
    const groups = fixture.host.querySelectorAll(".semi-button-group");
    const direct = groups[0]!.querySelector(":scope > button")!;
    const nested = groups[1]!.querySelector("button")!;
    expect(direct.classList.contains("semi-button-solid")).toBe(true);
    expect(direct.classList.contains("semi-button-colorful")).toBe(true);
    expect(nested.classList.contains("semi-button-light")).toBe(true);
    expect(nested.classList.contains("semi-button-warning")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("ButtonGroup only applies inherited values after a Button is a direct DOM child", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        disabled={true}
        theme="solid"
        type="warning"
        v-slots={{
          default: () => (
            <>
              <Button text="direct" />
              <span>
                <Button text="wrapped" />
              </span>
            </>
          ),
        }}
      />
    )),
  );
  try {
    await nextTick();
    const direct = fixture.host.querySelector<HTMLButtonElement>(
      ":scope > .semi-button-group > button",
    )!;
    const wrapped = fixture.host.querySelector<HTMLButtonElement>(
      ".semi-button-group > span > button",
    )!;
    expect(direct.disabled).toBe(true);
    expect(direct.classList.contains("semi-button-warning-disabled")).toBe(
      true,
    );
    expect(direct.classList.contains("semi-button-solid")).toBe(true);
    expect(wrapped.disabled).toBe(false);
    expect(wrapped.classList.contains("semi-button-primary")).toBe(true);
    expect(wrapped.classList.contains("semi-button-light")).toBe(true);
    expect(
      fixture.host.querySelectorAll(".semi-button-group-line"),
    ).toHaveLength(1);
  } finally {
    fixture.unmount();
  }
});

test("ButtonGroup line classes use resolved Button props even with a custom Button prefix", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        disabled={true}
        theme="solid"
        type="warning"
        v-slots={{
          default: () => (
            <>
              <Button prefixCls="consumer-button" />
              <span>after raw Button</span>
            </>
          ),
        }}
      />
    )),
  );
  try {
    await nextTick();
    const button = fixture.host.querySelector("button")!;
    const line = fixture.host.querySelector<HTMLSpanElement>(
      "[data-semi-button-line]",
    )!;
    expect(button.classList.contains("consumer-button-warning-disabled")).toBe(
      true,
    );
    expect(button.classList.contains("consumer-button-solid")).toBe(true);
    expect(line.className).toContain("semi-button-group-line-solid");
    expect(line.className).toContain("semi-button-group-line-warning");
    expect(line.className).toContain("semi-button-group-line-disabled");
  } finally {
    fixture.unmount();
  }
});

test("ButtonGroup preserves direct registration and lines while loading swaps native roots", async () => {
  const group = shallowRef<ButtonGroupProps>({ disabled: true });
  const loading = shallowRef(true);
  const visible = shallowRef(true);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup
        {...group.value}
        v-slots={{
          default: () => (
            <>
              <Button
                v-if={visible.value}
                loading={loading.value}
                text="work"
              />
              <Button text="next" />
            </>
          ),
        }}
      />
    )),
  );
  try {
    const buttons = () => [
      ...fixture.host.querySelectorAll<HTMLButtonElement>(
        ".semi-button-group > button",
      ),
    ];
    const lines = () =>
      fixture.host.querySelectorAll("[data-semi-button-line]");
    await nextTick();
    expect(buttons()).toHaveLength(2);
    expect(buttons()[0]!.disabled).toBe(true);
    expect(buttons()[0]!.querySelector('[data-icon="spin"]')).toBeNull();
    expect(lines()).toHaveLength(1);
    group.value = { disabled: false };
    await nextTick();
    expect(buttons()[0]!.disabled).toBe(false);
    expect(buttons()[0]!.querySelector('[data-icon="spin"]')).not.toBeNull();
    expect(lines()).toHaveLength(1);
    loading.value = false;
    group.value = { disabled: true };
    loading.value = true;
    group.value = { disabled: false };
    group.value = { disabled: true };
    await nextTick();
    expect(buttons()[0]!.disabled).toBe(true);
    expect(buttons()[0]!.querySelector('[data-icon="spin"]')).toBeNull();
    expect(lines()).toHaveLength(1);
    visible.value = false;
    await nextTick();
    expect(lines()).toHaveLength(0);
    visible.value = true;
    await nextTick();
    expect(buttons()).toHaveLength(2);
    expect(lines()).toHaveLength(1);
  } finally {
    fixture.unmount();
  }
});

test("ButtonGroup reconciles keyed moves and preserves caller-owned separator-like nodes", async () => {
  const items = shallowRef(["A", "B", "C"]);
  const Children = defineVaporComponent(() => (
    <>
      <span data-owned-by-caller="" data-semi-button-line="">
        Label
      </span>
      {items.value.map((name) => (
        <Button key={name} text={name} />
      ))}
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <ButtonGroup v-slots={{ default: () => <Children /> }} />
    )),
  );
  try {
    await nextTick();
    const caller = fixture.host.querySelector("[data-owned-by-caller]")!;
    const buttons = () => [...fixture.host.querySelectorAll("button")];
    const lines = () =>
      fixture.host.querySelectorAll(".semi-button-group-line");
    expect(lines()).toHaveLength(2);
    items.value = ["C", "A", "B"];
    await nextTick();
    await Promise.resolve();
    expect(buttons().map((button) => button.textContent)).toEqual([
      "C",
      "A",
      "B",
    ]);
    expect(lines()).toHaveLength(2);
    for (const button of buttons().slice(0, -1))
      expect(
        button.nextElementSibling?.classList.contains("semi-button-group-line"),
      ).toBe(true);
    items.value = ["B"];
    await nextTick();
    await Promise.resolve();
    expect(lines()).toHaveLength(0);
    expect(fixture.host.contains(caller)).toBe(true);
    items.value = [];
    await nextTick();
    await Promise.resolve();
    expect(buttons()).toHaveLength(0);
    expect(fixture.host.contains(caller)).toBe(true);
  } finally {
    fixture.unmount();
  }
});
