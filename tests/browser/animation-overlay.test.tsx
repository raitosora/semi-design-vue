import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { userEvent } from "vitest/browser";
import {
  createOverlayHost,
  createOverlayScope,
  type OverlayHostHandle,
} from "semi-ui-vue";
import { usePresence } from "semi-animation-vue";

test("deferred host exit retains focus, stacking and scroll lock until animation completion", async () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const background = createOverlayScope();
  const backClose = vi.fn();
  const back = background.open({ lockScroll: true, onClose: backClose });
  const unmount = vi.fn();
  let entry!: OverlayHostHandle<{ visible: boolean }>;
  const host = createOverlayHost<{ visible: boolean }>({
    overlay: {
      deferClose: true,
      lockScroll: true,
      trapFocus: true,
      target: () => trigger,
    },
    mount(element, state) {
      const View = defineVaporComponent(() => {
        const root = shallowRef<HTMLElement | null>(null);
        const presence = usePresence({
          visible: () => state.props.value.visible,
          element: () => root.value,
          onExited: () => entry.destroy(),
          timeout: 10_000,
        });
        return (
          <section
            v-if={presence.present.value}
            data-phase={presence.phase.value}
            ref={root}
            style={{ animation: "missing 10s" }}
          >
            <button>first</button>
            <button>last</button>
          </section>
        );
      });
      const app = createVaporApp(View);
      app.mount(element);
      return () => {
        app.unmount();
        unmount();
      };
    },
  });
  try {
    entry = host.open(
      { visible: true },
      { onClose: () => entry.update({ visible: false }) },
    );
    await nextTick();
    const buttons = entry.element.querySelectorAll("button");
    buttons[0].focus();
    await userEvent.keyboard("{Escape}");
    await nextTick();
    expect(entry.destroyed).toBe(false);
    expect(entry.element.querySelector("section")?.dataset.phase).toBe(
      "leaving",
    );
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(buttons[1]);
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
    expect(backClose).not.toHaveBeenCalled();
    // Finish only after the real keyboard operation: browser automation latency
    // must not race a short deadline intended to test the retained phase.
    entry.element
      .querySelector("section")!
      .dispatchEvent(
        new AnimationEvent("animationend", { animationName: "missing" }),
      );
    await expect.poll(() => entry.destroyed).toBe(true);
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("hidden");
    back.destroy();
    expect(document.body.style.overflow).not.toBe("hidden");
  } finally {
    host.dispose();
    background.dispose();
    trigger.remove();
  }
});

test("forced host destruction cancels pending enter/exit without a second completion", async () => {
  let state!: ReturnType<typeof usePresence>;
  const complete = vi.fn();
  const host = createOverlayHost<{ visible: boolean }>({
    mount(element, props) {
      const View = defineVaporComponent(() => {
        const target = shallowRef<HTMLElement | null>(null);
        state = usePresence({
          visible: () => props.props.value.visible,
          element: () => target.value,
          onExited: complete,
        });
        return (
          <div
            v-if={state.present.value}
            ref={target}
            style={{ animation: "missing 10s" }}
          >
            content
          </div>
        );
      });
      const app = createVaporApp(View);
      app.mount(element);
      return () => app.unmount();
    },
  });
  try {
    const entry = host.open({ visible: true }, { lockScroll: true });
    await nextTick();
    entry.update({ visible: false });
    await nextTick();
    const child = entry.element.firstElementChild!;
    entry.destroy();
    child.dispatchEvent(
      new AnimationEvent("animationend", { animationName: "missing" }),
    );
    expect(state.phase.value).toBe("disposed");
    expect(complete).not.toHaveBeenCalled();
    expect(document.body.style.overflow).not.toBe("hidden");
  } finally {
    host.dispose();
  }
});
