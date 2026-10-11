import { defineVaporComponent } from "vue";
import List, { type ListContent, type ListProps } from "semi-ui-vue/list";
export interface ListInteropBridgeProps {
  header: string;
  loading: boolean;
  main: ListContent;
  onClick: ListProps["onClick"];
}
// This application-owned native boundary keeps List's provide and Item's inject
// in one native tree. Ordinary Vue supplies only the action content slot.
export default defineVaporComponent<ListInteropBridgeProps, {}, string, {}>(
  (props: ListInteropBridgeProps) => (
    <List
      data-list-interop=""
      header={props.header}
      loading={props.loading}
      onClick={props.onClick}
    >
      {() => (
        <List.Item
          main={props.main}
          v-slots={{ extra: () => <slot name="extra" /> }}
        />
      )}
    </List>
  ),
  { props: ["header", "loading", "main", "onClick"], inheritAttrs: false },
);
