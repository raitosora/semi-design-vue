import type { ComponentInstance, Ref } from "vue";
import Empty, { type EmptyProps, type EmptySlots } from "semi-ui-vue/empty";
// @ts-expect-error Layout has only the two upstream values.
const layout: EmptyProps = { layout: "diagonal" };
// @ts-expect-error No native root id forwarding.
const id: EmptyProps = { id: "root" };
// @ts-expect-error Empty does not forward native events.
const click: EmptyProps = { onClick: () => undefined };
// @ts-expect-error No extra role protocol.
const role: EmptyProps = { role: "status" };
// @ts-expect-error No automatic live region.
const live: EmptyProps = { "aria-live": "polite" };
// @ts-expect-error No unsafe HTML input.
const html: EmptyProps = { innerHTML: "<b>bad</b>" };
// @ts-expect-error No public DOM forwarding prop.
const forward: EmptyProps = { forwardRef: () => undefined };
// @ts-expect-error No theme prop.
const theme: EmptyProps = { theme: "dark" };
// @ts-expect-error Arbitrary content objects are not renderers.
const object: EmptyProps = { title: { text: "title" } };
// @ts-expect-error Renderers must return synchronously.
const asyncRenderer: EmptyProps = { description: async () => null };
// @ts-expect-error Image factories must be synchronous.
const asyncImage: EmptyProps = { image: async () => null };
// @ts-expect-error Native slots cannot return scalar strings.
const rawSlot: EmptySlots = { default: () => "text" };
// @ts-expect-error Native slots cannot return scalar arrays.
const arraySlot: EmptySlots = { image: () => ["text", 0] };
// @ts-expect-error Native slots cannot return promises.
const asyncSlot: EmptySlots = { title: async () => null };
// @ts-expect-error Footer is represented by the default slot, not another API.
const extra: EmptySlots = { footer: () => <button /> };
// @ts-expect-error Explicit JSX slots retain native result typing.
const rawInline = <Empty v-slots={{ title: () => "text" }} />;
// @ts-expect-error Data attributes have scalar values.
const data: EmptyProps = { "data-invalid": {} };
declare const instance: ComponentInstance<typeof Empty>;
// @ts-expect-error No fabricated DOM or React class methods.
instance.focus();
// @ts-expect-error React implementation methods are not exposed.
instance.updateMode();
declare const wrong: Ref<{ focus(): void }>;
// @ts-expect-error Ref instance has no imperative focus surface.
const checked: Ref<ComponentInstance<typeof Empty>> = wrong;
void [
  layout,
  id,
  click,
  role,
  live,
  html,
  forward,
  theme,
  object,
  asyncRenderer,
  asyncImage,
  rawSlot,
  arraySlot,
  asyncSlot,
  extra,
  rawInline,
  data,
  checked,
];
