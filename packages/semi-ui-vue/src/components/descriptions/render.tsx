import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { DescriptionsContent, DescriptionsRenderResult } from "./types.js";

/** Own renderer scopes and retain native content without VNode inspection. */
export function nativeDescriptionsContent(
  value: DescriptionsRenderResult,
): Block {
  if (Array.isArray(value))
    return Array.from(value, (child) => nativeDescriptionsContent(child));
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
      "Descriptions renderers must return synchronous native content.",
    );
  }
  {
    if (value == null || typeof value === "boolean") return [];
    if (typeof value === "string" || typeof value === "number")
      return createTextNode(String(value));
  }
  throw new TypeError(
    "Descriptions renderers must return supported native content.",
  );
}
const OwnedContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const DescriptionsContentView = defineVaporComponent<
  { content: DescriptionsContent },
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
            {nativeDescriptionsContent(
              typeof content === "function" ? content() : content,
            )}
          </>
        ) as Block;
    });
    return createComponent(OwnedContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
