import { expect, test } from "vitest";
import { createVaporApp, defineVaporComponent, nextTick } from "vue";
import { OverlayEvents } from "../fixtures/OverlayEvents.vapor";
import { createOverlayHost } from "../../packages/semi-ui-vue/src/internal/overlay/host";
import { createOverlayScope } from "../../packages/semi-ui-vue/src/internal/overlay/scope";

test("actual Vue document delegation respects inside pointer stop and Escape cancellation", async () => {
  const calls: string[] = [];
  let cancel = "stop";
  const host = createOverlayHost<Record<string, never>>({
    mount(element) {
      const handle = (event: Event) => {
        calls.push(event.type);
        if (cancel === "stop") event.stopPropagation();
        if (cancel === "prevent") event.preventDefault();
      };
      const app = createVaporApp(
        defineVaporComponent(() => <OverlayEvents handle={handle} />),
      );
      app.mount(element);
      return () => app.unmount();
    },
  });
  const scope = createOverlayScope();
  const lower = scope.open();
  const entry = host.open({});
  const button = entry.element.querySelector("button")!;
  try {
    await nextTick();
    button.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, composed: true }),
    );
    expect(calls).toEqual(["pointerdown"]);
    expect(entry.destroyed || lower.destroyed).toBe(false);
    for (const mode of ["stop", "prevent", "allow"]) {
      cancel = mode;
      button.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
      await Promise.resolve();
      expect(entry.destroyed).toBe(mode === "allow");
    }
    expect(calls).toEqual(["pointerdown", "keydown", "keydown", "keydown"]);
    expect(lower.destroyed).toBe(false);
  } finally {
    host.dispose();
    scope.dispose();
  }
});

test("Vue RC8 document-delegated events do not move to a different document with a native portal", async () => {
  const iframe = document.createElement("iframe");
  document.body.append(iframe);
  const scope = createOverlayScope();
  const entry = scope.open();
  let clicks = 0;
  const handle = (event: Event) => {
    if (event.type === "click") clicks++;
  };
  const app = createVaporApp(
    defineVaporComponent(() => <OverlayEvents handle={handle} />),
  );
  app.mount(entry.element);
  const button = entry.element.querySelector("button")!;
  try {
    button.click();
    expect(clicks).toBe(1);
    entry.update({ container: () => iframe.contentDocument!.body });
    await nextTick();
    button.click();
    expect(clicks).toBe(1);
    entry.update({ container: () => document.body });
    await nextTick();
    button.click();
    expect(clicks).toBe(2);
  } finally {
    app.unmount();
    scope.dispose();
    iframe.remove();
  }
});
