import {
  computed,
  defineVaporComponent,
  provide,
  ref,
  useAttrs,
  useSlots,
} from "vue";
import { timelineContextKey, timelineDataIndexKey } from "./context.js";
import { createTimelineOrder } from "./layout.js";
import { TimelineData } from "./data.js";
import { TimelineContentView } from "./render.js";
import Item from "./item.js";
import type { TimelineProps, TimelineSlots } from "./types.js";
const Component = defineVaporComponent<TimelineProps, {}, string, {}>(
  (props: TimelineProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const root = ref<HTMLUListElement | null>(null);
    const mode = computed(() =>
      props.mode === undefined ? "left" : props.mode,
    );
    provide(timelineContextKey, { mode, ...createTimelineOrder(root) });
    provide(timelineDataIndexKey, undefined);
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
      ),
    );
    return (
      <ul
        {...dataAttrs.value}
        aria-label={attrs["aria-label"] as string | undefined}
        class={[
          "semi-timeline",
          attrs.class,
          props.className,
          mode.value && `semi-timeline-${mode.value}`,
        ]}
        ref={root}
        style={props.style}
      >
        {props.dataSource?.length ? (
          <TimelineData dataSource={props.dataSource} />
        ) : slots.default ? (
          <slot />
        ) : (
          <TimelineContentView content={props.children} />
        )}
      </ul>
    );
  },
  {
    props: ["mode", "className", "style", "dataSource", "children"],
    inheritAttrs: false,
  },
);
export const Timeline = Object.assign(Component, {
  Item,
}) as typeof Component & {
  new (props: TimelineProps): { $props: TimelineProps; $slots: TimelineSlots };
  Item: typeof Item;
};
export default Timeline;
