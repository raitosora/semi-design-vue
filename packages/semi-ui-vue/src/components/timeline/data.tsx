import {
  computed,
  createComponent,
  createFor,
  defineVaporComponent,
  provide,
  type ShallowRef,
} from "vue";
import Item from "./item.js";
import { timelineDataIndexKey } from "./context.js";
import type { Data, TimelineProps } from "./types.js";
interface Entry {
  readonly item: Data;
  readonly index: number;
  readonly key: unknown;
}
export function timelineEntries(data: TimelineProps["dataSource"]): Entry[] {
  if (!data?.length) return [];
  // Array.map deliberately preserves holes; filter removes them after indexing.
  return data
    .map((item, index) => {
      const content = item.content;
      const key = (item as Data & { key?: unknown }).key;
      return {
        item: { ...item, content },
        index,
        key: key === undefined ? `timeline-item-${index}` : key,
      };
    })
    .filter(() => true);
}
const DataItem = defineVaporComponent<{ entry: Entry }, {}, string, {}>(
  (props) => {
    provide(
      timelineDataIndexKey,
      computed(() => props.entry.index),
    );
    return <Item {...props.entry.item} children={props.entry.item.content} />;
  },
  { props: ["entry"], inheritAttrs: false },
);
export const TimelineData = defineVaporComponent<
  Pick<TimelineProps, "dataSource">,
  {},
  string,
  {}
>(
  (props) => {
    const entries = computed(() => timelineEntries(props.dataSource));
    return createFor(
      () => entries.value,
      (entry: ShallowRef<Entry>) =>
        createComponent(DataItem, { entry: () => entry.value }),
      (entry) => entry.key,
    );
  },
  { props: ["dataSource"], inheritAttrs: false },
);
