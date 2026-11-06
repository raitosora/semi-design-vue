import {
  createComponent,
  defineVaporComponent,
  DynamicFragment,
  effectScope,
  isFragment,
  isVaporComponent,
  onScopeDispose,
  renderEffect,
} from "vue";
import { nativeStepsContent } from "./render.js";
import type { StepsContent } from "./types.js";
interface IconProps {
  readonly content: StepsContent;
  readonly basic: boolean;
  readonly prefix: string;
  readonly hover: boolean;
}
const Container = defineVaporComponent<
  Omit<IconProps, "content">,
  {},
  string,
  {}
>(
  (props) => (
    <>
      {props.basic ? (
        <span class={[`${props.prefix}-icon`, `${props.prefix}-custom-icon`]}>
          <slot />
        </span>
      ) : (
        <div
          class={[
            `${props.prefix}-left`,
            `${props.prefix}-icon`,
            props.hover && `${props.prefix}-hover`,
          ]}
        >
          <slot />
        </div>
      )}
    </>
  ),
  { props: ["basic", "prefix", "hover"], inheritAttrs: false },
);
const Owned = defineVaporComponent(() => <slot />, { inheritAttrs: false });
/** Classify a renderer result inside its single native owner, never probe a slot. */
export const StepsCustomIcon = defineVaporComponent<IconProps, {}, string, {}>(
  (props) => {
    return createComponent(Owned, null, {
      default: () => {
        const fragment = new DynamicFragment();
        renderEffect(() => {
          const scope = effectScope(true);
          try {
            let rejected = false;
            const block = scope.run(() => {
              const render = props.content;
              const result = typeof render === "function" ? render() : render;
              if (!result) return [];
              if (
                typeof result === "object" &&
                "then" in result &&
                typeof result.then === "function"
              )
                nativeStepsContent(result);
              if (
                props.basic &&
                !(
                  result instanceof Element ||
                  isFragment(result) ||
                  isVaporComponent(result)
                )
              ) {
                rejected = true;
                return [];
              }
              return createComponent(
                Container,
                {
                  basic: () => props.basic,
                  prefix: () => props.prefix,
                  hover: () => props.hover,
                },
                { default: () => nativeStepsContent(result) },
              );
            })!;
            fragment.update(() => {
              if (rejected) scope.stop();
              else onScopeDispose(() => scope.stop());
              return block;
            }, {});
          } catch (error) {
            new DynamicFragment().update(
              () => {
                scope.stop();
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
  { props: ["content", "basic", "prefix", "hover"], inheritAttrs: false },
);
