import {
  computed,
  DynamicFragment,
  effectScope,
  onScopeDispose,
  renderEffect,
  createComponent,
  defineVaporComponent,
} from "vue";
import Text from "../typography/text.js";
import { nativeBreadcrumbContent } from "./render.js";
import { breadcrumbTooltip } from "./input.js";
import type { BreadcrumbContent, BreadcrumbProps } from "./types.js";
const InlineTitle = defineVaporComponent(
  () => (
    <span class="semi-breadcrumb-item-title semi-breadcrumb-item-title-inline">
      <slot />
    </span>
  ),
  { inheritAttrs: false },
);
const OwnedTitle = defineVaporComponent(() => <slot />, {
  inheritAttrs: false,
});
const StringTitle = defineVaporComponent<
  {
    text: string;
    compact: boolean;
    tooltip: ReturnType<typeof breadcrumbTooltip>;
  },
  {},
  string,
  {}
>(
  (props) => (
    <span class="semi-breadcrumb-item-title">
      <Text
        children={props.text}
        ellipsis={{
          showTooltip: props.tooltip.opts
            ? { opts: props.tooltip.opts }
            : false,
          pos: props.tooltip.ellipsisPos,
        }}
        size={props.compact ? "small" : "normal"}
        style={{
          maxWidth:
            typeof props.tooltip.width === "number"
              ? `${props.tooltip.width}px`
              : props.tooltip.width,
        }}
      />
    </span>
  ),
  { props: ["text", "compact", "tooltip"], inheritAttrs: false },
);
/** Classify an already-owned renderer result; never execute caller slots to probe them. */
export const BreadcrumbTitleView = defineVaporComponent<
  {
    content: BreadcrumbContent;
    compact: boolean;
    showTooltip: BreadcrumbProps["showTooltip"];
  },
  {},
  string,
  {}
>(
  (props) => {
    const tooltip = computed(() => breadcrumbTooltip(props.showTooltip));
    const value = computed(() => props.content);
    const branch = computed(() => {
      const content = value.value;
      return () => {
        const fragment = new DynamicFragment();
        renderEffect(() => {
          // The detached render scope is immediately handed to the native branch.
          // It is never reused after replacement or cached as mounted content.
          const owned = effectScope(true);
          try {
            const block = owned.run(() => {
              const result =
                typeof content === "function" ? content() : content;
              if (!result) return [];
              return typeof result === "string"
                ? createComponent(StringTitle, {
                    text: () => result,
                    compact: () => props.compact,
                    tooltip: () => tooltip.value,
                  })
                : createComponent(InlineTitle, null, {
                    default: () => nativeBreadcrumbContent(result),
                  });
            })!;
            // Native branch replacement disposes its former owner outside tracking.
            fragment.update(() => {
              onScopeDispose(() => owned.stop());
              return block;
            }, {});
          } catch (error) {
            // Failed caller cleanup must also run outside the rendering effect.
            // This empty, unmounted branch owns no persistent scope or DOM.
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
      };
    });
    return createComponent(OwnedTitle, null, {
      $: [() => ({ name: "default", fn: branch.value })],
    });
  },
  { props: ["content", "compact", "showTooltip"], inheritAttrs: false },
);
