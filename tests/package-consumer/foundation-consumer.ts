import { createVaporApp, createApp, vaporInteropPlugin } from "vue";
import {
  FoundationHarness,
  FoundationInput,
  FoundationTooltip,
  Model,
  type FoundationInputProps,
  type FoundationTooltipProps,
} from "@raitosora/semi-validation-foundation";

const input: FoundationInputProps = {
  value: "value",
  "onUpdate:value": (value: string) => void value,
};
const tooltip: FoundationTooltipProps = { content: "content" };
// @ts-expect-error Input values remain strings after packing declarations.
const invalidInput: FoundationInputProps = { value: 12 };
// @ts-expect-error Tooltip content is required in the emitted declaration.
const invalidTooltip: FoundationTooltipProps = {};
void [
  input,
  tooltip,
  invalidInput,
  invalidTooltip,
  FoundationInput,
  FoundationTooltip,
  Model,
];
createVaporApp(FoundationHarness);
createApp(FoundationHarness).use(vaporInteropPlugin);

import type { TooltipProps, TooltipInstance } from "semi-ui-vue/tooltip";
const publicTooltip: TooltipProps = {
  trigger: "click",
  content: () => 0,
  wrapperId: "foundation-public-tooltip",
  motion: false,
};
const invalidPublicContent: TooltipProps = {
  // @ts-expect-error Public Tooltip content stays primitive, unlike owned slots.
  content: () => document.createElement("b"),
};
const publicInstance = null as TooltipInstance | null;
publicInstance?.focusTrigger();
const publicPosition: Record<string, string | number> | undefined =
  publicInstance?.rePosition();
const publicId: string | undefined = publicInstance?.getPopupId();
void [publicPosition, publicId];
void [publicTooltip, invalidPublicContent];

import type { PopoverProps, PopoverInstance } from "semi-ui-vue/popover";
const publicPopover: PopoverProps = {
  trigger: "click",
  content: () => 0,
  motion: false,
};
const invalidPublicPopoverContent: PopoverProps = {
  // @ts-expect-error Public Popover content stays primitive, unlike owned slots.
  content: () => document.createElement("b"),
};
const popoverInstance = null as PopoverInstance | null;
popoverInstance?.focusTrigger();
// @ts-expect-error Popover does not expose Tooltip repositioning.
popoverInstance?.rePosition();
// @ts-expect-error Popover does not expose Tooltip popup IDs.
popoverInstance?.getPopupId();
void [publicPopover, invalidPublicPopoverContent];

import { createTextNode } from "vue";
import DefaultOverflowList, {
  OverflowList,
  type OverflowItem,
  type OverflowListProps,
  type OverflowListSlots,
  type OverflowListCollapseSlots,
  type OverflowListScrollSlots,
  type OverflowRenderResult,
} from "semi-ui-vue/overflowList";
import {
  OverflowList as NamedOverflowList,
  type OverflowListProps as SubpathProps,
} from "semi-ui-vue/overflowList";
const identity: typeof DefaultOverflowList = OverflowList;
const subpathIdentity: typeof OverflowList = NamedOverflowList;
const items: OverflowItem[] = [{ key: "first", label: "First" }];
const props: OverflowListProps = {
  items,
  renderMode: "collapse",
  collapseFrom: "start",
  minVisibleItems: 0,
  threshold: undefined,
  itemKey: "key",
  style: { width: "100px" },
  wrapperClassName: "outer",
  wrapperStyle: { padding: "4px" },
  visibleItemRenderer: (item, index) => [String(item.label), index, false],
  overflowRenderer: (overflow) => overflow.length,
  onOverflow: (overflow) => void overflow[0]?.key,
  onIntersect: (entries) => void entries.first?.intersectionRatio,
  onVisibleStateChange: (state) => void state.get("first"),
};
const scroll: OverflowListProps = {
  renderMode: "scroll",
  items,
  overflowRenderer: ([before, after]) => [before.length, after.length],
};
const slots: OverflowListSlots = {
  visibleItem: (scope) => [
    createTextNode(String(scope.item.label)),
    createTextNode(String(scope.index)),
  ],
};
const scrollSlots: OverflowListScrollSlots = {
  visibleItem: (scope) => createTextNode(String(scope.item.key)),
  overflowStart: (scope) => createTextNode(String(scope.items.length)),
  overflowEnd: () => null,
};
const primitiveSlots: OverflowListCollapseSlots = {
  // @ts-expect-error Native slots require owned native content, unlike raw renderers.
  visibleItem: () => ["text", 0],
};
const primitiveScrollSlot: OverflowListScrollSlots = {
  // @ts-expect-error Native scroll side slots do not return bare primitives.
  overflowStart: () => "before",
};
const tupleScrollSlot: OverflowListScrollSlots = {
  // @ts-expect-error Scroll side content uses two native slots, not one tuple slot.
  overflow: () => [],
};
const result: OverflowRenderResult = [null, undefined, "safe text", 0, false];
// @ts-expect-error Collapse direction is finite.
const invalidDirection: OverflowListProps = { collapseFrom: "left" };
// @ts-expect-error Minimum visible count remains numeric.
const invalidMinimum: OverflowListProps = { minVisibleItems: "one" };
const invalidRenderer: OverflowListProps = {
  // @ts-expect-error Renderers return synchronous native Vapor content.
  visibleItemRenderer: async () => [],
};
// @ts-expect-error Items retain their object contract.
const invalidItem: OverflowListProps = { items: ["first"] };
// @ts-expect-error There is no React children prop.
const invalidChildren: OverflowListProps = { children: "content" };
// @ts-expect-error No unsafe HTML input is exposed.
const unsafeHtml: OverflowListProps = { innerHTML: "<b>unsafe</b>" };
void [
  identity,
  subpathIdentity,
  props,
  scroll,
  slots,
  result,
  scrollSlots,
  primitiveSlots,
  primitiveScrollSlot,
  tupleScrollSlot,
  invalidDirection,
  invalidMinimum,
  invalidRenderer,
  invalidItem,
  invalidChildren,
  unsafeHtml,
  null as SubpathProps | null,
];

import DefaultCard, {
  Card,
  type CardProps,
  type MetaProps,
  type CardGroupProps,
} from "semi-ui-vue/card";
import DefaultCardGroup, {
  CardGroup,
  type CardGroupProps as DirectCardGroupProps,
  type CardGroupSlots as DirectCardGroupSlots,
  type CardGroupType as DirectCardGroupType,
} from "semi-ui-vue/card/cardGroup";
import DefaultMeta, {
  Meta,
  type MetaProps as DirectMetaProps,
  type MetaSlots as DirectMetaSlots,
} from "semi-ui-vue/card/meta";
const cardIdentity: typeof DefaultCard = Card;
const cardGroupIdentity: typeof DefaultCardGroup = CardGroup;
const metaIdentity: typeof DefaultMeta = Card.Meta;
const metaNamedIdentity: typeof Meta = Card.Meta;
const card: CardProps = {
  title: "Packed Card",
  loading: undefined,
  actions: [() => createTextNode("Action")],
  "aria-label": "Packed Card",
};
const meta: MetaProps = {
  title: "Title",
  description: () => ["Description", 0, null],
};
const group: CardGroupProps = { spacing: [12, 20], type: "grid" };
// @ts-expect-error Card has no selected API.
const cardSelected: CardProps = { selected: true };
// @ts-expect-error Card factories are synchronous.
const cardAsync: CardProps = { title: async () => null };
// @ts-expect-error Meta has no command ref.
const metaRef: MetaProps = { ref: { focus() {} } };
// @ts-expect-error CardGroup does not forward arbitrary ARIA attributes.
const groupRole: CardGroupProps = { role: "group" };
void [
  cardIdentity,
  cardGroupIdentity,
  metaIdentity,
  metaNamedIdentity,
  card,
  meta,
  group,
  cardSelected,
  cardAsync,
  metaRef,
  groupRole,
];

const directGroupProps: DirectCardGroupProps = {
  spacing: [12, 20],
  type: "grid",
};
const directGroupSlots: DirectCardGroupSlots = { default: () => [] };
const directGroupType: DirectCardGroupType = "grid";
const directMetaProps: DirectMetaProps = { title: "Direct Meta" };
const directMetaSlots: DirectMetaSlots = {
  title: () => createTextNode("Direct"),
};
void [
  directGroupProps,
  directGroupSlots,
  directGroupType,
  directMetaProps,
  directMetaSlots,
];

import "./list-types.js";

import "./descriptions-types.js";
