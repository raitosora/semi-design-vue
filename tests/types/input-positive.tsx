import { ref } from "vue";
import Input, {
  type InputProps,
  type InputSlots,
  type InputContent,
  type TextAreaProps as FamilyAreaProps,
  type InputGroupProps as FamilyGroupProps,
} from "semi-ui-vue/input";
import TextArea, { type TextAreaProps } from "semi-ui-vue/input/textarea";
import InputGroup, {
  type InputGroupProps,
  type InputSize as GroupSize,
} from "semi-ui-vue/input/inputGroup";

const value = ref("text");
const input = ref<HTMLInputElement | null>(null);
const textarea = ref<HTMLTextAreaElement | null>(null);
const inputProps: InputProps = {
  value: 0,
  defaultValue: "initial",
  mode: "password",
  size: "small",
  validateStatus: "success",
  composition: true,
  readonly: true,
  "aria-label": "Native input",
  onChange: (next, event) => {
    next.toUpperCase();
    event.preventDefault();
  },
  "onUpdate:value": (next) => {
    value.value = next;
  },
  forwardRef: input,
};
const textareaProps: TextAreaProps = {
  autosize: { minRows: 2, maxRows: 8 },
  rows: 4,
  cols: 20,
  resize: "block",
  showLineNumber: true,
  lineNumberStart: 0,
  showCounter: true,
  maxCount: 10,
  forwardRef: textarea,
  onResize: (size) => {
    size.height.toFixed();
  },
};
const groupProps: InputGroupProps = {
  size: "large",
  disabled: false,
  labelPosition: "left",
  label: { text: "Group", name: "group", required: true, optional: true },
};
const groupSize: GroupSize = "large";
void groupSize;
const familyArea: FamilyAreaProps = textareaProps;
const familyGroup: FamilyGroupProps = groupProps;
const slots: InputSlots = {
  prefix: () => <span>Prefix</span>,
  suffix: () => <></>,
};
const content: InputContent = () => ["native text", 0, false, null];
void [familyArea, familyGroup, slots, content];
export const InputTypeFixture = () => (
  <InputGroup {...groupProps}>
    {() => (
      <>
        <Input {...inputProps} v-model:value={value.value} />
        <Input prefix={() => <span>Content</span>}>
          {{ suffix: () => <span>Suffix</span> }}
        </Input>
        <TextArea {...textareaProps} v-model:value={value.value} />
      </>
    )}
  </InputGroup>
);
input.value?.setSelectionRange(0, 1);
textarea.value?.select();
