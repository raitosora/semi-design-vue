// Adapted from Semi Design 2.103.0 input/util/{getSizingData,calculateNodeHeight}
// and semi-ui/input/textarea.tsx, MIT. A measurement node belongs to its call
// and owner document; unlike the upstream singleton it is always removed.
import { computed, onBeforeUnmount, shallowRef, watch, type Ref } from "vue";
import { observeResize } from "../../dom/resources.js";
import { createDomScheduler } from "../../dom/scheduling.js";
import { notifyTextarea } from "./textarea-state.js";
import type { TextAreaProps } from "./textarea-types.js";

const sizingKeys = [
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "boxSizing",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "tabSize",
  "textIndent",
  "textRendering",
  "textTransform",
  "width",
] as const;
const hiddenStyles = {
  "min-height": "0",
  "max-height": "none",
  height: "0",
  visibility: "hidden",
  overflow: "hidden",
  position: "absolute",
  "z-index": "-1000",
  top: "0",
  right: "0",
};
export function measureTextarea(
  node: HTMLTextAreaElement,
  minRows = 1,
  maxRows = Infinity,
) {
  const document = node.ownerDocument;
  const view = document.defaultView;
  const style = view?.getComputedStyle(node);
  if (!style || style.boxSizing === "") return undefined;
  const padding =
    parseFloat(style.paddingBottom) + parseFloat(style.paddingTop);
  const border =
    parseFloat(style.borderBottomWidth) + parseFloat(style.borderTopWidth);
  const borderBox = style.boxSizing === "border-box";
  const probe = document.createElement("textarea");
  probe.tabIndex = -1;
  probe.setAttribute("aria-hidden", "true");
  for (const key of sizingKeys) probe.style[key] = style[key];
  for (const [key, value] of Object.entries(hiddenStyles))
    probe.style.setProperty(key, value, "important");
  document.body.append(probe);
  try {
    const contentHeight = () =>
      borderBox ? probe.scrollHeight + border : probe.scrollHeight - padding;
    probe.value = node.value || node.placeholder || "x";
    const content = contentHeight();
    probe.value = "x";
    const rowHeight = contentHeight() - padding - border;
    const minimum = rowHeight * minRows + (borderBox ? padding + border : 0);
    const maximum = rowHeight * maxRows + (borderBox ? padding + border : 0);
    return Math.min(maximum, Math.max(minimum, content));
  } finally {
    probe.remove();
  }
}

function lineHeight(node: HTMLTextAreaElement) {
  const style = node.ownerDocument.defaultView!.getComputedStyle(node);
  const fallback = (parseFloat(style.fontSize) || 14) * 1.5;
  const parsed = parseFloat(style.lineHeight);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
export function wrappedLines(line: string, node: HTMLTextAreaElement) {
  if (!line) return 1;
  const style = node.ownerDocument.defaultView!.getComputedStyle(node);
  const context = node.ownerDocument.createElement("canvas").getContext("2d");
  if (!context) return 1;
  context.font = `${style.fontSize} ${style.fontFamily}`;
  const width =
    node.clientWidth -
    (parseFloat(style.paddingLeft) || 0) -
    (parseFloat(style.paddingRight) || 0);
  return width <= 0
    ? 1
    : Math.max(1, Math.ceil(context.measureText(line).width / width));
}

export function useTextareaMeasure(
  props: () => TextAreaProps,
  value: () => unknown,
  element: Ref<HTMLTextAreaElement | null>,
  panel: Ref<HTMLDivElement | null>,
) {
  const viewport = shallowRef({ width: 0, height: 0 });
  const scheduler = createDomScheduler(
    () => element.value?.ownerDocument.defaultView ?? undefined,
  );
  let active = true;
  let height = 0;
  let nativeObserved = false;
  let lastNative: { width: number; height: number } | undefined;
  let timer: number | undefined;
  let timerOwner: Window | undefined;
  let pending: (() => void) | undefined;
  let lastRun = -Infinity;
  const cancel = () => {
    if (timer !== undefined) timerOwner?.clearTimeout(timer);
    timer = undefined;
    timerOwner = undefined;
    pending = undefined;
  };
  const throttle = (callback: () => void) => {
    const now = Date.now();
    if (now - lastRun >= 10) {
      cancel();
      lastRun = now;
      callback();
      return;
    }
    pending = callback;
    if (timer !== undefined) return;
    const view = element.value?.ownerDocument.defaultView;
    if (!view) return;
    timerOwner = view;
    timer = view.setTimeout(
      () => {
        const run = pending;
        cancel();
        lastRun = Date.now();
        if (active) run?.();
      },
      10 - (now - lastRun),
    );
  };
  const measure = () => {
    const node = element.value;
    if (!active || !props().autosize || !node) return;
    const auto = props().autosize;
    const minimum =
      typeof auto === "object" && auto !== null
        ? (auto.minRows ?? props().rows)
        : props().rows;
    const maximum =
      typeof auto === "object" && auto !== null ? auto.maxRows : undefined;
    const next = measureTextarea(node, minimum, maximum);
    if (next === undefined) return;
    if (height !== next) {
      height = next;
      notifyTextarea(props().onResize, { height: next });
    }
    // A native node can be replaced when the line-number wrapper changes;
    // reapply the measured height even when the cached numerical value matches.
    if (active && element.value === node && props().autosize)
      node.style.height = `${next}px`;
  };
  const nativeResize = (next: { width: number; height: number }) => {
    if (!active || props().autosize) return;
    if (!nativeObserved) {
      nativeObserved = true;
      lastNative = next;
      return;
    }
    if (lastNative?.width === next.width && lastNative.height === next.height)
      return;
    lastNative = next;
    notifyTextarea(props().onResize, next);
  };
  const nativeEnabled = () =>
    !props().autosize && Boolean(props().resize && props().resize !== "none");
  watch(
    [element, () => props().autosize, () => props().resize],
    () => {
      cancel();
      nativeObserved = false;
      lastNative = undefined;
    },
    { flush: "sync" },
  );
  watch(
    [
      element,
      value,
      () => props().placeholder,
      () => props().autosize,
      () => props().rows,
    ],
    measure,
    { flush: "post" },
  );
  observeResize(
    () => {
      const enabled =
        props().autosize || props().showLineNumber || nativeEnabled();
      return enabled && element.value ? [element.value] : [];
    },
    (entries) => {
      const entry = entries[0]!;
      if (props().showLineNumber)
        viewport.value = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };
      if (props().autosize) throttle(measure);
      else if (nativeEnabled()) {
        const next = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };
        throttle(() => nativeResize(next));
      }
    },
  );
  watch(
    [element, () => props().showLineNumber],
    ([node, enabled]) => {
      if (node && enabled)
        viewport.value = { width: node.clientWidth, height: node.clientHeight };
    },
    { flush: "post" },
  );
  const lines = computed(() => {
    void viewport.value.width;
    const current = value();
    const textLines = current ? (current as string).split("\n") : [""];
    const node = element.value;
    const height = node ? lineHeight(node) : 21;
    return textLines.map((line, index) => ({
      index,
      number: (props().lineNumberStart as number) + index,
      height,
      minimum: height * (node ? wrappedLines(line, node) : 1),
    }));
  });
  onBeforeUnmount(() => {
    active = false;
    cancel();
    scheduler.dispose();
  });
  return {
    viewport,
    lines,
    scroll(event: Event) {
      if (!active || !props().showLineNumber || !panel.value) return;
      const target = event.target as HTMLTextAreaElement;
      scheduler.frame(() => {
        if (
          active &&
          props().showLineNumber &&
          panel.value &&
          element.value === target
        )
          panel.value.scrollTop = target.scrollTop;
      });
    },
  };
}
