import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { BadgeContent, BadgeRenderResult } from "./types.js";
export function nativeBadgeContent(value: BadgeRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return value.map(nativeBadgeContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "Badge renderers must return synchronous native content.",
    );
  }
  if (value instanceof Node || isFragment(value) || isVaporComponent(value))
    return value as Block;
  throw new TypeError("Badge renderers must return supported native content.");
}
const OwnedBadgeContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const BadgeContentView = defineVaporComponent<
  { content: BadgeContent },
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
            {nativeBadgeContent(
              typeof content === "function" ? content() : content,
            )}
          </>
        ) as Block;
    });
    return createComponent(OwnedBadgeContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
