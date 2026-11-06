import type { BasicStepsProps, StepProps } from "./types.js";
/** Preserve the fixed upstream's different status and notification comparisons. */
export function stepsState(
  parent: BasicStepsProps,
  item: StepProps,
  index: number,
) {
  const current = parent.current === undefined ? 0 : parent.current;
  const initial = parent.initial === undefined ? 0 : parent.initial;
  const parentStatus = parent.status === undefined ? "process" : parent.status;
  const position = initial + index;
  return {
    current,
    initial,
    position,
    status:
      item.status ||
      (position === current
        ? parentStatus
        : position < current
          ? "finish"
          : "wait"),
    active: position === current,
    done: position < current,
    className:
      parentStatus === "error" && index === current - 1
        ? `${parent.prefixCls === undefined ? "semi-steps" : parent.prefixCls}-next-error`
        : item.className,
  };
}
