import {
  createComponent,
  createTextNode,
  ref,
  type ComponentInstance,
} from "vue";
import { Timeline as Root } from "semi-ui-vue";
import Timeline, {
  Timeline as Named,
  type TimelineProps,
  type TimelineItemProps,
  type TimelineSlots,
  type TimelineItemSlots,
  type Data,
  type TimelineContent,
  type TimelineRenderResult,
} from "semi-ui-vue/timeline";
import Item from "semi-ui-vue/timeline/item";
const root: typeof Timeline = Root;
const named: typeof Timeline = Named;
const item: typeof Item = Timeline.Item;
const instance = ref<ComponentInstance<typeof Timeline> | null>(null);
const itemRef = ref<ComponentInstance<typeof Item> | null>(null);
const data: Data[] = [
  {
    content: () => <b>Value</b>,
    time: 0,
    type: "ongoing",
    color: "blue",
    dot: () => <i />,
    extra: "Extra",
    position: "right",
  },
];
const props: TimelineProps = {
  dataSource: data,
  mode: "alternate",
  class: ["alias"],
  className: "custom",
  style: { width: "100%" },
  "aria-label": "Timeline",
  "data-owner": "timeline",
};
const slots: TimelineSlots = {
  default: () => <Item ref={itemRef}>{() => <input />}</Item>,
};
const itemSlots: TimelineItemSlots = {
  default: () => <button>value</button>,
  time: () => <time>Today</time>,
  extra: () => <small>Extra</small>,
  dot: () => <i />,
};
const leaf: TimelineItemProps = {
  color: "#123456",
  type: "warning",
  time: 0,
  position: "left",
  onClick: (event) => event.preventDefault(),
};
const content: TimelineContent = () => ["literal", [0, false, null, undefined]];
const result: TimelineRenderResult = ["text", createTextNode("native")];
const view = <Timeline {...props} ref={instance} v-slots={slots} />;
const child = <Item {...leaf} v-slots={itemSlots} />;
const removed: TimelineProps = {
  dataSource: undefined,
  mode: undefined,
  style: undefined,
  className: undefined,
  children: undefined,
  "v-slots": undefined,
};
const native = () =>
  createComponent(Timeline, {
    dataSource: () => [{ content: () => createTextNode("value") }],
  });
void [root, named, item, view, child, removed, native, content, result];
