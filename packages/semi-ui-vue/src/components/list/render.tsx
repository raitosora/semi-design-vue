import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { ListContent, ListRenderResult } from "./types.js";

/** Data renderItem requires native elements; ordinary content also accepts scalars. */
export function nativeListContent(
  value: ListRenderResult,
  item = false,
): Block {
  if (Array.isArray(value))
    return Array.from(value, (child) => nativeListContent(child, item));
  if (value instanceof Node || isFragment(value) || isVaporComponent(value))
    return value as Block;
  if (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "List renderers must return synchronous native content.",
    );
  }
  if (!item) {
    if (value == null || typeof value === "boolean") return [];
    if (typeof value === "string" || typeof value === "number")
      return createTextNode(String(value));
  }
  throw new TypeError(
    item
      ? "List renderItem must return native elements or dense arrays of elements."
      : "List renderers must return supported native content.",
  );
}
const OwnedContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const ListContentView = defineVaporComponent<
  { content: ListContent; item?: boolean },
  {},
  string,
  {}
>(
  (props) => {
    const branch = computed(() => {
      const content = props.content;
      const item = props.item;
      return () =>
        (
          <>
            {nativeListContent(
              typeof content === "function" ? content() : content,
              item,
            )}
          </>
        ) as Block;
    });
    return createComponent(OwnedContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content", "item"], inheritAttrs: false },
);
