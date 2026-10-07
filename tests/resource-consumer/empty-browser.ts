import { createTextNode, h, type ComponentInstance, type Ref } from "vue";
import { Empty as RootEmpty } from "semi-ui-vue";
import Empty, {
  Empty as NamedEmpty,
  type EmptyProps,
  type EmptySlots,
  type EmptyContent,
  type EmptyRenderResult,
  type EmptyImage,
} from "semi-ui-vue/empty";
const identity: typeof Empty = RootEmpty;
const named: typeof Empty = NamedEmpty;
const props: EmptyProps = {
  layout: undefined,
  title: () => [createTextNode("native"), "title", 0],
  description: false,
  children: () => createTextNode("action"),
  image: { id: "symbol", viewBox: "0 0 100 100", url: "/symbol.svg" },
  darkModeImage: () => createTextNode("dark"),
  imageStyle: { width: "100px" },
  style: { color: "red" },
  "data-consumer": true,
};
const slots: EmptySlots = {
  default: () => createTextNode("action"),
  image: () => createTextNode("image"),
  darkModeImage: () => createTextNode("dark"),
  title: () => createTextNode("title"),
  description: () => createTextNode("description"),
};
const content: EmptyContent = () => [
  createTextNode("native"),
  "text",
  0,
  false,
];
const result: EmptyRenderResult = [null, undefined, "text", 0, false];
const image: EmptyImage = { id: "symbol" };
// Vue RC9 includes VNode in VaporRenderResult; this is not native runtime VNode support.
const frameworkVNodeType: EmptyContent = () => h("b");
// @ts-expect-error No invented size API.
const size: EmptyProps = { size: "small" };
// @ts-expect-error Only data attributes pass through the root.
const role: EmptyProps = { role: "status" };
// @ts-expect-error No invented click event API.
const event: EmptyProps = { onClick: () => undefined };
// @ts-expect-error Layout is the fixed upstream union.
const layout: EmptyProps = { layout: "row" };
// @ts-expect-error Renderers must be synchronous.
const asyncContent: EmptyProps = { title: async () => null };
// @ts-expect-error Arbitrary objects are not renderable.
const object: EmptyProps = { description: () => ({ value: 1 }) };
// @ts-expect-error No invented footer slot.
const footer: EmptySlots = { footer: () => createTextNode("footer") };
// @ts-expect-error Slots return owned native blocks.
const scalarSlot: EmptySlots = { title: () => "raw" };
// @ts-expect-error Slots must be synchronous.
const asyncSlot: EmptySlots = { image: async () => null };
// @ts-expect-error No unsafe HTML input.
const html: EmptyProps = { innerHTML: "unsafe" };
declare const instance: ComponentInstance<typeof Empty>;
// @ts-expect-error No public Empty ref method.
instance.getElement();
declare const wrongRef: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref does not expose invented methods.
const checked: Ref<ComponentInstance<typeof Empty>> = wrongRef;
void [
  identity,
  named,
  props,
  slots,
  content,
  result,
  image,
  frameworkVNodeType,
  size,
  role,
  event,
  layout,
  asyncContent,
  object,
  footer,
  scalarSlot,
  asyncSlot,
  html,
  checked,
];
