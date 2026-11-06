import { createComponent, h, ref, type ComponentInstance } from "vue";
import Input, {
  type InputProps,
  type InputSlots,
  type InputContent,
  type InputGroupProps as FamilyGroup,
  type TextAreaProps as FamilyArea,
} from "semi-ui-vue/input";
import TextArea, { type TextAreaProps } from "semi-ui-vue/input/textarea";
import InputGroup, {
  type InputGroupProps,
  type InputSize as GroupSize,
} from "semi-ui-vue/input/inputGroup";
const element = ref<HTMLInputElement | null>(null);
const textarea = ref<HTMLTextAreaElement | null>(null);
const props: InputProps = {
  value: 0,
  defaultValue: "initial",
  mode: "password",
  size: "small",
  showClear: true,
  hideSuffix: true,
  prefix: "Prefix",
  suffix: "Suffix",
  insetLabel: "Label",
  insetLabelId: "label-id",
  borderless: false,
  validateStatus: "success",
  inputStyle: { color: "red" },
  composition: true,
  forwardRef: element,
  onChange: (value, event) => {
    value.toUpperCase();
    event.preventDefault();
  },
  "onUpdate:value": (value) => {
    value.toUpperCase();
  },
  onEnterPress: (event) => {
    event.key.toUpperCase();
  },
};
const areaProps: TextAreaProps = {
  value: "text",
  autosize: { minRows: 1, maxRows: 5 },
  resize: "inline",
  maxCount: 100,
  showCounter: true,
  showLineNumber: true,
  lineNumberStart: 0,
  forwardRef: textarea,
  onResize: ({ height, width }) => {
    height.toFixed();
    width?.toFixed();
  },
};
const groupProps: InputGroupProps = {
  size: "large",
  disabled: false,
  labelPosition: "left",
  label: { text: "Label", name: "group", required: true, optional: true },
};
// @ts-expect-error Fixed value type excludes boolean.
const badValue: InputProps = { value: false };
// @ts-expect-error TextArea only accepts a string value.
const badArea: TextAreaProps = { value: 0 };
// @ts-expect-error Fixed password mode.
const badMode: InputProps = { mode: "search" };
// @ts-expect-error No modelValue alias.
const badModel: InputProps = { modelValue: "text" };
// @ts-expect-error No unsafe HTML.
const unsafe: InputProps = { innerHTML: "text" };
// @ts-expect-error Incorrect native DOM ref.
const badRef: InputProps = { forwardRef: textarea };
// @ts-expect-error No Input.Group static.
void Input.Group;
// @ts-expect-error No Input.TextArea static.
void Input.TextArea;
// @ts-expect-error Component ref is not a native input.
void (null as unknown as ComponentInstance<typeof Input>).setSelectionRange;
// @ts-expect-error No fabricated imperative focus method.
void (null as unknown as ComponentInstance<typeof TextArea>).focus;
// @ts-expect-error No public Form placeholder.
import { Form } from "semi-ui-vue";
// @ts-expect-error No premature InputNumber.
import { InputNumber } from "semi-ui-vue";
const familyGroup: FamilyGroup = groupProps;
const familyArea: FamilyArea = areaProps;
const content: InputContent = () => ["text", [0, null, false]];
const slots: InputSlots = { prefix: () => [] };
// @ts-expect-error Scalar slot is not native content.
const scalarSlot: InputSlots = { prefix: () => "text" };
// @ts-expect-error Async slot not supported.
const asyncSlot: InputSlots = { suffix: async () => [] };
// @ts-expect-error No default Input body slot.
const bodySlot: InputSlots = { default: () => [] };
void [familyGroup, familyArea, content, slots, scalarSlot, asyncSlot, bodySlot];
const native = () => createComponent(Input, { value: () => "text" });
const interop = () => h(TextArea, { value: "text" });
void [
  props,
  areaProps,
  groupProps,
  badValue,
  badArea,
  badMode,
  badModel,
  unsafe,
  badRef,
  Form,
  InputNumber,
  native,
  interop,
];

const groupSize: GroupSize = "large";
void groupSize;
