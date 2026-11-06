import { defineVaporComponent } from "vue";
import Steps from "semi-ui-vue/steps";
export interface StepsInteropBridgeProps {
  label: string;
  current: number;
}
export default defineVaporComponent<StepsInteropBridgeProps, {}, string, {}>(
  (props: StepsInteropBridgeProps) => (
    <Steps current={props.current} data-steps-interop="" type="basic">
      {() => (
        <>
          <Steps.Step description={props.label}>
            {{ title: () => <slot /> }}
          </Steps.Step>
          <Steps.Step title="Next" />
        </>
      )}
    </Steps>
  ),
  { props: ["label", "current"], inheritAttrs: false },
);
