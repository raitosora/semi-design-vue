import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
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
const named: typeof Steps = Named;
const root: typeof Steps = Root;
const step: typeof Step = Steps.Step;
const rootStep: typeof Step = RootStep;
const fill: StepsProps = {
  type: "fill",
  initial: 1,
  current: 2,
  direction: "vertical",
  status: "error",
  "aria-label": "Progress",
  "data-owner": true,
};
const basic: StepsProps = {
  type: "basic",
  size: "small",
  hasLine: false,
  direction: "horizontal",
  status: "warning",
  onChange: (current) => current.toFixed(),
};
const nav: StepsProps = {
  type: "nav",
  size: "default",
  initial: 4,
  current: 1,
};
const leaf: StepProps = {
  title: () => createTextNode("native"),
  description: 0,
  icon: undefined,
  status: "process",
  role: "button",
  "aria-label": "Step",
  onClick: (event) => event.preventDefault(),
  onKeyDown: (event) => event.key,
};
const slots: StepsSlots = { default: () => [] };
const stepSlots: StepSlots = {
  title: () => [],
  description: () => [],
  icon: () => [],
};
const content: StepsContent = () => [
  "text",
  [0, false, null, undefined],
  createTextNode("native"),
];
const result: StepsRenderResult = ["text", createTextNode("native")];
const status: Status = "finish";
const size: Size = "small";
const direction: Direction = "vertical";
const basicType: BasicStepsProps = { current: 0, hasLine: false };
const fillType: FillStepsProps = { direction: "vertical" };
const navType: NavStepsProps = { size: "small" };
const basicAll: BasicStepsAllProps = { type: "basic" };
const fillAll: FillStepsAllProps = { type: "fill" };
const navAll: NavStepsAllProps = { type: "nav" };
const basicLeaf: BasicStepProps = {
  active: true,
  done: true,
  size: "small",
  stepNumber: "2",
  onChange: () => {},
};
const fillLeaf: FillStepProps = { stepNumber: "2", onChange: () => {} };
const navLeaf: NavStepProps = {
  index: 1,
  total: 2,
  active: true,
  onChange: () => {},
};
// @ts-expect-error Nav has no direction API.
const navDirection: StepsProps = { type: "nav", direction: "vertical" };
// @ts-expect-error Nav has no status API.
const navStatus: StepsProps = { type: "nav", status: "finish" };
// @ts-expect-error Fill has no size API in the fixed union.
const fillSize: StepsProps = { type: "fill", size: "small" };
// @ts-expect-error Only basic has hasLine.
const navLine: StepsProps = { type: "nav", hasLine: true };
// @ts-expect-error No dataSource API.
const data: StepsProps = { dataSource: [] };
// @ts-expect-error No uncontrolled defaultCurrent API.
const uncontrolled: StepsProps = { defaultCurrent: 1 };
// @ts-expect-error No disabled Step API.
const disabled: StepProps = { disabled: true };
// @ts-expect-error No Step default body slot.
const body: StepSlots = { default: () => [] };
// @ts-expect-error Root slots do not accept scalar content.
const scalar: StepsSlots = { default: () => "text" };
// @ts-expect-error Raw arbitrary objects are not content.
const object: StepProps = { title: {} };
// @ts-expect-error Renderers must be synchronous.
const asyncContent: StepProps = { title: async () => [] };
const callback: StepsProps = {
  // @ts-expect-error Callback receives a number, not an event.
  onChange: (event: MouseEvent) => event.preventDefault(),
};
// @ts-expect-error No imperative root method.
void (null as unknown as ComponentInstance<typeof Steps>).getElement;
// @ts-expect-error No imperative Step method.
void (null as unknown as ComponentInstance<typeof Step>).focus;
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref requires the actual component surface.
const checked: Ref<ComponentInstance<typeof Steps>> = wrongRef;
// @ts-expect-error No Steps.Item.
void Steps.Item;
// @ts-expect-error Family entry exposes Steps, not named Step.
import { Step as Invalid } from "semi-ui-vue/steps";
// @ts-expect-error Step leaf entry is default-only.
import { Step as InvalidNamed } from "semi-ui-vue/steps/step";
const native = () => createComponent(Steps, { type: () => "basic" as const });
const interop = () => h(Steps, { type: "nav" });
void [
  named,
  root,
  step,
  rootStep,
  fill,
  basic,
  nav,
  leaf,
  slots,
  stepSlots,
  content,
  result,
  status,
  size,
  direction,
  basicType,
  fillType,
  navType,
  basicAll,
  fillAll,
  navAll,
  basicLeaf,
  fillLeaf,
  navLeaf,
  navDirection,
  navStatus,
  fillSize,
  navLine,
  data,
  uncontrolled,
  disabled,
  body,
  scalar,
  object,
  asyncContent,
  callback,
  checked,
  Invalid,
  InvalidNamed,
  native,
  interop,
];
