import {
  createComponent,
  createTextNode,
  h,
  type ComponentInstance,
  type Ref,
} from "vue";
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
import Step, {
  type StepProps as DirectProps,
  type StepSlots as DirectSlots,
} from "semi-ui-vue/steps/step";
const named: typeof Steps = Named;
const child: typeof Step = Steps.Step;
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
  "data-owner": "steps",
  onChange: (current) => {
    const value: number = current;
    void value;
  },
};
const leaf: StepProps = {
  title: () => createTextNode("Title"),
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
const slots: StepsSlots = { default: () => [] };
const itemSlots: StepSlots = {
  title: () => createTextNode("Title"),
  description: () => [],
  icon: () => [],
};
const direct: DirectProps = leaf;
const directSlots: DirectSlots = itemSlots;
const content: StepsContent = () => ["literal", [0, false, null, undefined]];
const result: StepsRenderResult = ["text", createTextNode("native")];
const absent: StepsProps = {
  type: undefined,
  current: undefined,
  initial: undefined,
  children: undefined,
  "v-slots": undefined,
  style: undefined,
};
// @ts-expect-error Fixed type union.
const type: StepsProps = { type: "line" };
// @ts-expect-error Nav has no vertical direction.
const badNav: StepsProps = { type: "nav", direction: "vertical" };
// @ts-expect-error Fill does not declare size.
const badFill: StepsProps = { type: "fill", size: "small" };
// @ts-expect-error No uncontrolled API.
const initial: StepsProps = { defaultCurrent: 1 };
// @ts-expect-error Fixed status union.
const badStatus: StepProps = { status: "success" };
// @ts-expect-error Callback receives a number.
const change: StepsProps = { onChange: (_event: MouseEvent) => {} };
// @ts-expect-error Native event, not an index.
const click: StepProps = { onClick: (_index: number) => {} };
// @ts-expect-error No disabled protocol.
const disabled: StepProps = { disabled: true };
// @ts-expect-error No unsafe HTML.
const html: StepProps = { innerHTML: "unsafe" };
// @ts-expect-error No arbitrary object content.
const object: StepProps = { title: {} };
// @ts-expect-error Renderer is synchronous.
const asyncRenderer: StepProps = { title: async () => [] };
// @ts-expect-error Native slots do not return scalar strings.
const scalar: StepsSlots = { default: () => "text" };
// @ts-expect-error Native slots do not return scalar arrays.
const array: StepSlots = { title: () => ["text", 0] };
// @ts-expect-error No Step default body slot.
const body: StepSlots = { default: () => [] };
// @ts-expect-error Native slots stay synchronous.
const asyncSlot: StepSlots = { icon: async () => [] };
// @ts-expect-error No family named child export.
import { Step as FamilyStep } from "semi-ui-vue/steps";
// @ts-expect-error Child entry is default-only.
import { Step as NamedStep } from "semi-ui-vue/steps/step";
// @ts-expect-error No public DOM handle.
void (null as unknown as ComponentInstance<typeof Steps>).getElement;
// @ts-expect-error No imperative focus method.
void (null as unknown as ComponentInstance<typeof Step>).focus;
declare const wrong: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref cannot assume methods absent from the component.
const wrongRef: Ref<ComponentInstance<typeof Steps>> = wrong;
const native = () => createComponent(Steps, { current: () => 1 });
const interop = () => h(Steps, { current: 1 });
void [
  named,
  child,
  baseTypes,
  leafTypes,
  props,
  slots,
  direct,
  directSlots,
  content,
  result,
  absent,
  type,
  badNav,
  badFill,
  initial,
  badStatus,
  change,
  click,
  disabled,
  html,
  object,
  asyncRenderer,
  scalar,
  array,
  body,
  asyncSlot,
  FamilyStep,
  NamedStep,
  wrongRef,
  native,
  interop,
];
