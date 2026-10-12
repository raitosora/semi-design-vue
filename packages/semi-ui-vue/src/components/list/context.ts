import type { InjectionKey, Ref } from "vue";
import type { ListProps } from "./types.js";
export type ListContextValue = Pick<
  ListProps,
  "grid" | "onClick" | "onRightClick"
>;
export const listContextKey: InjectionKey<Readonly<Ref<ListContextValue>>> =
  Symbol("semi-list");
