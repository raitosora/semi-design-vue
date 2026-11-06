import type { ComponentInstance, Ref } from "vue";
import Steps, {
  type StepsProps,
  type StepProps,
  type StepsSlots,
  type StepSlots,
} from "semi-ui-vue/steps";
import Step from "semi-ui-vue/steps/step";
// @ts-expect-error Fixed type union.
const type: StepsProps = { type: "line" };
// @ts-expect-error Nav has no vertical direction.
const nav: StepsProps = { type: "nav", direction: "vertical" };
// @ts-expect-error Fill does not declare size.
const fill: StepsProps = { type: "fill", size: "small" };
// @ts-expect-error No uncontrolled current API.
const initial: StepsProps = { defaultCurrent: 1 };
// @ts-expect-error Fixed statuses.
const status: StepProps = { status: "success" };
// @ts-expect-error Callback receives a number, not an event.
const change: StepsProps = { onChange: (_event: MouseEvent) => {} };
// @ts-expect-error Step click receives a native event only.
const click: StepProps = { onClick: (_index: number) => {} };
// @ts-expect-error No invented disabled protocol.
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
// @ts-expect-error Step has no default body slot.
const body: StepSlots = { default: () => <b /> };
// @ts-expect-error Native slots stay synchronous.
const asyncSlot: StepSlots = { icon: async () => [] };
// @ts-expect-error No family named child export.
import { Step as FamilyStep } from "semi-ui-vue/steps";
// @ts-expect-error Child entry is default-only.
import { Step as NamedStep } from "semi-ui-vue/steps/step";
declare const instance: ComponentInstance<typeof Steps>;
// @ts-expect-error No public DOM handle.
instance.getElement();
declare const child: ComponentInstance<typeof Step>;
// @ts-expect-error No imperative focus method.
child.focus();
declare const wrong: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref cannot assume methods absent from the component.
const wrongRef: Ref<ComponentInstance<typeof Steps>> = wrong;
// @ts-expect-error Inline slots remain strict.
const inline = <Step v-slots={{ title: () => "raw" }} />;
void [
  type,
  nav,
  fill,
  initial,
  status,
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
  inline,
];
