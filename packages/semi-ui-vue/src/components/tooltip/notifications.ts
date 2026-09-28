import { shallowRef, watch, type EmitFn } from "vue";
import type { TooltipProps } from "./types.js";
export type TooltipEmits = {
  "visible-change": (value: boolean) => void;
  "update:visible": (value: boolean) => void;
  "click-out-side": (event: PointerEvent) => void;
  "esc-key-down": (event: KeyboardEvent) => void;
};
type Notification =
  | { kind: "visible" | "update"; value: boolean }
  | { kind: "outside"; value: PointerEvent }
  | { kind: "escape"; value: KeyboardEvent };

/** Use Vue-owned watcher callbacks so notification exceptions reach the app error handler. */
export function createTooltipNotifications(
  props: TooltipProps,
  resolved: () => TooltipProps,
  emit: EmitFn<TooltipEmits>,
) {
  const notification = shallowRef<Notification>();
  watch(
    notification,
    (request) => {
      if (!request) return;
      let result: unknown;
      switch (request.kind) {
        case "visible":
          if (props.onVisibleChange === undefined)
            result = resolved().onVisibleChange?.(request.value);
          emit("visible-change", request.value);
          return result;
        case "update":
          if (props["onUpdate:visible"] === undefined)
            result = resolved()["onUpdate:visible"]?.(request.value);
          emit("update:visible", request.value);
          return result;
        case "outside":
          if (props.onClickOutSide === undefined)
            result = resolved().onClickOutSide?.(request.value);
          emit("click-out-side", request.value);
          return result;
        case "escape":
          if (props.onEscKeyDown === undefined)
            result = resolved().onEscKeyDown?.(request.value);
          emit("esc-key-down", request.value);
          return result;
      }
    },
    { flush: "sync" },
  );
  return notification;
}
