import {
  computed,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  provide,
  ref,
  shallowRef,
  useAttrs,
  useSlots,
} from "vue";
import { timelineContextKey, timelineDataIndexKey } from "./context.js";
import { TimelineContentView } from "./render.js";
import { timelinePosition } from "./position.js";
import type { TimelineItemProps, TimelineItemSlots } from "./types.js";
const Component = defineVaporComponent<TimelineItemProps, {}, string, {}>(
  (props: TimelineItemProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const context = inject(timelineContextKey, undefined);
    const sourceIndex = inject(timelineDataIndexKey, undefined);
    // A data index belongs only to this Item, never to nested content Items.
    provide(timelineDataIndexKey, undefined);
    const element = ref<HTMLLIElement | null>(null);
    const index = shallowRef(-1);
    if (context) onBeforeUnmount(context.register({ element, index }));
    const position = computed(() =>
      context && index.value >= 0
        ? timelinePosition(
            context.mode.value,
            props.position,
            sourceIndex?.value ?? index.value,
          )
        : "",
    );
    const type = computed(() =>
      props.type === undefined ? "default" : props.type,
    );
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    return (
      <li
        {...dataAttrs.value}
        class={[
          "semi-timeline-item",
          attrs.class,
          props.className,
          position.value,
        ]}
        onClick={(event) => {
          if (props.onClick) props.onClick(event as unknown as MouseEvent);
        }}
        ref={element}
        style={props.style}
      >
        <div aria-hidden="true" class="semi-timeline-item-tail" />
        <div
          aria-hidden="true"
          class={[
            "semi-timeline-item-head",
            (slots.dot || props.dot) && "semi-timeline-item-head-custom",
            type.value && `semi-timeline-item-head-${type.value}`,
          ]}
          style={props.color ? { backgroundColor: props.color } : undefined}
        >
          {slots.dot ? (
            <slot name="dot" />
          ) : (
            <TimelineContentView content={props.dot} />
          )}
        </div>
        <div class="semi-timeline-item-content">
          {slots.default ? (
            <slot />
          ) : (
            <TimelineContentView content={props.children} />
          )}
          {slots.extra || props.extra ? (
            <div class="semi-timeline-item-content-extra">
              {slots.extra ? (
                <slot name="extra" />
              ) : (
                <TimelineContentView content={props.extra} />
              )}
            </div>
          ) : (
            <TimelineContentView content={props.extra} />
          )}
          {slots.time || props.time ? (
            <div class="semi-timeline-item-content-time">
              {slots.time ? (
                <slot name="time" />
              ) : (
                <TimelineContentView content={props.time} />
              )}
            </div>
          ) : (
            <TimelineContentView content={props.time} />
          )}
        </div>
      </li>
    );
  },
  {
    props: [
      "className",
      "style",
      "color",
      "children",
      "dot",
      "extra",
      "time",
      "type",
      "position",
      "onClick",
    ],
    inheritAttrs: false,
  },
);
export default Component as typeof Component & {
  new (props: TimelineItemProps): {
    $props: TimelineItemProps;
    $slots: TimelineItemSlots;
  };
};
export type { TimelineItemProps, TimelineItemSlots } from "./types.js";
