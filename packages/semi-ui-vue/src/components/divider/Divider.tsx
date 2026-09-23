import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
} from "vue";
import type { DividerProps, DividerSlots } from "./types.js";

type ContentKind = "empty" | "text" | "nodes";

/** Classify mounted DOM without evaluating a slot or moving its owned nodes. */
function contentKind(element: HTMLElement | null): ContentKind {
  let text = false;
  for (const node of element?.childNodes ?? []) {
    if (node.nodeType === 1) return "nodes";
    if (node.nodeType === 3 && node.textContent !== "") text = true;
  }
  return text ? "text" : "empty";
}

const DividerComponent = defineVaporComponent<DividerProps, {}, string, {}>(
  (props: DividerProps) => {
    const attrs = useAttrs();
    const root = ref<HTMLDivElement | null>(null);
    const content = ref<HTMLSpanElement | null>(null);
    const kind = ref<ContentKind>("empty");
    const layout = computed(() =>
      props.layout === undefined ? "horizontal" : props.layout,
    );
    const align = computed(() =>
      props.align === undefined ? "center" : props.align,
    );
    const withText = computed(
      () => layout.value === "horizontal" && kind.value !== "empty",
    );
    const marginStyle = computed(() => {
      const value = props.margin;
      if (value === undefined) return {};
      const margin = typeof value === "number" ? `${value}px` : value;
      if (layout.value === "vertical")
        return { marginLeft: margin, marginRight: margin };
      if (layout.value === "horizontal")
        return { marginTop: margin, marginBottom: margin };
      return {};
    });
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([name]) => name !== "innerHTML" && name !== "textContent",
        ),
      ),
    );
    let disposed = false;
    let observer: MutationObserver | undefined;
    const refresh = () => {
      if (!disposed) kind.value = contentKind(content.value);
    };
    onMounted(() => {
      refresh();
      const element = root.value!;
      const Observer = element.ownerDocument.defaultView?.MutationObserver;
      if (!Observer) return;
      observer = new Observer(refresh);
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    onBeforeUnmount(() => {
      disposed = true;
      observer?.disconnect();
    });
    return (
      <div
        {...nativeAttrs.value}
        class={[
          "semi-divider",
          layout.value === "horizontal" && "semi-divider-horizontal",
          layout.value === "vertical" && "semi-divider-vertical",
          props.dashed && "semi-divider-dashed",
          withText.value && "semi-divider-with-text",
          withText.value && `semi-divider-with-text-${align.value}`,
          attrs.class,
          props.className,
        ]}
        ref={root}
        style={[marginStyle.value, props.style]}
      >
        {layout.value === "horizontal" ? (
          <span
            class={
              kind.value === "text" ? "semi-divider_inner-text" : undefined
            }
            ref={content}
            style={kind.value === "text" ? undefined : { display: "contents" }}
            x-semi-prop={kind.value === "text" ? "children" : undefined}
          >
            <slot />
          </span>
        ) : null}
      </div>
    );
  },
  {
    props: [
      "align",
      "margin",
      "className",
      "dashed",
      "layout",
      "style",
      "children",
    ],
    inheritAttrs: false,
  },
);

type DividerComponentType = typeof DividerComponent & {
  new (props: DividerProps): { $props: DividerProps; $slots: DividerSlots };
};
export const Divider = DividerComponent as DividerComponentType;
export default Divider;
