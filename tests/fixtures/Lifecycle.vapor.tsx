import { defineVaporComponent, onMounted, onUnmounted, ref } from "vue";

export interface LifecycleProps {
  label: string;
  onPulse: () => void;
  onDispose: () => void;
}

export const Lifecycle = defineVaporComponent(
  (props: LifecycleProps) => {
    const count = ref(0);
    const element = ref<HTMLElement | null>(null);
    onMounted(() => {
      const pulse = () => props.onPulse();
      window.addEventListener("semi-test-pulse", pulse);
      const timer = window.setInterval(() => {}, 60_000);
      const observer = new ResizeObserver(() => {});
      observer.observe(element.value!);
      const frame = requestAnimationFrame(() => {});
      onUnmounted(() => {
        window.removeEventListener("semi-test-pulse", pulse);
        clearInterval(timer);
        observer.disconnect();
        cancelAnimationFrame(frame);
        props.onDispose();
      });
    });
    return (
      <section aria-label={props.label} ref={element}>
        <h2>{props.label}</h2>
        <button
          onClick={() => {
            count.value += 1;
          }}
        >
          Count {count.value}
        </button>
        <p v-if={count.value > 0}>Changed</p>
      </section>
    );
  },
  { props: ["label", "onPulse", "onDispose"] },
);
