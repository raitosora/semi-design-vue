import {
  createComponent,
  createSlot,
  createTextNode,
  defineVaporComponent,
  effectScope,
  insert,
} from "vue";
import type { Block } from "vue";
import type { OverflowRenderResult, OverflowItem } from "./types.js";

/** Normalize only primitives; native blocks stay within their owning slot branch. */
export function nativeOverflowContent(value: OverflowRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return value.map(nativeOverflowContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "OverflowList renderers must return synchronous native content.",
    );
  }
  return value as Block;
}

export interface OverflowItemViewProps {
  item: OverflowItem;
  index: number;
  hidden: boolean;
  scroll: boolean;
  scrollkey: string;
  bind: (element: HTMLDivElement | null) => void;
}
export const OverflowItemView = defineVaporComponent<
  OverflowItemViewProps,
  {},
  string,
  {}
>(
  (props) => (
    <div
      aria-hidden={props.hidden ? "true" : undefined}
      class="semi-overflow-list-item"
      data-scrollkey={props.scroll ? props.scrollkey : undefined}
      inert={props.hidden}
      ref={props.bind}
      style={
        props.hidden
          ? {
              position: "absolute",
              visibility: "hidden",
              pointerEvents: "none",
              width: "max-content",
              flex: "none",
            }
          : { flex: "none" }
      }
    >
      <slot />
    </div>
  ),
  {
    props: ["item", "index", "hidden", "scroll", "scrollkey", "bind"],
    inheritAttrs: false,
  },
);
const ScrollPart = defineVaporComponent<
  { order: number; side: string },
  {},
  string,
  {}
>(
  (props) => (
    <div
      class={`semi-overflow-list-overflow-${props.side}`}
      style={{ flex: "none", order: props.order }}
    >
      <slot />
    </div>
  ),
  { props: ["order", "side"], inheritAttrs: false },
);
export interface ScrollOverflowProps {
  content: () => OverflowRenderResult;
  direction: "both" | "start" | "end";
  ownerDocument: Document;
}
export const ScrollOverflow = defineVaporComponent<
  ScrollOverflowProps,
  {},
  string,
  {
    start: (scope: { content: () => Block }) => Block;
    end: (scope: { content: () => Block }) => Block;
  }
>(
  (props) =>
    createComponent(OwnedOverflowContent, null, {
      $: [
        () => {
          const content = props.content;
          return {
            name: "default",
            fn: () => {
              const pairScope = effectScope();
              let parts: HTMLDivElement[] | undefined;
              const part = (index: number) => {
                // Both native side outlets may be supplied. Invoke the raw
                // callback only when an outlet actually needs its fallback,
                // once within this owned branch for both sides.
                if (!parts) {
                  // Both callback parts share this scope. Replacing one side
                  // outlet must not dispose its sibling's reactive content.
                  parts = pairScope.run(() => {
                    const result = content();
                    const values = result == null ? [null, null] : result;
                    if (!Array.isArray(values) || values.length !== 2)
                      throw new TypeError(
                        "OverflowList scroll overflowRenderer must return two native content parts.",
                      );
                    return values.map((value) => {
                      const carrier = props.ownerDocument.createElement("div");
                      carrier.style.display = "contents";
                      insert(nativeOverflowContent(value), carrier);
                      return carrier;
                    });
                  });
                }
                // Removing a native carrier from one outlet leaves the shared
                // pair owner alive. Returning the outlet reinserts live content.
                return parts?.[index] ?? [];
              };
              return [
                createComponent(
                  ScrollPart,
                  {
                    side: () => "start",
                    order: () => (props.direction === "end" ? 2 : 0),
                  },
                  {
                    default: () =>
                      createSlot(
                        "start",
                        {
                          content: () => () => part(0),
                        },
                        () => part(0),
                      ),
                  },
                ),
                createComponent(
                  ScrollPart,
                  {
                    side: () => "end",
                    order: () =>
                      props.direction === "both" || props.direction === "end"
                        ? 2
                        : 0,
                  },
                  {
                    default: () =>
                      createSlot(
                        "end",
                        {
                          content: () => () => part(1),
                        },
                        () => part(1),
                      ),
                  },
                ),
              ];
            },
          };
        },
      ],
    }),
  { props: ["content", "direction", "ownerDocument"], inheritAttrs: false },
);

export const OwnedOverflowContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
