import type { InjectionKey, Ref, ShallowRef } from "vue";
import type { BasicStepsProps } from "./types.js";
export interface StepsEntry {
  readonly element: Ref<HTMLDivElement | null>;
  readonly index: ShallowRef<number>;
}
export interface StepsContext {
  readonly type: "fill" | "basic" | "nav";
  readonly props: BasicStepsProps;
  readonly count: Readonly<Ref<number>>;
  register(entry: StepsEntry): () => void;
}
export const stepsContextKey: InjectionKey<StepsContext> = Symbol("semi-steps");
