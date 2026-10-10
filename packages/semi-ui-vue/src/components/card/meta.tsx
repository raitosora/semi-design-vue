import { safeCardAttrs } from "./attrs.js";
import { computed, defineVaporComponent, useAttrs, useSlots } from "vue";
import { CardContentView } from "./render.js";
import type { MetaProps, MetaSlots } from "./types.js";
const Component = defineVaporComponent<MetaProps, {}, string, {}>(
  (props: MetaProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const nativeAttrs = computed(() => safeCardAttrs(attrs));
    const avatar = computed(() => Boolean(slots.avatar || props.avatar));
    const title = computed(() => Boolean(slots.title || props.title));
    const description = computed(() =>
      Boolean(slots.description || props.description),
    );
    return (
      <div
        {...nativeAttrs.value}
        class={["semi-card-meta", attrs.class, props.className]}
        style={props.style}
      >
        {avatar.value ? (
          <div class="semi-card-meta-avatar">
            {slots.avatar ? (
              <slot name="avatar" />
            ) : (
              <CardContentView content={props.avatar} />
            )}
          </div>
        ) : (
          <CardContentView content={props.avatar} />
        )}
        {title.value || description.value ? (
          <div class="semi-card-meta-wrapper">
            {title.value ? (
              <div class="semi-card-meta-wrapper-title">
                {slots.title ? (
                  <slot name="title" />
                ) : (
                  <CardContentView content={props.title} />
                )}
              </div>
            ) : (
              <CardContentView content={props.title} />
            )}
            {description.value ? (
              <div class="semi-card-meta-wrapper-description">
                {slots.description ? (
                  <slot name="description" />
                ) : (
                  <CardContentView content={props.description} />
                )}
              </div>
            ) : (
              <CardContentView content={props.description} />
            )}
          </div>
        ) : null}
      </div>
    );
  },
  {
    props: ["avatar", "className", "description", "style", "title"],
    inheritAttrs: false,
  },
);
export const Meta = Component as typeof Component & {
  new (props: MetaProps): { $props: MetaProps; $slots: MetaSlots };
};
export default Meta;

/** Historical upstream type alias; Meta has no shadows prop. */
export type Shadows = "hover" | "show";

export type { MetaProps, MetaSlots } from "./types.js";
