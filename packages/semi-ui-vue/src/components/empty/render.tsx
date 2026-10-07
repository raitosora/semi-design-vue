import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { EmptyContent, EmptyRenderResult } from "./types.js";

export function nativeEmptyContent(value: EmptyRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return value.map(nativeEmptyContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "Empty renderers must return synchronous native content.",
    );
  }
  if (value instanceof Node || isFragment(value) || isVaporComponent(value))
    return value as Block;
  throw new TypeError("Empty renderers must return supported native content.");
}
const OwnedEmptyContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const EmptyContentView = defineVaporComponent<
  { content: EmptyContent },
  {},
  string,
  {}
>(
  (props) => {
    const branch = computed(() => {
      const content = props.content;
      return () =>
        (
          <>
            {nativeEmptyContent(
              typeof content === "function" ? content() : content,
            )}
          </>
        ) as Block;
    });
    return createComponent(OwnedEmptyContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
