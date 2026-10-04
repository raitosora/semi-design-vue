import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import type { AvatarProps } from "../../packages/semi-ui-vue/src/components/avatar/types.js";
import { mountVapor } from "../support/mount-vapor.js";
import "../../packages/semi-ui-vue/dist/styles/base.css";
import "../../packages/semi-ui-vue/dist/styles/components/avatar.css";

const svg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";

test("Avatar border container inherits custom dimensions and style updates", async () => {
  const props = shallowRef<AvatarProps>({
    border: true,
    children: "A",
    size: "small",
    style: { width: "80px", height: "80px" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Avatar {...props.value} />),
  );
  try {
    const wrapper = fixture.host.querySelector<HTMLElement>(
      ".semi-avatar-wrapper",
    )!;
    const container = wrapper.firstElementChild as HTMLElement;
    const face = container.querySelector<HTMLElement>(".semi-avatar")!;
    expect(container.getBoundingClientRect().width).toBe(80);
    expect(container.getBoundingClientRect().height).toBe(80);
    expect(face.getBoundingClientRect().x).toBe(
      wrapper.getBoundingClientRect().x,
    );
    props.value = {
      border: true,
      children: "A",
      size: "64px",
      style: { position: "absolute" },
    };
    await nextTick();
    expect(container.style.width).toBe("64px");
    expect(container.style.height).toBe("64px");
    expect(container.style.position).toBe("absolute");
    props.value = { border: true, children: "A", size: "small" };
    await nextTick();
    expect(container.style.width).toBe("");
    expect(container.style.height).toBe("");
    expect(container.style.position).toBe("relative");
  } finally {
    fixture.unmount();
  }
});

const managed = [
  "onLoad",
  "onAbort",
  "onError",
  "onKeydown",
  "onFocus",
  "onBlur",
] as const;
for (const name of managed) {
  for (const [kind, value] of [
    ["array", [() => undefined]],
    ["string", "callback"],
    ["number", 1],
    ["object", {}],
  ] as const) {
    test(`Avatar rejects invalid imgAttr ${name} ${kind} before mounting event listeners`, () => {
      const props = {
        src: svg,
        imgAttr: { [name]: value },
      } as unknown as AvatarProps;
      const host = document.createElement("div");
      document.body.append(host);
      let errors: unknown[] = [];
      let warnings: string[] = [];
      const app = createVaporApp(
        defineVaporComponent(() => <Avatar {...props} />),
      );
      app.config.errorHandler = (error) => {
        errors = [...errors, error];
      };
      app.config.warnHandler = (message) => {
        warnings = [...warnings, message];
      };
      try {
        app.mount(host);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(TypeError);
        expect((errors[0] as TypeError).message).toBe(
          `Avatar imgAttr.${name} must be a function.`,
        );
        expect(host.querySelector("img")).toBeNull();
        expect(warnings).toEqual([
          "Vapor component setup() returned non-block value, and has no render function.",
        ]);
      } finally {
        app.unmount();
        host.remove();
      }
    });
  }
  test(`Avatar imgAttr ${name} accepts a single native callback and nullish absence`, async () => {
    const callback = vi.fn();
    const fallback = vi.fn(() => false);
    const props = shallowRef<AvatarProps>({
      src: svg,
      onError: fallback,
      imgAttr: { [name]: callback },
    });
    const fixture = mountVapor(
      defineVaporComponent(() => <Avatar {...props.value} />),
    );
    try {
      const image = fixture.host.querySelector("img")!;
      const event = new Event(name.slice(2).toLowerCase());
      image.dispatchEvent(event);
      expect(callback.mock.calls).toEqual([[event]]);
      for (const value of [null, undefined]) {
        props.value = {
          ...props.value,
          imgAttr: { [name]: value } as AvatarProps["imgAttr"],
        };
        await nextTick();
        image.dispatchEvent(new Event(event.type));
      }
      expect(callback).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledTimes(name === "onError" ? 2 : 0);
      expect(fixture.host.querySelector("img")).toBe(image);
    } finally {
      fixture.unmount();
    }
  });
}

for (const change of ["source", "fallback"] as const) {
  test(`Avatar clears focus when its focused image is removed by ${change}`, async () => {
    const props = shallowRef<AvatarProps>({
      src: svg,
      children: "fallback",
      onClick: () => undefined,
    });
    const fixture = mountVapor(
      defineVaporComponent(() => <Avatar {...props.value} />),
    );
    try {
      const image = fixture.host.querySelector("img")!;
      image.focus();
      await nextTick();
      expect(document.activeElement).toBe(image);
      expect(image.matches(":focus-visible")).toBe(true);
      expect(fixture.host.querySelector(".semi-avatar-focus")).not.toBeNull();
      if (change === "source")
        props.value = { ...props.value, src: `${svg}#next` };
      else image.dispatchEvent(new Event("error"));
      await nextTick();
      expect(image.isConnected).toBe(false);
      expect(document.activeElement).toBe(document.body);
      expect(fixture.host.querySelector(".semi-avatar-focus")).toBeNull();
    } finally {
      fixture.unmount();
    }
  });
}

for (const change of ["number", "slot"] as const) {
  test(`Avatar clears focus on label to ${change} replacement but keeps it for text updates`, async () => {
    const children = shallowRef<string | number>("before");
    const rich = shallowRef(false);
    const fixture = mountVapor(
      defineVaporComponent(() => (
        <Avatar
          children={children.value}
          onClick={() => undefined}
          v-slots={rich.value ? { default: () => <button>rich</button> } : {}}
        />
      )),
    );
    try {
      const label =
        fixture.host.querySelector<HTMLElement>(".semi-avatar-label")!;
      label.focus();
      await nextTick();
      expect(document.activeElement).toBe(label);
      expect(label.matches(":focus-visible")).toBe(true);
      children.value = "after";
      await nextTick();
      expect(fixture.host.querySelector(".semi-avatar-label")).toBe(label);
      expect(document.activeElement).toBe(label);
      expect(fixture.host.querySelector(".semi-avatar-focus")).not.toBeNull();
      if (change === "number") children.value = 42;
      else rich.value = true;
      await nextTick();
      expect(label.isConnected).toBe(false);
      expect(document.activeElement).toBe(document.body);
      expect(fixture.host.querySelector(".semi-avatar-focus")).toBeNull();
    } finally {
      fixture.unmount();
    }
  });
}
