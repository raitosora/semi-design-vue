import {
  computed,
  createComponent,
  createFor,
  defineVaporComponent,
  type ShallowRef,
} from "vue";
import { ListContentView } from "./render.js";
import type { ListProps } from "./types.js";
interface Entry {
  readonly item: unknown;
  readonly index: number;
}
/** Preserve Array.map holes as errors, as fixed upstream child.key access does. */
export function listEntries(
  props: Pick<ListProps, "dataSource" | "renderItem">,
): Entry[] {
  if (!props.dataSource?.length || !props.renderItem) return [];
  const mapped = props.dataSource.map((item, index) => ({ item, index }));
  return Array.from(mapped, (entry) => {
    if (!entry)
      throw new TypeError(
        "List dataSource with renderItem must not contain sparse holes.",
      );
    return entry;
  });
}
const DataItem = defineVaporComponent<
  { entry: Entry; renderer: NonNullable<ListProps["renderItem"]> },
  {},
  string,
  {}
>(
  (props) => {
    const content = computed(() => {
      const { item, index } = props.entry;
      const renderer = props.renderer;
      return () => renderer(item, index);
    });
    return <ListContentView content={content.value} item />;
  },
  { props: ["entry", "renderer"], inheritAttrs: false },
);
export const ListData = defineVaporComponent<
  Pick<ListProps, "dataSource" | "renderItem">,
  {},
  string,
  {}
>(
  (props) => {
    const entries = computed(() => listEntries(props));
    return createFor(
      () => entries.value,
      (entry: ShallowRef<Entry>) =>
        createComponent(DataItem, {
          entry: () => entry.value,
          renderer: () => props.renderItem!,
        }),
      (entry) => entry.index,
    );
  },
  { props: ["dataSource", "renderItem"], inheritAttrs: false },
);
