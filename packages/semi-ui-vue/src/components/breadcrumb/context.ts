import type { InjectionKey, Ref, ShallowRef } from "vue";
import type {
  BreadcrumbContent,
  BreadcrumbItemRenderer,
  BreadcrumbProps,
} from "./types.js";
export interface BreadcrumbEntry {
  readonly anchor: HTMLTemplateElement;
  readonly index: ShallowRef<number>;
  readonly ready: ShallowRef<boolean>;
  readonly sourceIndex?: Readonly<Ref<number>> | undefined;
  readonly render: BreadcrumbItemRenderer;
}
export interface BreadcrumbContext {
  readonly props: Readonly<Ref<BreadcrumbProps>>;
  readonly entries: Readonly<Ref<readonly BreadcrumbEntry[]>>;
  readonly count: Readonly<Ref<number>>;
  readonly collapsed: Readonly<Ref<boolean>>;
  readonly rest: Readonly<Ref<readonly number[]>>;
  readonly removed: Readonly<Ref<readonly number[]>>;
  readonly separator: BreadcrumbContent;
  register(entry: BreadcrumbEntry): () => void;
}
export const breadcrumbContextKey: InjectionKey<BreadcrumbContext> =
  Symbol("semi-breadcrumb");
export const breadcrumbDataIndexKey: InjectionKey<
  Readonly<Ref<number>> | undefined
> = Symbol("semi-breadcrumb-data-index");
