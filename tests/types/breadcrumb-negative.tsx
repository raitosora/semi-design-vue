import type { ComponentInstance, Ref } from "vue";
import Breadcrumb, {
  type BreadcrumbProps,
  type BreadcrumbItemProps,
  type BreadcrumbSlots,
  type BreadcrumbItemSlots,
  type RouteProps,
} from "semi-ui-vue/breadcrumb";
// @ts-expect-error Fixed moreType literals.
const mode: BreadcrumbProps = { moreType: "dropdown" };
// @ts-expect-error No current API.
const current: BreadcrumbProps = { current: 1 };
// @ts-expect-error No invented root event.
const change: BreadcrumbProps = { onChange: () => {} };
// @ts-expect-error Item click receives info and native MouseEvent.
const badClick: BreadcrumbItemProps = { onClick: (_value: string) => {} };
// @ts-expect-error No unsafe HTML.
const html: BreadcrumbItemProps = { innerHTML: "unsafe" };
// @ts-expect-error Name remains a string in the fixed upstream public route type.
const object: RouteProps = { name: {} };
// @ts-expect-error Renderer is synchronous.
const asyncContent: BreadcrumbProps = { renderItem: async () => [] };
// @ts-expect-error RenderMore receives factories, not reusable native blocks.
const eager: BreadcrumbProps = { renderMore: (items: HTMLElement[]) => items };
// @ts-expect-error Native slots do not return scalar strings.
const scalar: BreadcrumbSlots = { default: () => "text" };
// @ts-expect-error Native slots do not return scalar arrays.
const array: BreadcrumbItemSlots = { separator: () => ["text", 0] };
// @ts-expect-error Native slots remain synchronous.
const asyncSlot: BreadcrumbItemSlots = { icon: async () => [] };
// @ts-expect-error No extra container slot.
const extra: BreadcrumbSlots = { icon: () => <i /> };
// @ts-expect-error No invented Item.Meta.
void Breadcrumb.Item.Meta;
// @ts-expect-error No root child value alias.
import { BreadcrumbItem } from "semi-ui-vue";
// @ts-expect-error No family child value alias.
import { Item } from "semi-ui-vue/breadcrumb";
// @ts-expect-error Item has a default-only value.
import { BreadcrumbItem as NamedItem } from "semi-ui-vue/breadcrumb/item";
declare const instance: ComponentInstance<typeof Breadcrumb>;
// @ts-expect-error No public DOM ref method.
instance.getElement();
declare const child: ComponentInstance<typeof Breadcrumb.Item>;
// @ts-expect-error No imperative child ref API.
child.focus();
declare const wrong: Ref<{ getElement(): HTMLElement }>;
// @ts-expect-error Ref cannot assume invented methods.
const wrongRef: Ref<ComponentInstance<typeof Breadcrumb>> = wrong;
// @ts-expect-error Inline slots retain strict types.
const inline = <Breadcrumb v-slots={{ default: () => "raw" }} />;
void [
  mode,
  current,
  change,
  badClick,
  html,
  object,
  asyncContent,
  eager,
  scalar,
  array,
  asyncSlot,
  extra,
  BreadcrumbItem,
  Item,
  NamedItem,
  wrongRef,
  inline,
];
