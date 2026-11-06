import { defineVaporComponent } from "vue";
import Input from "semi-ui-vue/input";
import TextArea from "semi-ui-vue/input/textarea";
import InputGroup from "semi-ui-vue/input/inputGroup";
export interface InputInteropBridgeProps {
  label: string;
  disabled: boolean;
}
export default defineVaporComponent<InputInteropBridgeProps, {}, string, {}>(
  (props: InputInteropBridgeProps) => (
    <InputGroup disabled={props.disabled} size="small">
      {() => (
        <>
          <Input id="input-interop-native" value={props.label}>
            {{ prefix: () => <slot /> }}
          </Input>
          <TextArea id="input-interop-area" showCounter value={props.label} />
        </>
      )}
    </InputGroup>
  ),
  { props: ["label", "disabled"], inheritAttrs: false },
);
