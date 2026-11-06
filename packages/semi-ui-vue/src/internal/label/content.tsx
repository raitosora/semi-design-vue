import {
  createComponent,
  createTextNode,
  defineVaporComponent,
  isFragment,
  isVaporComponent,
  DynamicFragment,
  effectScope,
  renderEffect,
  onScopeDispose,
} from "vue";
import type { Block } from "vue";
import type { LabelContent, LabelRenderResult } from "./types.js";

export function nativeLabelContent(value: LabelRenderResult): Block {
  if (Array.isArray(value)) return Array.from(value, nativeLabelContent);
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
      "Label and InputGroup renderers must return synchronous native content.",
    );
  }
  if (value == null || typeof value === "boolean") return [];
  if (typeof value === "string" || typeof value === "number")
    return createTextNode(String(value));
  throw new TypeError(
    "Label and InputGroup renderers must return supported native content.",
  );
}
const OwnedContent = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
export const LabelContentView = defineVaporComponent<
  { content: LabelContent },
  {},
  string,
  {}
>(
  (props) => {
    return createComponent(OwnedContent, null, {
      default: () => {
        const fragment = new DynamicFragment();
        renderEffect(() => {
          const owned = effectScope(true);
          try {
            const content = props.content;
            const block = owned.run(() =>
              nativeLabelContent(
                typeof content === "function" ? content() : content,
              ),
            )!;
            fragment.update(() => {
              onScopeDispose(() => owned.stop());
              return block;
            }, {});
          } catch (error) {
            new DynamicFragment().update(
              () => {
                owned.stop();
                return [];
              },
              undefined,
              true,
            );
            throw error;
          }
        });
        return fragment;
      },
    });
  },
  { props: ["content"], inheritAttrs: false },
);
