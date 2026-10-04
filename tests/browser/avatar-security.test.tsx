import { defineVaporComponent } from "vue";
import { expect, test } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import type { AvatarProps } from "../../packages/semi-ui-vue/src/components/avatar/types.js";
import { mountVapor } from "../support/mount-vapor.js";

for (const name of [
  "innerHTML",
  ".innerHTML",
  "^innerHTML",
  "textContent",
  ".textContent",
  "^textContent",
  "outerHTML",
  ".outerHTML",
  "innerText",
  ".innerText",
  "outerText",
  ".outerText",
]) {
  test(`Avatar rejects forced native ${name} writes while retaining owned content`, () => {
    const unsafe = {
      [name]: "<b data-avatar-injected>unsafe</b>",
      "data-safe": "kept",
    } as unknown as AvatarProps;
    const fixture = mountVapor(
      defineVaporComponent(() => <Avatar {...unsafe} children="owned" />),
    );
    try {
      const root = fixture.host.querySelector(".semi-avatar")!;
      expect(root.textContent).toBe("owned");
      expect(root.getAttribute("data-safe")).toBe("kept");
      expect(root.hasAttribute(name.replace(/^[.^]/, ""))).toBe(false);
      expect(root.querySelector("[data-avatar-injected]")).toBeNull();
    } finally {
      fixture.unmount();
    }
  });
  test(`Avatar rejects forced imgAttr ${name} writes`, () => {
    const unsafe = {
      [name]: "<b data-avatar-injected>unsafe</b>",
      "data-safe": "kept",
    } as unknown as AvatarProps["imgAttr"];
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Avatar
          imgAttr={unsafe}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
        />
      )),
    );
    try {
      const image = fixture.host.querySelector("img")!;
      expect(image.textContent).toBe("");
      expect(image.getAttribute("data-safe")).toBe("kept");
      expect(image.hasAttribute(name.replace(/^[.^]/, ""))).toBe(false);
      expect(image.querySelector("[data-avatar-injected]")).toBeNull();
    } finally {
      fixture.unmount();
    }
  });
}

for (const name of [
  "onclick",
  "onerror",
  "onload",
  "^onclick",
  ".onclick",
  "onClick",
]) {
  test(`Avatar discards string event attribute ${name} without executing markup`, () => {
    const unsafe = {
      [name]: "window.__avatarUnsafe = true",
    } as unknown as AvatarProps["imgAttr"];
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Avatar
          imgAttr={unsafe}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
        />
      )),
    );
    try {
      const image = fixture.host.querySelector("img")!;
      expect(image.hasAttribute(name.replace(/^[.^]/, ""))).toBe(false);
      expect(image.onclick).toBeNull();
      expect(image.onerror).toBeNull();
    } finally {
      fixture.unmount();
    }
  });
}

for (const [name, eventName] of [
  ["onload", "load"],
  [".onload", "load"],
  ["onabort", "abort"],
  [".onabort", "abort"],
  ["onLoadOnce", "load"],
  ["onLoadCapture", "load"],
  ["onAbortPassive", "abort"],
  ["on:load", "load"],
  ["on:loadOnce", "load"],
] as const) {
  test(`Avatar imgAttr ${name} cannot bypass owned image event guards`, async () => {
    const { shallowRef, nextTick } = await import("vue");
    const { vi } = await import("vitest");
    const alias = vi.fn();
    const a =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
    const b =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'/%3E";
    const props = shallowRef<AvatarProps>({
      src: a,
      imgAttr: { [name]: alias } as AvatarProps["imgAttr"],
    });
    const fixture = mountVapor(
      defineVaporComponent(() => <Avatar {...props.value} />),
    );
    try {
      const previous = fixture.host.querySelector("img")!;
      props.value = { ...props.value, src: b };
      previous.dispatchEvent(new Event(eventName));
      expect(alias).not.toHaveBeenCalled();
      await nextTick();
      previous.dispatchEvent(new Event(eventName));
      expect(alias).not.toHaveBeenCalled();
      const current = fixture.host.querySelector("img")!;
      current.dispatchEvent(new Event(eventName));
      expect(alias).not.toHaveBeenCalled();
    } finally {
      fixture.unmount();
    }
  });
}

for (const name of [
  ".src",
  "^src",
  ".srcset",
  "^srcset",
  "srcSet",
  ".srcSet",
]) {
  test(`Avatar ignores noncanonical source binding ${name}`, () => {
    const source =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
    const other =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'/%3E";
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Avatar imgAttr={{ [name]: other }} src={source} />
      )),
    );
    try {
      const image = fixture.host.querySelector("img")!;
      expect(image.src).toBe(source);
      expect(image.srcset).toBe("");
      expect(image.getAttribute(name)).toBeNull();
    } finally {
      fixture.unmount();
    }
  });
}
