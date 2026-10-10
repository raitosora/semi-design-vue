import { createTextNode, type ComponentInstance, type Ref } from "vue";
import { Card as RootCard, CardGroup as RootGroup } from "semi-ui-vue";
import Card, {
  Card as NamedCard,
  type CardProps,
  type MetaProps,
  type CardGroupProps,
  type CardSlots,
  type MetaSlots,
  type CardGroupSlots,
  type CardContent,
} from "semi-ui-vue/card";
import Meta, {
  type MetaProps as SubpathMetaProps,
  type MetaSlots as SubpathMetaSlots,
  type Shadows as MetaShadows,
} from "semi-ui-vue/card/meta";
import Group, {
  type CardGroupProps as SubpathGroupProps,
  type CardGroupSlots as SubpathGroupSlots,
  type CardGroupType,
} from "semi-ui-vue/card/cardGroup";
const entries: [typeof Card, typeof Card, typeof Meta, typeof Group] = [
  RootCard,
  NamedCard,
  Card.Meta,
  RootGroup,
];
const props: CardProps = {
  title: () => [createTextNode("title"), 0],
  children: false,
  loading: undefined,
  actions: [null, false, 0, () => createTextNode("action")],
  shadows: "always",
  "aria-label": "card",
  id: "card",
  onClick: (event) => void event.clientX,
};
const meta: MetaProps = {
  avatar: () => createTextNode("avatar"),
  title: "title",
  description: 0,
};
const group: CardGroupProps = {
  spacing: [8, 16],
  type: "grid",
  "data-group": true,
};
const slots: CardSlots = {
  title: () => createTextNode("title"),
  default: () => createTextNode("body"),
};
const metaSlots: MetaSlots = { avatar: () => createTextNode("avatar") };
const groupSlots: CardGroupSlots = { default: () => createTextNode("group") };
const content: CardContent = () => ["text", 0, false, null];
// @ts-expect-error No upstream size API.
const size: CardProps = { size: "small" };
// @ts-expect-error Shadows excludes the stale Meta module show alias.
const shadows: CardProps = { shadows: "show" };
// @ts-expect-error Renderers must be synchronous.
const asyncRenderer: CardProps = { header: async () => null };
// @ts-expect-error Slots require native blocks.
const scalarSlot: CardSlots = { title: () => "text" };
// @ts-expect-error Actions remain an array API, not a slot.
const actions: CardSlots = { actions: () => createTextNode("action") };
// @ts-expect-error Group only supports data attributes through Space.
const groupRole: CardGroupProps = { role: "group" };
// @ts-expect-error Unsafe HTML is excluded.
const html: MetaProps = { innerHTML: "unsafe" };
declare const instance: ComponentInstance<typeof Card>;
// @ts-expect-error No public DOM getter.
instance.getElement();
declare const wrong: Ref<{ focus(): void }>;
// @ts-expect-error No imperative ref contract.
const checked: Ref<ComponentInstance<typeof Card>> = wrong;
void [
  entries,
  props,
  meta,
  group,
  slots,
  metaSlots,
  groupSlots,
  content,
  size,
  shadows,
  asyncRenderer,
  scalarSlot,
  actions,
  groupRole,
  html,
  checked,
];

const subpathMeta: SubpathMetaProps = meta;
const subpathMetaSlots: SubpathMetaSlots = metaSlots;
const subpathGroup: SubpathGroupProps = group;
const subpathGroupSlots: SubpathGroupSlots = groupSlots;
const groupType: CardGroupType = "grid";
const legacyMetaShadows: MetaShadows = "show";
// @ts-expect-error Historical Meta alias remains distinct from actual Card shadow props.
const wrongMetaShadow: MetaShadows = "always";
void [
  subpathMeta,
  subpathMetaSlots,
  subpathGroup,
  subpathGroupSlots,
  groupType,
  legacyMetaShadows,
  wrongMetaShadow,
];
