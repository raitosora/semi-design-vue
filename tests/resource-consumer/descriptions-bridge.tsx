import { defineVaporComponent } from "vue";
import Descriptions from "semi-ui-vue/descriptions";
export interface DescriptionsInteropBridgeProps {
  label: string;
}
// The application-owned native boundary preserves the parent/Item context.
// Its value slot is authored by the ordinary Vue host, not a pure Vapor app.
export default defineVaporComponent<
  DescriptionsInteropBridgeProps,
  {},
  string,
  {}
>(
  (props: DescriptionsInteropBridgeProps) => (
    <Descriptions data-descriptions-interop="">
      {() => (
        <Descriptions.Item itemKey={props.label}>
          {() => <slot />}
        </Descriptions.Item>
      )}
    </Descriptions>
  ),
  { props: ["label"], inheritAttrs: false },
);
