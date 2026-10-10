import type { Shadows as MetaShadows } from "semi-ui-vue/card/meta";
import type { ComponentInstance, Ref } from "vue";
import Card, {
  type CardProps,
  type CardSlots,
  type MetaProps,
  type MetaSlots,
  type CardGroupProps,
  type CardGroupSlots,
} from "semi-ui-vue/card";
// @ts-expect-error No card size prop exists upstream.
const size: CardProps = { size: "small" };
// @ts-expect-error No selected behavior exists upstream.
const selected: CardProps = { selected: true };
// @ts-expect-error Shadows follow the Card source union.
const shadow: CardProps = { shadows: "show" };
// @ts-expect-error Actions require an array.
const actions: CardProps = { actions: () => null };
// @ts-expect-error Arbitrary objects are not content.
const object: CardProps = { title: { text: "title" } };
// @ts-expect-error Renderers must return synchronously.
const asyncRenderer: CardProps = { cover: async () => null };
// @ts-expect-error Native slots cannot return scalar strings.
const scalarSlot: CardSlots = { default: () => "text" };
// @ts-expect-error Native slots cannot return promises.
const asyncSlot: CardSlots = { footer: async () => null };
// @ts-expect-error No actions slot: use actions content array.
const actionsSlot: CardSlots = { actions: () => <button /> };
// @ts-expect-error Explicit JSX slots retain native result typing.
const inline = <Card v-slots={{ title: () => "text" }} />;
// @ts-expect-error Unsafe HTML is unavailable.
const html: CardProps = { innerHTML: "unsafe" };
// @ts-expect-error Group supports grid only.
const groupType: CardGroupProps = { type: "list" };
// @ts-expect-error Group spacing is number or number array.
const spacing: CardGroupProps = { spacing: "loose" };
// @ts-expect-error Space collaboration retains data-only group attributes.
const groupId: CardGroupProps = { id: "group" };
// @ts-expect-error No group title slot.
const groupSlot: CardGroupSlots = { title: () => <span /> };
// @ts-expect-error Meta content excludes arbitrary objects.
const meta: MetaProps = { avatar: {} };
// @ts-expect-error Meta has no default body slot.
const metaSlot: MetaSlots = { default: () => <span /> };
// @ts-expect-error Meta slots must return owned native blocks.
const metaScalar: MetaSlots = { description: () => ["text", 0] };
// @ts-expect-error Card.Group is not a static upstream API.
Card.Group;
declare const instance: ComponentInstance<typeof Card>;
// @ts-expect-error React implementation methods are not a public Vapor ref surface.
instance.renderHeader();
// @ts-expect-error No invented DOM handle.
instance.getElement();
declare const wrong: Ref<{ focus(): void }>;
// @ts-expect-error No public imperative focus ref contract.
const checked: Ref<ComponentInstance<typeof Card>> = wrong;
void [
  size,
  selected,
  shadow,
  actions,
  object,
  asyncRenderer,
  scalarSlot,
  asyncSlot,
  actionsSlot,
  inline,
  html,
  groupType,
  spacing,
  groupId,
  groupSlot,
  meta,
  metaSlot,
  metaScalar,
  checked,
];

// @ts-expect-error Historical Meta type alias differs from actual Card shadows.
const legacyMetaShadow: MetaShadows = "always";
void legacyMetaShadow;
