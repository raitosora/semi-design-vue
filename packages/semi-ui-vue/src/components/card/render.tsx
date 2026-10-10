import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { CardContent, CardRenderResult } from "./types.js";

export function nativeCardContent(value: CardRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return Array.from(value, nativeCardContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "Card renderers must return synchronous native content.",
    );
  }
  if (value instanceof Node || isFragment(value) || isVaporComponent(value))
    return value as Block;
  throw new TypeError("Card renderers must return supported native content.");
}
const OwnedCardContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const CardContentView = defineVaporComponent<
  { content: CardContent },
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
            {nativeCardContent(
              typeof content === "function" ? content() : content,
            )}
          </>
        ) as Block;
    });
    return createComponent(OwnedCardContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
