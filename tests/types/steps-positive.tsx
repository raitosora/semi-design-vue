import { ref, type ComponentInstance } from "vue";
import { Steps as Root, Step as RootStep } from "semi-ui-vue";
import Steps, {
  Steps as Named,
  type StepsProps,
  type StepProps,
  type StepsSlots,
  type StepSlots,
  type StepsContent,
  type StepsRenderResult,
  type Status,
  type Size,
  type Direction,
  type BasicStepProps,
  type FillStepProps,
  type NavStepProps,
  type BasicStepsProps,
  type FillStepsProps,
  type NavStepsProps,
  type BasicStepsAllProps,
  type FillStepsAllProps,
  type NavStepsAllProps,
} from "semi-ui-vue/steps";
import Step from "semi-ui-vue/steps/step";
const root: typeof Steps = Root;
const named: typeof Steps = Named;
const child: typeof Step = Steps.Step;
const rootChild: typeof Step = RootStep;
const status: Status = "warning";
const size: Size = "small";
const direction: Direction = "vertical";
const basic: BasicStepsAllProps = {
  type: "basic",
  size,
  direction,
  hasLine: false,
};
const fill: FillStepsAllProps = {
  type: "fill",
  current: 1,
  initial: 2,
  status,
};
const nav: NavStepsAllProps = { type: "nav", size, current: 0 };
const baseTypes: [BasicStepsProps, FillStepsProps, NavStepsProps] = [
  basic,
  fill,
  nav,
];
const leafTypes: [BasicStepProps, FillStepProps, NavStepProps] = [
  { stepNumber: "1", active: true, done: false, size },
  { stepNumber: "2", onChange: () => {} },
  { index: 1, total: 3, active: true },
];
const props: StepsProps = {
  type: "basic",
  current: 1,
  initial: 0,
  status,
  size,
  direction,
  prefixCls: "custom-steps",
  class: ["alias"],
  className: "custom",
  style: { width: "100%" },
  "aria-label": "Progress",
  "data-scope": "steps",
  onChange: (current) => {
    const value: number = current;
    void value;
  },
};
const leaf: StepProps = {
  title: () => <span>Title</span>,
  description: 0,
  icon: null,
  status: "error",
  onClick: (event) => event.preventDefault(),
  onKeyDown: (event) => {
    const key: string = event.key;
    void key;
  },
  role: "listitem",
  "aria-label": "Step",
};
const slots: StepsSlots = { default: () => <Step title="Child" /> };
const leafSlots: StepSlots = {
  title: () => <b>Title</b>,
  description: () => <input />,
  icon: () => <i />,
};
const content: StepsContent = () => [
  "literal",
  [0, false, null, undefined],
  <b />,
];
const result: StepsRenderResult = ["text", <span />];
const handle = ref<ComponentInstance<typeof Steps> | null>(null);
const stepHandle = ref<ComponentInstance<typeof Step> | null>(null);
const view = <Steps {...props} ref={handle} v-slots={slots} />;
const item = <Step {...leaf} ref={stepHandle} v-slots={leafSlots} />;
const absent: StepsProps = {
  type: undefined,
  current: undefined,
  initial: undefined,
  children: undefined,
  "v-slots": undefined,
  style: undefined,
};
void [
  root,
  named,
  child,
  rootChild,
  baseTypes,
  leafTypes,
  content,
  result,
  view,
  item,
  absent,
];
