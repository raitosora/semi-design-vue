import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import type { AvatarProps } from "../../packages/semi-ui-vue/src/components/avatar/types.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Avatar defaults, undefined removal, text, shape and dimensions are live", async () => {
  const props = shallowRef<AvatarProps>({ children: "AB" });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    const node = fixture.host.querySelector<HTMLElement>(".semi-avatar")!;
    expect(node.classList.contains("semi-avatar-medium")).toBe(true);
    expect(node.classList.contains("semi-avatar-circle")).toBe(true);
    expect(node.classList.contains("semi-avatar-grey")).toBe(true);
    expect(node.querySelector("[role=img]")?.getAttribute("aria-label")).toBe(
      "AB",
    );
    props.value = {
      children: "CD",
      size: "64px",
      shape: "square",
      color: "red",
      alt: "person",
    };
    await nextTick();
    expect(node.style.width).toBe("64px");
    expect(node.style.height).toBe("64px");
    expect(node.textContent).toBe("CD");
    expect(node.querySelector("[role=img]")?.getAttribute("aria-label")).toBe(
      "person",
    );
    props.value = {
      children: "EF",
      size: undefined,
      shape: undefined,
      color: undefined,
    };
    await nextTick();
    expect(node.classList.contains("semi-avatar-medium")).toBe(true);
    expect(node.style.width).toBe("");
    expect(node.textContent).toBe("EF");
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Avatar image failure calls zero-argument error once and respects false", async () => {
  const error = vi.fn(() => false);
  const props = shallowRef<AvatarProps>({
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
    children: "fallback",
    onError: error,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    const image = fixture.host.querySelector("img")!;
    image.dispatchEvent(new Event("error"));
    await nextTick();
    expect(error.mock.calls).toEqual([[]]);
    expect(fixture.host.querySelector("img")).toBe(image);
    props.value = { ...props.value, onError: () => undefined };
    await nextTick();
    image.dispatchEvent(new Event("error"));
    await nextTick();
    expect(fixture.host.querySelector("img")).toBeNull();
    expect(fixture.host.textContent).toBe("fallback");
  } finally {
    fixture.unmount();
  }
});

test("Avatar owns hover and top/bottom callback trees with click keyboard behavior", async () => {
  const click = vi.fn();
  const enter = vi.fn();
  const leave = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Avatar
        bottomSlot={{ render: () => <em>bottom</em> }}
        children="AB"
        hoverMask={() => <i>hover</i>}
        onClick={click}
        onMouseEnter={enter}
        onMouseLeave={leave}
        topSlot={{ render: () => <b>top</b> }}
      />
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(
      ".semi-avatar-wrapper",
    )!;
    root.dispatchEvent(new MouseEvent("mouseenter"));
    await nextTick();
    expect(enter).toHaveBeenCalledTimes(1);
    expect(
      fixture.host.querySelector(".semi-avatar-hover i")?.textContent,
    ).toBe("hover");
    expect(fixture.host.querySelector("b")?.textContent).toBe("top");
    expect(fixture.host.querySelector("em")?.textContent).toBe("bottom");
    const label =
      fixture.host.querySelector<HTMLElement>(".semi-avatar-label")!;
    label.focus();
    const keyboard = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    label.dispatchEvent(keyboard);
    expect(keyboard.defaultPrevented).toBe(true);
    expect(click.mock.calls).toEqual([[keyboard]]);
    label.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(document.activeElement).not.toBe(label);
    root.dispatchEvent(new MouseEvent("mouseleave"));
    await nextTick();
    expect(leave).toHaveBeenCalledTimes(1);
    expect(fixture.host.querySelector(".semi-avatar-hover")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("Avatar imgAttr handlers override once and merged click listeners both fire", async () => {
  const imageError = vi.fn();
  const avatarError = vi.fn();
  const imageFocus = vi.fn();
  const first = vi.fn();
  const second = vi.fn();
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Avatar
          imgAttr={{
            onError: imageError,
            onFocus: imageFocus,
            class: "discarded",
          }}
          onError={avatarError}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
        />
        <Avatar
          children="click"
          {...{ onClick: first }}
          {...{ onClick: second }}
        />
      </>
    )),
  );
  try {
    const image = fixture.host.querySelector("img")!;
    const error = new Event("error");
    image.dispatchEvent(error);
    expect(imageError.mock.calls).toEqual([[error]]);
    expect(avatarError).not.toHaveBeenCalled();
    const focus = new FocusEvent("focus");
    image.dispatchEvent(focus);
    expect(imageFocus.mock.calls).toEqual([[focus]]);
    expect(image.classList.contains("discarded")).toBe(false);
    const label =
      fixture.host.querySelector<HTMLElement>(".semi-avatar-label")!;
    label.click();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  } finally {
    fixture.unmount();
  }
});

test("Avatar preserves native hidden, inert and aria-hidden attributes", async () => {
  const props = shallowRef<AvatarProps>({
    children: "hidden",
    hidden: true,
    ...({ inert: "" } as unknown as Pick<AvatarProps, "inert">),
    "aria-hidden": "false",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    const avatar = fixture.host.querySelector<HTMLElement>(".semi-avatar")!;
    expect(avatar.hasAttribute("hidden")).toBe(true);
    expect(avatar.hasAttribute("inert")).toBe(true);
    expect(avatar.getAttribute("aria-hidden")).toBe("false");
    props.value = { children: "visible", "aria-hidden": "true" };
    await nextTick();
    expect(avatar.hasAttribute("hidden")).toBe(false);
    expect(avatar.hasAttribute("inert")).toBe(false);
    expect(avatar.getAttribute("aria-hidden")).toBe("true");
  } finally {
    fixture.unmount();
  }
});
