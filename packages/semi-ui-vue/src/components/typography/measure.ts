import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Ref } from "vue";
import {
  createDomScheduler,
  createFoundationScope,
  observeResize,
} from "semi-animation-vue/lifecycle";
import type { Ellipsis } from "./types.js";
interface MeasureSource {
  readonly text: string | undefined;
  readonly options: Ellipsis;
  readonly enabled: boolean;
  readonly css: boolean;
  readonly expanded: boolean;
  readonly strong: boolean;
}
const px = (value: string) => Number.parseFloat(value) || 0;
/** Measures only the declared string, never user renderers or cloned live DOM. */
function truncate(
  root: HTMLElement,
  text: string,
  contentElement: HTMLElement | null,
  options: Ellipsis,
  operation: HTMLElement | null,
  strong: boolean,
): string {
  if (text.length === 0) return "";
  const document = root.ownerDocument;
  const computed = document.defaultView!.getComputedStyle(root);
  const box = root.getBoundingClientRect();
  const width =
    box.width -
    px(computed.paddingLeft) -
    px(computed.paddingRight) -
    px(computed.borderLeftWidth) -
    px(computed.borderRightWidth);
  if (width <= 0) return text;
  const shadow = document.createElement("div");
  const suffix = options.suffix!;
  // Keep the fixed upstream suffix access after its empty-content shortcut.
  const suffixText = suffix.length ? suffix : "";
  for (const key of Array.from(computed))
    shadow.style.setProperty(key, computed.getPropertyValue(key));
  Object.assign(shadow.style, {
    position: "fixed",
    left: "-999999px",
    top: "0",
    width: `${width}px`,
    // The live border box already resolved these constraints in its own parent.
    // Reapplying them to this body-owned content box changes the available width.
    minWidth: "0",
    maxWidth: "none",
    height: "auto",
    minHeight: "0",
    maxHeight: "none",
    boxSizing: "content-box",
    padding: "0",
    border: "0",
    display: "block",
    visibility: "hidden",
    whiteSpace: "normal",
    textOverflow: "clip",
    webkitLineClamp: "none",
    overflow: "visible",
  });
  if (strong) shadow.style.fontWeight = "600";
  shadow.setAttribute("aria-hidden", "true");
  const textNode = document.createTextNode("");
  const extra = document.createElement("span");
  extra.style.display = "inline-block";
  const copyWidth = operation
    ? operation.getBoundingClientRect().width +
      px(document.defaultView!.getComputedStyle(operation).marginLeft) +
      px(document.defaultView!.getComputedStyle(operation).marginRight)
    : 0;
  extra.style.width = `${copyWidth}px`;
  const textHolder = document.createElement("span");
  textHolder.append(textNode);
  let decorated: HTMLElement = textHolder;
  let origin = contentElement?.parentElement;
  while (origin && origin !== root) {
    const wrapper = document.createElement(origin.tagName.toLowerCase());
    const style = document.defaultView!.getComputedStyle(origin);
    for (const key of Array.from(style))
      wrapper.style.setProperty(key, style.getPropertyValue(key));
    wrapper.append(decorated);
    decorated = wrapper;
    origin = origin.parentElement;
  }
  const icon = root.querySelector<HTMLElement>(".semi-typography-icon");
  if (icon) {
    const placeholder = document.createElement("span");
    const iconStyle = document.defaultView!.getComputedStyle(icon);
    placeholder.style.display = "inline-block";
    placeholder.style.width = `${icon.getBoundingClientRect().width + px(iconStyle.marginLeft) + px(iconStyle.marginRight)}px`;
    // The prefix remains in the same decoration box as the text.
    textHolder.prepend(placeholder);
  }
  shadow.append(decorated, extra);
  document.body.append(shadow);
  try {
    textNode.textContent = "M";
    const line =
      px(computed.lineHeight) ||
      shadow.getBoundingClientRect().height ||
      px(computed.fontSize) * 1.2;
    const maxHeight = Math.round(line * ((options.rows ?? 1) + 1));
    const fits = (value: string) => {
      textNode.textContent = value + suffixText;
      return shadow.scrollWidth <= width + 1 && shadow.scrollHeight < maxHeight;
    };
    if (fits(text)) return text;
    if (options.expandText !== undefined) {
      // Only the component-owned expand label is recreated; operation renderers are never executed here.
      const label = document.createElement("a");
      label.className = "semi-typography-ellipsis-expand";
      label.textContent = options.expandText;
      shadow.append(label);
    }
    const candidate = (length: number) =>
      options.pos === "end"
        ? `${text.slice(0, length)}...`
        : `${text.slice(0, length)}...${length ? text.slice(-length) : ""}`;
    let low = 0;
    let high =
      options.pos === "middle" ? Math.floor(text.length / 2) : text.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (fits(candidate(middle))) low = middle;
      else high = middle - 1;
    }
    return candidate(low);
  } finally {
    shadow.remove();
  }
}
export function useTypographyMeasure(
  root: Ref<HTMLElement | null>,
  contentElement: Ref<HTMLElement | null>,
  operation: Ref<HTMLElement | null>,
  source: () => MeasureSource,
) {
  const text = ref<string | undefined>();
  const overflow = ref(false);
  const scope = createFoundationScope();
  const scheduler = createDomScheduler(
    () => root.value?.ownerDocument.defaultView ?? undefined,
  );
  let cancel: (() => void) | undefined;
  const measure = () => {
    cancel = undefined;
    if (!scope.active) return;
    const element = root.value;
    const value = source();
    if (
      !element ||
      !value.enabled ||
      value.text === undefined ||
      !value.options.rows ||
      (value.css ? value.options.rows < 1 : value.options.rows < 0)
    ) {
      text.value = value.text;
      overflow.value = false;
      return;
    }
    if (value.expanded) return;
    if (value.css) {
      const computed =
        element.ownerDocument.defaultView!.getComputedStyle(element);
      const width = Math.max(
        0,
        element.getBoundingClientRect().width -
          px(computed.paddingLeft) -
          px(computed.paddingRight) -
          px(computed.borderLeftWidth) -
          px(computed.borderRightWidth),
      );
      const range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      overflow.value =
        value.options.rows === 1
          ? range.getBoundingClientRect().width > width
          : element.scrollHeight > element.offsetHeight;
      range.detach();
      text.value = value.text;
    } else {
      const result = truncate(
        element,
        value.text,
        contentElement.value,
        value.options,
        operation.value,
        value.strong,
      );
      text.value = result;
      overflow.value = result !== value.text;
    }
  };
  const schedule = () => {
    if (!scope.active) return;
    if (!source().enabled) {
      cancel?.();
      cancel = undefined;
      text.value = source().text;
      overflow.value = false;
      return;
    }
    if (!cancel) cancel = scheduler.frame(measure);
  };
  scope.own(
    observeResize(
      () =>
        source().enabled
          ? [
              root.value,
              root.value?.parentElement,
              operation.value,
              contentElement.value,
            ].filter((value): value is HTMLElement => !!value)
          : [],
      schedule,
    ),
  );
  watch([root, contentElement, operation, source], schedule, {
    flush: "post",
    deep: true,
  });
  const mounted = ref(false);
  let generation = 0;
  onMounted(() => {
    mounted.value = true;
  });
  watch(
    [root, () => source().enabled, mounted],
    ([element, enabled, ready], _previous, cleanup) => {
      const current = ++generation;
      cancel?.();
      cancel = undefined;
      if (!element || !enabled || !ready) return;
      schedule();
      const document = element.ownerDocument;
      const fonts = document.fonts;
      const Observer = document.defaultView?.MutationObserver;
      const mutations = Observer ? new Observer(schedule) : undefined;
      if (fonts) {
        fonts.addEventListener("loadingdone", schedule);
        fonts.addEventListener("loadingerror", schedule);
        void fonts.ready.then(() => {
          if (scope.active && current === generation) schedule();
        });
      }
      if (mutations) {
        let ancestor: Element | null = element;
        while (ancestor) {
          mutations.observe(ancestor, {
            attributes: true,
            attributeFilter: ["class", "style", "hidden", "dir"],
          });
          ancestor = ancestor.parentElement;
        }
        // Component-owned decorations and arbitrary icon descendants can change metrics
        // without resizing the fixed-width root. Observe their real DOM, never render twice.
        mutations.observe(element, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
          attributeFilter: ["class", "style", "hidden", "dir"],
        });
      }
      cleanup(() => {
        generation++;
        cancel?.();
        cancel = undefined;
        fonts?.removeEventListener("loadingdone", schedule);
        fonts?.removeEventListener("loadingerror", schedule);
        mutations?.disconnect();
      });
    },
    { flush: "post" },
  );
  onBeforeUnmount(() => {
    cancel?.();
    scheduler.dispose();
    scope.dispose();
  });
  return { text, overflow, schedule };
}
