import { createTextNode, ref, type ComponentInstance } from "vue";
import { Card as RootCard, CardGroup as RootGroup } from "semi-ui-vue";
import Card, {
  Card as NamedCard,
  type CardProps,
  type CardSlots,
  type MetaProps,
  type MetaSlots,
  type CardGroupProps,
  type CardGroupSlots,
  type CardContent,
  type CardRenderResult,
  type Shadows,
  type CardGroupType,
} from "semi-ui-vue/card";
import Meta, {
  Meta as NamedMeta,
  type Shadows as MetaShadows,
  type MetaProps as SubpathMetaProps,
  type MetaSlots as SubpathMetaSlots,
} from "semi-ui-vue/card/meta";
import CardGroup, {
  CardGroup as NamedGroup,
  type CardGroupProps as SubpathGroupProps,
  type CardGroupSlots as SubpathGroupSlots,
  type CardGroupType as SubpathGroupType,
} from "semi-ui-vue/card/cardGroup";
const entries: [
  typeof Card,
  typeof Card,
  typeof Meta,
  typeof Meta,
  typeof CardGroup,
  typeof CardGroup,
] = [RootCard, NamedCard, Card.Meta, NamedMeta, RootGroup, NamedGroup];
const props: CardProps = {
  title: "Title",
  headerExtraContent: () => <button>More</button>,
  actions: [0, false, null, () => <button>Save</button>],
  cover: () => <svg />,
  footer: "Footer",
  bordered: undefined,
  loading: undefined,
  headerLine: undefined,
  footerLine: undefined,
  header: undefined,
  shadows: "hover",
  bodyStyle: { padding: "8px" },
  headerStyle: {},
  footerStyle: {},
  style: {},
  class: ["custom"],
  className: "card",
  id: "card",
  "aria-label": "Card",
  "data-count": 0,
  onClick: (event) => void event.clientX,
};
const slots: CardSlots = {
  header: () => <header />,
  title: () => <strong />,
  headerExtraContent: () => <button />,
  cover: () => <svg />,
  footer: () => <footer />,
  default: () => (
    <>
      <input />
      <span />
    </>
  ),
};
const meta: MetaProps = {
  avatar: () => <span />,
  title: 0,
  description: () => ["text", createTextNode("native")],
  id: "meta",
  onClick: (event) => void event.clientX,
};
const metaSlots: MetaSlots = {
  avatar: () => <span />,
  title: () => <strong />,
  description: () => <p />,
};
const group: CardGroupProps = {
  spacing: [8, 16],
  children: () => <Card />,
  "data-group": true,
  className: "group",
  style: {},
  type: undefined,
};
const groupSlots: CardGroupSlots = {
  default: () => (
    <>
      <Card />
      <Card />
    </>
  ),
};
const content: CardContent = () => [
  null,
  undefined,
  false,
  0,
  "text",
  createTextNode("native"),
];
const result: CardRenderResult = [null, createTextNode("native")];
const shadow: Shadows = "always";
const groupType: CardGroupType = "grid";
const instance = ref<ComponentInstance<typeof Card> | null>(null);
const fixture = <Card {...props} ref={instance} v-slots={slots} />;
const composition = <CardGroup {...group} v-slots={groupSlots} />;
const metadata = <Card.Meta {...meta} v-slots={metaSlots} />;
void [
  entries,
  content,
  result,
  shadow,
  groupType,
  fixture,
  composition,
  metadata,
];

const legacyMetaShadow: MetaShadows = "show";
void legacyMetaShadow;

const subpathMeta: SubpathMetaProps = meta;
const subpathMetaSlots: SubpathMetaSlots = metaSlots;
const subpathGroup: SubpathGroupProps = group;
const subpathGroupSlots: SubpathGroupSlots = groupSlots;
const subpathGroupType: SubpathGroupType = groupType;
void [
  subpathMeta,
  subpathMetaSlots,
  subpathGroup,
  subpathGroupSlots,
  subpathGroupType,
];
