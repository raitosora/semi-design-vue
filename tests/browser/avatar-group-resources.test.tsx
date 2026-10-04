import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import AvatarGroup from "../../packages/semi-ui-vue/src/components/avatar/avatarGroup.js";
import { mountVapor } from "../support/mount-vapor.js";

test("AvatarGroup disconnects each realm-owned observer and rejects late mutation deliveries after unmount", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  const Original = window.MutationObserver;
  const active = new Set<MutationObserver>();
  const deliveries: Array<() => void> = [];
  class Observer extends Original {
    private readonly callback: MutationCallback;
    constructor(callback: MutationCallback) {
      super(callback);
      this.callback = callback;
    }
    observe(target: Node, options?: MutationObserverInit) {
      super.observe(target, options);
      if (
        target instanceof HTMLElement &&
        target.classList.contains("semi-avatar-group") &&
        options?.childList === true
      ) {
        active.add(this);
        deliveries.push(() => this.callback([], this));
      }
    }
    disconnect() {
      super.disconnect();
      active.delete(this);
    }
  }
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: Observer,
  });
  const show = shallowRef(true);
  const root = defineVaporComponent(() => (
    <AvatarGroup v-if={show.value} maxCount={1}>
      {() => (
        <>
          <Avatar children="A" />
          <Avatar children="B" />
        </>
      )}
    </AvatarGroup>
  ));
  const first = mountVapor(root);
  const second = mountVapor(root);
  try {
    await nextTick();
    expect(active.size).toBe(2);
    show.value = false;
    await nextTick();
    expect(active.size).toBe(0);
    for (const deliver of deliveries) deliver();
    expect(first.host.querySelector(".semi-avatar-group")).toBeNull();
    show.value = true;
    await nextTick();
    expect(active.size).toBe(2);
    expect(
      first.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
  } finally {
    first.unmount();
    second.unmount();
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
  expect(active.size).toBe(0);
  for (const deliver of deliveries) deliver();
  expect(first.host.childNodes).toHaveLength(0);
  expect(second.host.childNodes).toHaveLength(0);
});

test("AvatarGroup retains initial registration without MutationObserver", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    window,
    "MutationObserver",
  )!;
  Object.defineProperty(window, "MutationObserver", {
    configurable: true,
    value: undefined,
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <AvatarGroup maxCount={0}>{() => <Avatar children="A" />}</AvatarGroup>
    )),
  );
  try {
    await nextTick();
    expect(
      fixture.host.querySelector<HTMLElement>(
        ".semi-avatar:not(.semi-avatar-item-more)",
      )!.hidden,
    ).toBe(true);
    expect(
      fixture.host.querySelector(".semi-avatar-item-more")?.textContent,
    ).toBe("+1");
  } finally {
    fixture.unmount();
    Object.defineProperty(window, "MutationObserver", descriptor);
  }
});
