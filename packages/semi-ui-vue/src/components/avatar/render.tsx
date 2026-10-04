import {
  computed,
  createComponent,
  createTextNode,
  defineVaporComponent,
} from "vue";
import type { Block } from "vue";
import type { AvatarContent, AvatarRenderResult } from "./types.js";

export function nativeAvatarContent(value: AvatarRenderResult): Block {
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  if (Array.isArray(value)) return value.map(nativeAvatarContent);
  if (
    typeof value === "object" &&
    "then" in value &&
    typeof value.then === "function"
  ) {
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError(
      "Avatar renderers must return synchronous native content.",
    );
  }
  return value as Block;
}
export const OwnedAvatarContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const AvatarContentView = defineVaporComponent<
  { content: AvatarContent },
  {},
  string,
  {}
>(
  (props) => {
    const branch = computed(() => {
      const content = props.content;
      return () =>
        nativeAvatarContent(
          typeof content === "function" ? content() : content,
        );
    });
    return createComponent(OwnedAvatarContent, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content"], inheritAttrs: false },
);
