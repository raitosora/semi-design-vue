import {
  computed,
  createComponent,
  createFor,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  shallowRef,
  watch,
  type ShallowRef,
} from "vue";
import { isPlainObject } from "es-toolkit/compat";
import Item from "./item.js";
import { groupColumns } from "./group.js";
import { descriptionsContextKey } from "./context.js";
import type { Data, DescriptionsItemProps } from "./types.js";
interface DataEntry {
  readonly value: Data;
  readonly index: number;
}
export function dataEntries(
  data: Data[] | undefined,
  horizontal = false,
  column = 3,
): DataEntry[] {
  if (!data?.length) return [];
  const entries = data
    .map((value, index) => {
      if (horizontal && value == null)
        throw new TypeError(
          "Descriptions horizontal data entries cannot be null or undefined.",
        );
      return { value, index };
    })
    .filter((entry) => horizontal || isPlainObject(entry.value));
  if (horizontal)
    groupColumns(
      entries.map(({ value }) => ({
        source: value,
        span: value.span,
        hidden: value.hidden,
        fillable: typeof value === "object" || typeof value === "function",
      })),
      column,
    );
  return entries;
}
const Placeholder = defineVaporComponent<{ value: Data }, {}, string, {}>(
  (props) => {
    const context = inject(descriptionsContextKey)!;
    const anchor = document.createElement("template");
    const release = context.register({
      anchor: () => anchor,
      start: () => null,
      end: () => null,
      props: () => props.value,
      fillable: () =>
        typeof props.value === "object" || typeof props.value === "function",
      target: shallowRef(null),
      span: shallowRef(undefined),
    });
    onBeforeUnmount(release);
    watch(() => [props.value.hidden, props.value.span], context.refresh, {
      flush: "post",
    });
    return anchor;
  },
  { props: ["value"], inheritAttrs: false },
);
const DataItem = defineVaporComponent<{ entry: DataEntry }, {}, string, {}>(
  (props) => (
    <>
      {isPlainObject(props.entry.value) ? (
        <Item
          itemKey={props.entry.value.key}
          {...(props.entry.value as DescriptionsItemProps)}
          children={props.entry.value.value}
        />
      ) : (
        <Placeholder value={props.entry.value} />
      )}
    </>
  ),
  { props: ["entry"], inheritAttrs: false },
);
export const DescriptionsData = defineVaporComponent<
  { data: Data[] | undefined; horizontal: boolean; column: number },
  {},
  string,
  {}
>(
  (props) => {
    const entries = computed(() =>
      dataEntries(props.data, props.horizontal, props.column),
    );
    return createFor(
      () => entries.value,
      (entry: ShallowRef<DataEntry>) =>
        createComponent(DataItem, { entry: () => entry.value }),
      (entry) => entry.index,
    );
  },
  { props: ["data", "horizontal", "column"], inheritAttrs: false },
);
