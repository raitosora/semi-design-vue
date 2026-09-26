import { onBeforeUnmount, ref, watch } from "vue";
import type { ComputedRef } from "vue";
import { createFoundationScope } from "semi-animation-vue/lifecycle";
import type { ProgressProps } from "./types.js";

/** Non-finite runtime inputs cannot enter RAF or SVG/ARIA geometry. */
export function finitePercent(value: number | undefined): number {
  return value === Infinity
    ? 100
    : value !== undefined && Number.isFinite(value)
      ? value
      : 0;
}
export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function usePercentNumber(props: ComputedRef<ProgressProps>) {
  const resources = createFoundationScope();
  const percentNumber = ref(finitePercent(props.value.percent));
  let cancelFrame: (() => void) | undefined;
  const cancel = () => {
    cancelFrame?.();
    cancelFrame = undefined;
    resources.invalidate();
  };
  watch(
    () => [finitePercent(props.value.percent), props.value.motion] as const,
    ([target, motion], [previous, oldMotion]) => {
      if (target === previous && motion === oldMotion) return;
      cancel();
      if (!motion || target === previous) {
        percentNumber.value = target;
        return;
      }
      const task = resources.task();
      const started = performance.now();
      const difference = target - previous;
      const frame = (now: number) => {
        task.commit(() => {
          const elapsed = Math.min(1, Math.max(0, (now - started) / 300));
          if (elapsed === 1) {
            cancelFrame = undefined;
            percentNumber.value = target;
          } else {
            // Preserve upstream arithmetic order for ordinary integer frames;
            // only opposite extreme endpoints need overflow-safe interpolation.
            percentNumber.value = Number.parseInt(
              String(
                Number.isFinite(difference)
                  ? previous + elapsed * difference
                  : previous * (1 - elapsed) + target * elapsed,
              ),
              10,
            );
            cancelFrame = resources.frame(frame);
          }
        });
      };
      cancelFrame = resources.frame(frame);
    },
    { flush: "sync" },
  );
  onBeforeUnmount(() => resources.dispose());
  return percentNumber;
}
