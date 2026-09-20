import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import { usePresence } from "semi-animation-vue";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const motionStyle =
  ".resource-enter{animation:resource-enter 80ms}.resource-leave{animation:resource-leave 80ms}@keyframes resource-enter{from{opacity:0}to{opacity:1}}@keyframes resource-leave{from{opacity:1}to{opacity:0}}";

interface MountedPresence {
  readonly host: HTMLElement;
  readonly setVisible: (value: boolean) => void;
  readonly finish: () => void;
  readonly phase: () => string;
  readonly unmount: () => void;
}

function mountPresence(label: string): MountedPresence {
  const visible = ref(true);
  let control!: ReturnType<typeof usePresence>;
  const Fixture = defineVaporComponent(() => {
    const element = shallowRef<HTMLElement | null>(null);
    control = usePresence({
      visible: () => visible.value,
      element: () => element.value,
      enterClass: "resource-enter",
      leaveClass: "resource-leave",
      timeout: 200,
    });
    return (
      <div
        v-if={control.present.value}
        class="resource-presence"
        data-label={label}
        data-phase={control.phase.value}
        ref={element}
      >
        {label}
      </div>
    );
  });
  const host = document.createElement("div");
  host.dataset.animationMount = label;
  document.querySelector("#resource-consumer")?.append(host);
  const app = createVaporApp(Fixture);
  app.mount(host);
  return {
    host,
    setVisible(value) {
      visible.value = value;
    },
    finish() {
      control.finish();
    },
    phase() {
      return control.phase.value;
    },
    unmount() {
      app.unmount();
      host.remove();
    },
  };
}

/** Runs against installed dist packages after Vite's real Vapor compilation. */
export async function checkAnimationConsumer(): Promise<string> {
  const style = document.createElement("style");
  style.textContent = motionStyle;
  document.head.append(style);
  const first = mountPresence("first");
  const second = mountPresence("second");
  try {
    await nextTick();
    first.finish();
    second.finish();
    await nextTick();
    const retained =
      first.host.querySelector<HTMLElement>(".resource-presence");
    assert(retained, "Presence did not mount an explicit DOM element");
    assert(first.phase() === "entered", "Enter motion did not settle");

    first.setVisible(false);
    await nextTick();
    assert(first.phase() === "leaving", "Leave motion did not start");
    assert(retained.isConnected, "Exit removed DOM before leave completion");
    assert(
      retained.classList.contains("resource-leave"),
      "Leave CSS class was not applied to the retained DOM",
    );

    first.setVisible(true);
    await nextTick();
    first.finish();
    await nextTick();
    assert(first.phase() === "entered", "Rapid leave-to-enter did not settle");
    assert(
      first.host.querySelector(".resource-presence") === retained,
      "Rapid reversal replaced retained DOM",
    );
    assert(
      !retained.classList.contains("resource-leave"),
      "Cancelled leave class remained on reversed DOM",
    );
    assert(
      second.host.querySelector(".resource-presence"),
      "One app's motion affected the other mounted app",
    );

    first.setVisible(false);
    await nextTick();
    first.finish();
    await nextTick();
    assert(
      !first.host.querySelector(".resource-presence"),
      "Completed leave did not destroy the retained DOM",
    );
    assert(
      second.host.querySelector(".resource-presence"),
      "Completed leave leaked across independent apps",
    );
    return "animation consumer passed";
  } finally {
    first.unmount();
    second.unmount();
    style.remove();
  }
}
