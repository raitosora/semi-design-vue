import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { TypographyContent, TypographyRenderResult } from "./types.js";
export function nativeTypographyContent(value: TypographyRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return value.map(nativeTypographyContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "Typography renderers must return synchronous native content.",
    );
  }
  if (value instanceof Node || isFragment(value) || isVaporComponent(value))
    return value as Block;
  throw new TypeError(
    "Typography renderers must return supported native content.",
  );
}
const OwnedTypographyContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const TypographyContentView = defineVaporComponent<
  { content: TypographyContent },
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
            {nativeTypographyContent(
              typeof content === "function" ? content() : content,
            )}
          </>
        ) as Block;
    });
    return createComponent(OwnedTypographyContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
