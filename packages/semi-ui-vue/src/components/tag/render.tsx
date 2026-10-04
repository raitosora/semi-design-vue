import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { TagContent, TagRenderResult } from "./types.js";

export function nativeTagContent(value: TagRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return value.map(nativeTagContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "Tag renderers must return synchronous native content.",
    );
  }
  return value as Block;
}
export const OwnedTagContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const TagContentView = defineVaporComponent<
  { content: TagContent },
  {},
  string,
  {}
>(
  (props) => {
    const branch = computed(() => {
      const content = props.content;
      return () =>
        nativeTagContent(typeof content === "function" ? content() : content);
    });
    return createComponent(OwnedTagContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
