import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test, vi } from "vitest";
import Card from "../../packages/semi-ui-vue/src/components/card/index.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";
import type {
  CardContent,
  CardSlots,
} from "../../packages/semi-ui-vue/src/components/card/types.js";
import { installResourceTracker } from "../support/resource-tracker.js";

test("Card string title releases inherited Typography resources through string-slot-string replacement and disposal", async () => {
  const title = shallowRef<CardContent>("Measured Card title ".repeat(20));
  const slots = shallowRef<CardSlots>({});
  // App bootstrap owns Vue devtools timing; track only mounted component resources.
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("card-resources");
      return (
        <Card
          style={{ width: "140px" }}
          title={title.value}
          v-slots={slots.value}
        />
      );
    }),
  );
  const host = document.createElement("div");
  const fixture = {
    host,
    unmount() {
      app.unmount();
      host.remove();
    },
  };
  const tracker = installResourceTracker(window, document);
  const observe = vi.spyOn(ResizeObserver.prototype, "observe");
  const disconnect = vi.spyOn(ResizeObserver.prototype, "disconnect");
  try {
    document.body.append(host);
    app.mount(host);
    await nextTick();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
    expect(fixture.host.querySelector("h6")).not.toBeNull();
    expect(observe).toHaveBeenCalled();
    slots.value = { title: () => <button>Native title</button> };
    await nextTick();
    expect(fixture.host.querySelector("h6")).toBeNull();
    expect(disconnect).toHaveBeenCalled();
    slots.value = {};
    await nextTick();
    expect(fixture.host.querySelector("h6")).not.toBeNull();
    title.value = null;
    await nextTick();
    expect(fixture.host.querySelector(".semi-card-header")).toBeNull();
    fixture.unmount();
    await nextTick();
    tracker.assertClean();
    expect(document.querySelector(".semi-tooltip-wrapper")).toBeNull();
    expect(fixture.host.childNodes).toHaveLength(0);
  } finally {
    if (fixture.host.isConnected) fixture.unmount();
    observe.mockRestore();
    disconnect.mockRestore();
    tracker.restore();
  }
});
