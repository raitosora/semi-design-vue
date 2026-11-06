import { h, createComponent, type ComponentInstance, type Ref } from "vue";
import {
  Input as RootInput,
  TextArea as RootTextArea,
  InputGroup as RootInputGroup,
} from "semi-ui-vue";
import Input, {
  Input as NamedInput,
  type InputProps,
  type InputSlots,
} from "semi-ui-vue/input";
import TextArea, { type TextAreaProps } from "semi-ui-vue/input/textarea";
import InputGroup, {
  type InputGroupProps,
  type InputGroupSlots,
} from "semi-ui-vue/input/inputGroup";
const input: typeof Input = RootInput;
const named: typeof Input = NamedInput;
const area: typeof TextArea = RootTextArea;
const group: typeof InputGroup = RootInputGroup;
const nativeInput: Ref<HTMLInputElement | null> =
  {} as Ref<HTMLInputElement | null>;
const nativeArea: Ref<HTMLTextAreaElement | null> =
  {} as Ref<HTMLTextAreaElement | null>;
const props: InputProps = {
  value: 0,
  defaultValue: "initial",
  composition: true,
  forwardRef: nativeInput,
  onChange(value, event) {
    const text: string = value;
    const native: Event = event;
    void [text, native];
  },
  "onUpdate:value": (value) => value.toString(),
  "aria-label": "Input",
};
const textProps: TextAreaProps = {
  value: "text",
  autosize: { minRows: 2, maxRows: 6 },
  showLineNumber: true,
  lineNumberStart: 3,
  showCounter: true,
  maxCount: 10,
  resize: "vertical",
  forwardRef: nativeArea,
  "onUpdate:value": (value) => value.toUpperCase(),
};
const groupProps: InputGroupProps = {
  size: "large",
  disabled: true,
  label: { text: "Name", name: "person", optional: true, required: true },
};
const inputSlots: InputSlots = {
  prefix: () => document.createTextNode("prefix"),
};
const groupSlots: InputGroupSlots = {
  default: () => document.createElement("input"),
};
// @ts-expect-error Input has no default body slot.
const wrongInputSlot: InputSlots = { default: () => [] };
// @ts-expect-error Native slots cannot return raw strings.
const wrongPrefixSlot: InputSlots = { prefix: () => "text" };
// @ts-expect-error Content renderers must be synchronous.
const wrongRenderer: InputProps = { suffix: async () => [] };
// @ts-expect-error Arbitrary objects are not native renderer content.
const wrongContent: InputProps = { prefix: {} };
// @ts-expect-error TextArea has no public slots.
const wrongAreaSlot: TextAreaProps = { "v-slots": { default: () => [] } };
// @ts-expect-error Group default slot must return native blocks.
const wrongGroupSlot: InputGroupSlots = { default: () => "text" };
void [
  inputSlots,
  groupSlots,
  wrongInputSlot,
  wrongPrefixSlot,
  wrongRenderer,
  wrongContent,
  wrongAreaSlot,
  wrongGroupSlot,
];
// @ts-expect-error No Input.Group static API.
void Input.Group;
// @ts-expect-error No Input.TextArea static API.
void Input.TextArea;
// @ts-expect-error Native node access is forwardRef, not component methods.
void (null as unknown as ComponentInstance<typeof Input>).focus;
// @ts-expect-error Native textarea access is forwardRef, not component methods.
void (null as unknown as ComponentInstance<typeof TextArea>).setSelectionRange;
// @ts-expect-error Input model retains value, not modelValue.
const wrongModel: InputProps = { modelValue: "text" };
// @ts-expect-error TextArea's public value is string.
const wrongAreaValue: TextAreaProps = { value: 1 };
// @ts-expect-error TextArea has no public size API.
const wrongAreaSize: TextAreaProps = { size: "large" };
// @ts-expect-error Input native ref is not a textarea ref.
const wrongRef: InputProps = { forwardRef: nativeArea };
// @ts-expect-error InputGroup is not a runtime family export.
import { InputGroup as InvalidFamilyGroup } from "semi-ui-vue/input";
// @ts-expect-error TextArea is not a runtime family export.
import { TextArea as InvalidFamilyArea } from "semi-ui-vue/input";
// @ts-expect-error Internal Label is not public.
import { Label } from "semi-ui-vue";
// @ts-expect-error Form is outside this delivery.
import { Form } from "semi-ui-vue";
// @ts-expect-error InputNumber is outside this delivery.
import { InputNumber } from "semi-ui-vue";
const native = () => createComponent(Input, { value: () => "native" });
const interop = () => h(Input, { value: "interop" });
void [
  input,
  named,
  area,
  group,
  props,
  textProps,
  groupProps,
  wrongModel,
  wrongAreaValue,
  wrongAreaSize,
  wrongRef,
  InvalidFamilyGroup,
  InvalidFamilyArea,
  Label,
  Form,
  InputNumber,
  native,
  interop,
];
