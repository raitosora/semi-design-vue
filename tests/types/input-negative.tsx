import { ref, type ComponentInstance } from "vue";
import Input, { type InputProps, type InputSlots } from "semi-ui-vue/input";
import TextArea, { type TextAreaProps } from "semi-ui-vue/input/textarea";
import InputGroup, { type InputGroupProps } from "semi-ui-vue/input/inputGroup";

// @ts-expect-error Input does not own a Group static component.
void Input.Group;
// @ts-expect-error Input does not own a TextArea static component.
void Input.TextArea;
// @ts-expect-error Keep the named value model, not modelValue.
const model: InputProps = { modelValue: "bad" };
// @ts-expect-error Fixed upstream value type.
const bool: InputProps = { value: false };
// @ts-expect-error Fixed upstream mode.
const mode: InputProps = { mode: "search" };
// @ts-expect-error Callback receives a string first.
const event: InputProps = { onChange: (_event: Event) => {} };
const wrongRef: InputProps = {
  // @ts-expect-error Native input ref cannot be a textarea ref.
  forwardRef: ref<HTMLTextAreaElement | null>(null),
};
// @ts-expect-error An async callback is not native content.
const asyncContent: InputProps = { prefix: async () => [] };
// @ts-expect-error Arbitrary object is not renderer content.
const object: InputProps = { suffix: {} };
// @ts-expect-error Native slots must return native content, not a scalar string.
const scalarSlot: InputSlots = { prefix: () => "text" };
// @ts-expect-error Native slots must be synchronous.
const asyncSlot: InputSlots = { suffix: async () => [] };
// @ts-expect-error Input has no default content slot.
const defaultSlot: InputSlots = { default: () => [] };
// @ts-expect-error No arbitrary unsafe HTML.
const html: InputProps = { innerHTML: "unsafe" };
// @ts-expect-error Invalid autosize shape.
const autosize: TextAreaProps = { autosize: { minRows: "2" } };
// @ts-expect-error Invalid resize direction.
const resize: TextAreaProps = { resize: "diagonal" };
// @ts-expect-error TextArea has no password mode.
const password: TextAreaProps = { mode: "password" };
// @ts-expect-error InputGroup is not a value control.
const groupValue: InputGroupProps = { value: "text" };
// @ts-expect-error Fixed size union.
const position: InputGroupProps = { size: "huge" };
// @ts-expect-error The component ref is not a fabricated native input element.
void (null as unknown as ComponentInstance<typeof Input>).setSelectionRange;
// @ts-expect-error The component ref does not add a focus handle.
void (null as unknown as ComponentInstance<typeof TextArea>).focus;
// @ts-expect-error Group has no imperative focus method.
void (null as unknown as ComponentInstance<typeof InputGroup>).focus;
void [
  scalarSlot,
  asyncSlot,
  defaultSlot,
  model,
  bool,
  mode,
  event,
  wrongRef,
  asyncContent,
  object,
  html,
  autosize,
  resize,
  password,
  groupValue,
  position,
];
