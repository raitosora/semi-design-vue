import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import type { AvatarProps } from "../../packages/semi-ui-vue/src/components/avatar/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const imageSource = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="${color}"/></svg>`)}`;
const broken = "data:image/png;base64,aW52YWxpZA==";
const loaded = (host: HTMLElement) => {
  const image = host.querySelector("img");
  return (
    !!image?.complete && image.naturalWidth === 8 && image.naturalHeight === 6
  );
};

test("Avatar uses real initial and browser-cached image loads with one live img and alt", async () => {
  const src = imageSource("red");
  const cache = new Image();
  cache.src = src;
  await cache.decode();
  expect(cache.naturalWidth).toBe(8);
  const load = vi.fn();
  const error = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <Avatar
        alt="Ada"
        children="fallback"
        imgAttr={{ onLoad: load }}
        onError={error}
        src={src}
      />
    )),
  );
  try {
    await expect.poll(() => loaded(f.host)).toBe(true);
    await expect.poll(() => load.mock.calls.length).toBe(1);
    expect(f.host.querySelectorAll("img")).toHaveLength(1);
    expect(f.host.querySelector("img")?.alt).toBe("Ada");
    expect(f.host.textContent).toBe("");
    expect(error).not.toHaveBeenCalled();
    expect((load.mock.calls[0]?.[0] as Event).isTrusted).toBe(true);
  } finally {
    f.unmount();
  }
});

test("Avatar real decode failures run zero-argument callback before fallback and false preserves image", async () => {
  const props = shallowRef<AvatarProps>({ src: broken, children: "recover" });
  const observations: boolean[] = [];
  const error = vi.fn(() => {
    observations.push(!!f.host.querySelector("img"));
  });
  props.value = { ...props.value, onError: error };
  const f = mountVapor(defineVaporComponent(() => <Avatar {...props.value} />));
  try {
    await expect.poll(() => f.host.textContent).toBe("recover");
    expect(error.mock.calls).toEqual([[]]);
    expect(observations).toEqual([true]);
    expect(f.host.querySelector("img")).toBeNull();
    const suppress = vi.fn(() => false);
    props.value = {
      src: imageSource("blue"),
      children: "recover",
      onError: suppress,
    };
    await expect.poll(() => loaded(f.host)).toBe(true);
    props.value = { ...props.value, src: `${broken}#second` };
    await expect.poll(() => suppress.mock.calls.length).toBe(1);
    const failed = f.host.querySelector("img")!;
    expect(failed.complete).toBe(true);
    expect(failed.naturalWidth).toBe(0);
    expect(f.host.textContent).toBe("");
    props.value = { ...props.value, src: "" };
    await nextTick();
    expect(f.host.textContent).toBe("recover");
  } finally {
    f.unmount();
  }
});

test("Avatar source revisions ignore detached load/error callbacks through A-B-A and unmount/remount", async () => {
  const src = shallowRef(imageSource("red"));
  const shown = shallowRef(true);
  const error = vi.fn();
  const f = mountVapor(
    defineVaporComponent(() => (
      <div>
        {shown.value && (
          <Avatar children="fallback" onError={error} src={src.value} />
        )}
      </div>
    )),
  );
  try {
    await expect.poll(() => loaded(f.host)).toBe(true);
    const first = f.host.querySelector("img")!;
    src.value = imageSource("blue");
    await nextTick();
    const second = f.host.querySelector("img")!;
    src.value = imageSource("red");
    await nextTick();
    const current = f.host.querySelector("img")!;
    expect(second).not.toBe(first);
    expect(current).not.toBe(second);
    for (const old of [first, second]) {
      expect(old.isConnected).toBe(false);
      old.dispatchEvent(new Event("error"));
      old.dispatchEvent(new Event("load"));
    }
    await expect.poll(() => loaded(f.host)).toBe(true);
    expect(error).not.toHaveBeenCalled();
    expect(f.host.querySelector("img")).toBe(current);
    shown.value = false;
    await nextTick();
    current.dispatchEvent(new Event("error"));
    shown.value = true;
    await expect.poll(() => loaded(f.host)).toBe(true);
    expect(f.host.querySelector("img")).not.toBe(current);
    expect(error).not.toHaveBeenCalled();
  } finally {
    f.unmount();
  }
});

test("Avatar imgAttr source precedence and dynamic removal load the effective source", async () => {
  const props = shallowRef<AvatarProps>({
    src: broken,
    srcSet: undefined,
    alt: "outer",
    children: "fallback",
    imgAttr: { src: imageSource("green"), alt: "effective" },
  });
  const f = mountVapor(defineVaporComponent(() => <Avatar {...props.value} />));
  try {
    await expect.poll(() => loaded(f.host)).toBe(true);
    expect(f.host.querySelector("img")?.alt).toBe("effective");
    const old = f.host.querySelector("img")!;
    props.value = {
      src: imageSource("purple"),
      alt: "restored",
      children: "fallback",
    };
    await expect
      .poll(() => f.host.querySelector("img")?.getAttribute("src"))
      .toBe(imageSource("purple"));
    await expect.poll(() => loaded(f.host)).toBe(true);
    expect(f.host.querySelector("img")?.alt).toBe("restored");
    old.dispatchEvent(new Event("error"));
    await nextTick();
    expect(f.host.querySelector("img")).not.toBeNull();
  } finally {
    f.unmount();
  }
});

test("Avatar onError source replacement cannot mark the new revision failed", async () => {
  const src = shallowRef(broken);
  const error = vi.fn(() => {
    src.value = imageSource("orange");
  });
  const f = mountVapor(
    defineVaporComponent(() => (
      <Avatar children="fallback" onError={error} src={src.value} />
    )),
  );
  try {
    await expect.poll(() => error.mock.calls.length).toBe(1);
    await expect.poll(() => loaded(f.host)).toBe(true);
    expect(f.host.textContent).toBe("");
    expect(error.mock.calls).toEqual([[]]);
  } finally {
    f.unmount();
  }
});

test("Avatar same-tick obsolete image errors cannot notify the replacement callback", async () => {
  const oldError = vi.fn();
  const nextError = vi.fn();
  const props = shallowRef<AvatarProps>({
    src: imageSource("red"),
    onError: oldError,
    children: "fallback",
  });
  const f = mountVapor(defineVaporComponent(() => <Avatar {...props.value} />));
  try {
    await expect.poll(() => loaded(f.host)).toBe(true);
    const old = f.host.querySelector("img")!;
    props.value = {
      ...props.value,
      src: imageSource("blue"),
      onError: nextError,
    };
    old.dispatchEvent(new Event("error"));
    await expect.poll(() => loaded(f.host)).toBe(true);
    expect(oldError).not.toHaveBeenCalled();
    expect(nextError).not.toHaveBeenCalled();
    expect(f.host.textContent).toBe("");
  } finally {
    f.unmount();
  }
});

test("Avatar srcSet selection and source-set removal decode the effective browser image", async () => {
  const selected = imageSource("cyan");
  const fallback = imageSource("brown");
  const props = shallowRef<AvatarProps>({
    src: fallback,
    srcSet: `${selected} 1x`,
    children: "fallback",
  });
  const f = mountVapor(defineVaporComponent(() => <Avatar {...props.value} />));
  try {
    await expect.poll(() => loaded(f.host)).toBe(true);
    await expect
      .poll(() => f.host.querySelector("img")?.currentSrc)
      .toBe(selected);
    const previous = f.host.querySelector("img")!;
    props.value = { src: fallback, children: "fallback" };
    await expect
      .poll(() => f.host.querySelector("img")?.currentSrc)
      .toBe(fallback);
    await expect.poll(() => loaded(f.host)).toBe(true);
    previous.dispatchEvent(new Event("error"));
    await nextTick();
    expect(f.host.querySelector("img")?.currentSrc).toBe(fallback);
  } finally {
    f.unmount();
  }
});

test.each(["load", "abort"] as const)(
  "Avatar obsolete imgAttr %s callbacks stay inert across synchronous replacement and disposal",
  async (eventType) => {
    const previousCallback = vi.fn();
    const currentCallback = vi.fn();
    const attrs = (callback: (event: Event) => void) =>
      eventType === "load" ? { onLoad: callback } : { onAbort: callback };
    const props = shallowRef<AvatarProps>({
      src: imageSource("gold"),
      imgAttr: attrs(previousCallback),
    });
    const f = mountVapor(
      defineVaporComponent(() => <Avatar {...props.value} />),
    );
    try {
      await expect.poll(() => loaded(f.host)).toBe(true);
      if (eventType === "load")
        await expect.poll(() => previousCallback.mock.calls.length).toBe(1);
      previousCallback.mockClear();
      const old = f.host.querySelector("img")!;
      props.value = {
        src: imageSource("silver"),
        imgAttr: attrs(currentCallback),
      };
      old.dispatchEvent(new Event(eventType));
      expect(previousCallback).not.toHaveBeenCalled();
      expect(currentCallback).not.toHaveBeenCalled();
      await expect.poll(() => loaded(f.host)).toBe(true);
      if (eventType === "load")
        await expect.poll(() => currentCallback.mock.calls.length).toBe(1);
      currentCallback.mockClear();
      const current = f.host.querySelector("img")!;
      expect(current).not.toBe(old);
      old.dispatchEvent(new Event(eventType));
      expect(previousCallback).not.toHaveBeenCalled();
      expect(currentCallback).not.toHaveBeenCalled();
      const event = new Event(eventType);
      current.dispatchEvent(event);
      expect(currentCallback.mock.calls).toEqual([[event]]);
      f.unmount();
      current.dispatchEvent(new Event(eventType));
      old.dispatchEvent(new Event(eventType));
      expect(currentCallback.mock.calls).toEqual([[event]]);
      expect(previousCallback).not.toHaveBeenCalled();
    } finally {
      if (f.host.isConnected) f.unmount();
    }
  },
);
