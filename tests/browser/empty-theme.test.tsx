import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Empty from "../../packages/semi-ui-vue/src/components/empty/index.js";
import type {
  EmptyProps,
  EmptySlots,
} from "../../packages/semi-ui-vue/src/components/empty/types.js";
import { mountVapor } from "../support/mount-vapor.js";

const settle = async () => {
  await Promise.resolve();
  await nextTick();
};
const light = () => <b data-image="light">light</b>;
const dark = () => <b data-image="dark">dark</b>;

test("Empty observes theme-mode only when dark content is present at mount and disconnects the same observer", async () => {
  const previous = document.body.getAttribute("theme-mode");
  document.body.setAttribute("theme-mode", "dark");
  const Native = window.MutationObserver;
  const records: {
    observer: MutationObserver;
    callback: MutationCallback;
    disconnect: ReturnType<typeof vi.spyOn>;
    observe: ReturnType<typeof vi.spyOn>;
  }[] = [];
  const observerSpy = vi
    .spyOn(window, "MutationObserver")
    .mockImplementation(function (callback: MutationCallback) {
      const observer = new Native(callback);
      records.push({
        observer,
        callback,
        disconnect: vi.spyOn(observer, "disconnect"),
        observe: vi.spyOn(observer, "observe"),
      });
      return observer;
    } as unknown as typeof MutationObserver);
  const props = shallowRef<EmptyProps>({ image: light, darkModeImage: dark });
  const fixture = mountVapor(
    defineVaporComponent(() => <Empty {...props.value} />),
  );
  try {
    await settle();
    expect(fixture.host.textContent).toBe("dark");
    expect(records).toHaveLength(1);
    expect(records[0]!.observe).toHaveBeenCalledWith(document.body, {
      attributes: true,
      childList: false,
      subtree: false,
    });
    document.body.setAttribute("data-empty-unrelated", "change");
    await settle();
    expect(fixture.host.textContent).toBe("dark");
    document.body.setAttribute("theme-mode", "light");
    await settle();
    expect(fixture.host.textContent).toBe("light");
    props.value = { image: light };
    await nextTick();
    document.body.setAttribute("theme-mode", "dark");
    await settle();
    expect(fixture.host.textContent).toBe("light");
    props.value = { image: light, darkModeImage: dark };
    await nextTick();
    expect(fixture.host.textContent).toBe("dark");
    document.body.setAttribute("theme-mode", "DARK");
    await settle();
    expect(fixture.host.textContent).toBe("light");
  } finally {
    fixture.unmount();
    observerSpy.mockRestore();
    document.body.removeAttribute("data-empty-unrelated");
    if (previous === null) document.body.removeAttribute("theme-mode");
    else document.body.setAttribute("theme-mode", previous);
  }
  expect(records[0]!.disconnect).toHaveBeenCalledTimes(1);
  const mutation = {
    type: "attributes",
    attributeName: "theme-mode",
  } as MutationRecord;
  records[0]!.callback([mutation], records[0]!.observer);
  await settle();
  expect(fixture.host.childNodes).toHaveLength(0);
});

test.each([undefined, null, false, 0, ""] as const)(
  "Empty does not retroactively subscribe after initially falsy darkModeImage %s",
  async (initial) => {
    const previous = document.body.getAttribute("theme-mode");
    document.body.setAttribute("theme-mode", "dark");
    const props = shallowRef<EmptyProps>({
      image: light,
      darkModeImage: initial,
    });
    const fixture = mountVapor(
      defineVaporComponent(() => <Empty {...props.value} />),
    );
    try {
      props.value = { image: light, darkModeImage: dark };
      await settle();
      expect(fixture.host.textContent).toBe("light");
      document.body.removeAttribute("theme-mode");
      await settle();
      document.body.setAttribute("theme-mode", "dark");
      await settle();
      expect(fixture.host.textContent).toBe("light");
    } finally {
      fixture.unmount();
      if (previous === null) document.body.removeAttribute("theme-mode");
      else document.body.setAttribute("theme-mode", previous);
    }
  },
);

test("Empty mount-declared dark slot observes even when empty and removal falls back without probing", async () => {
  const previous = document.body.getAttribute("theme-mode");
  document.body.setAttribute("theme-mode", "dark");
  const unused = vi.fn(dark);
  const slots = shallowRef<EmptySlots>({ darkModeImage: () => [] });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Empty
        darkModeImage={unused}
        image={light}
        title="Title"
        v-slots={slots.value}
      />
    )),
  );
  try {
    await settle();
    expect(unused).not.toHaveBeenCalled();
    expect(fixture.host.querySelector("h4")).not.toBeNull();
    expect(fixture.host.querySelector(".semi-empty-image")?.textContent).toBe(
      "",
    );
    slots.value = {};
    await settle();
    expect(unused).toHaveBeenCalledTimes(1);
    expect(fixture.host.querySelector(".semi-empty-image")?.textContent).toBe(
      "dark",
    );
  } finally {
    fixture.unmount();
    if (previous === null) document.body.removeAttribute("theme-mode");
    else document.body.setAttribute("theme-mode", previous);
  }
});
