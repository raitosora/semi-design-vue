import type { InjectionKey, Ref, ShallowRef } from "vue";
import type {
  DescriptionLayout,
  DescriptionsAlign,
  DescriptionsItemProps,
} from "./types.js";
export interface Entry {
  readonly anchor: () => HTMLTemplateElement | null;
  readonly start: () => HTMLTemplateElement | null;
  readonly end: () => HTMLTemplateElement | null;
  readonly props: () => Pick<DescriptionsItemProps, "span" | "hidden">;
  readonly fillable?: () => boolean;
  readonly target: ShallowRef<HTMLTableRowElement | null>;
  readonly span: ShallowRef<number | undefined>;
}
export interface DescriptionsContext {
  readonly align: Readonly<Ref<DescriptionsAlign>>;
  readonly layout: Readonly<Ref<DescriptionLayout>>;
  register(entry: Entry): () => void;
  refresh(): void;
}
export const descriptionsContextKey: InjectionKey<DescriptionsContext> =
  Symbol("semi-descriptions");
