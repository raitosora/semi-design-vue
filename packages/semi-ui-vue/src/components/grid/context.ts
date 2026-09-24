import type { ComputedRef, InjectionKey } from "vue";

export type ResolvedGutters = readonly [number, number];
export const rowGuttersKey: InjectionKey<ComputedRef<ResolvedGutters>> = Symbol(
  "semi-grid-row-gutters",
);
