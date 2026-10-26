import { defineVaporComponent } from "vue";
import Timeline from "semi-ui-vue/timeline";
export interface TimelineInteropBridgeProps {
  label: string;
}
// Application-owned native boundary; ordinary Vue owns the input slot.
export default defineVaporComponent<TimelineInteropBridgeProps, {}, string, {}>(
  (props: TimelineInteropBridgeProps) => (
    <Timeline data-timeline-interop="" mode="alternate">
      {() => <Timeline.Item time={props.label}>{() => <slot />}</Timeline.Item>}
    </Timeline>
  ),
  { props: ["label"], inheritAttrs: false },
);
