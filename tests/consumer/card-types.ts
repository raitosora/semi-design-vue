import DefaultCard, {
  Card,
  type CardProps,
  type CardSlots,
  type CardContent,
  type CardRenderResult,
  type CardGroupProps,
  type CardGroupSlots,
  type CardGroupType,
  type MetaProps,
  type MetaSlots,
  type Shadows,
} from "semi-ui-vue/card";
import DefaultGroup, {
  CardGroup,
  type CardGroupProps as DirectGroupProps,
  type CardGroupSlots as DirectGroupSlots,
  type CardGroupType as DirectGroupType,
} from "semi-ui-vue/card/cardGroup";
import DefaultMeta, {
  Meta,
  type MetaProps as DirectMetaProps,
  type MetaSlots as DirectMetaSlots,
} from "semi-ui-vue/card/meta";
import { createTextNode } from "vue";

const cardIdentity: typeof Card = DefaultCard;
const groupIdentity: typeof CardGroup = DefaultGroup;
const metaIdentity: typeof Meta = DefaultMeta;
const staticIdentity: typeof Meta = Card.Meta;
const cardProps: CardProps = {
  title: "Safe heading",
  header: undefined,
  cover: () => createTextNode("cover"),
  headerExtraContent: () => ["extra", 0, false],
  children: () => ["body", [0, false, null]],
  actions: [() => createTextNode("action"), "text", 0, null],
  footer: () => createTextNode("footer"),
  bordered: undefined,
  loading: false,
  headerLine: true,
  footerLine: false,
  shadows: "hover",
  bodyStyle: { padding: "8px" },
  headerStyle: { color: "red" },
  footerStyle: { textAlign: "end" },
  "aria-label": "Card",
  "data-state": "idle",
};
const cardSlots: CardSlots = {
  default: () => createTextNode("body"),
  title: () => createTextNode("title"),
  header: () => [],
  headerExtraContent: () => [],
  cover: () => createTextNode("cover"),
  footer: () => [],
};
const cardGroupProps: CardGroupProps = {
  spacing: [12, 20],
  type: "grid",
  "data-group": true,
};
const cardGroupSlots: CardGroupSlots = { default: () => [] };
const cardMetaProps: MetaProps = {
  title: "Title",
  description: () => ["description", 0],
  avatar: () => createTextNode("A"),
};
const cardMetaSlots: MetaSlots = {
  avatar: () => createTextNode("A"),
  title: () => [],
  description: () => [],
};
const cardContent: CardContent = () => ["native", false, null, 0];
const cardResult: CardRenderResult = ["native", [false, null, 0]];
const cardShadows: Shadows = "always";
const cardGroupType: CardGroupType = "grid";
const directGroupProps: DirectGroupProps = cardGroupProps;
const directGroupSlots: DirectGroupSlots = cardGroupSlots;
const directGroupType: DirectGroupType = cardGroupType;
const directMetaProps: DirectMetaProps = cardMetaProps;
const directMetaSlots: DirectMetaSlots = cardMetaSlots;
// @ts-expect-error Fixed Card has no selected-state API.
const invalidSelected: CardProps = { selected: true };
// @ts-expect-error Fixed Card has no size API.
const invalidSize: CardProps = { size: "small" };
// @ts-expect-error Shadows follows Card source, not Meta's unused historical type.
const invalidShadow: CardProps = { shadows: "show" };
// @ts-expect-error Actions are an array, not a renderer for the whole action area.
const invalidActions: CardProps = { actions: () => [] };
// @ts-expect-error Native content factories must return synchronously.
const invalidAsync: CardProps = { footer: async () => null };
// @ts-expect-error Raw string slot output does not own a native block.
const invalidStringSlot: CardSlots = { title: () => "title" };
// @ts-expect-error Actions keep the source array API; no actions slot is added.
const invalidActionsSlot: CardSlots = { actions: () => [] };
// @ts-expect-error Meta has no default content slot.
const invalidMetaSlot: MetaSlots = { default: () => [] };
// @ts-expect-error CardGroup exposes only its fixed grid mode.
const invalidGroupType: CardGroupProps = { type: "list" };
// @ts-expect-error CardGroup does not add arbitrary ARIA forwarding.
const invalidGroupAria: CardGroupProps = { role: "group" };
// @ts-expect-error No dangerous HTML replacement input is public.
const invalidHtml: CardProps = { innerHTML: "<b>unsafe</b>" };
// @ts-expect-error Card does not expose an imperative component-ref API.
const invalidCardRef: CardProps = { ref: { focus() {} } };
// @ts-expect-error CardGroup is a separate root/subpath export.
void Card.Group;
// @ts-expect-error Card class instance rendering methods are not a Vapor API.
void Card.renderHeader;
// @ts-expect-error Meta is a static/subpath member, not a card-module value export.
import { Meta as InvalidMeta } from "semi-ui-vue/card";
// @ts-expect-error CardGroup is a separate subpath, not a card-module value export.
import { CardGroup as InvalidGroup } from "semi-ui-vue/card";
void [
  cardIdentity,
  groupIdentity,
  metaIdentity,
  staticIdentity,
  cardProps,
  cardSlots,
  cardGroupProps,
  cardGroupSlots,
  cardMetaProps,
  cardMetaSlots,
  cardContent,
  cardResult,
  cardShadows,
  cardGroupType,
  directGroupProps,
  directGroupSlots,
  directGroupType,
  directMetaProps,
  directMetaSlots,
  invalidSelected,
  invalidSize,
  invalidShadow,
  invalidActions,
  invalidAsync,
  invalidStringSlot,
  invalidActionsSlot,
  invalidMetaSlot,
  invalidGroupType,
  invalidGroupAria,
  invalidHtml,
  invalidCardRef,
  InvalidMeta,
  InvalidGroup,
];
