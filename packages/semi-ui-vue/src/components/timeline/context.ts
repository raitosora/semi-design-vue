import type { InjectionKey, Ref, ShallowRef } from "vue";
import type { TimelineMode } from "./types.js";
export interface TimelineEntry {
  readonly element: Ref<HTMLLIElement | null>;
  readonly index: ShallowRef<number>;
}
export interface TimelineContext {
  readonly mode: Readonly<Ref<TimelineMode>>;
  register(entry: TimelineEntry): () => void;
}
export const timelineContextKey: InjectionKey<TimelineContext> =
  Symbol("semi-timeline");
export const timelineDataIndexKey: InjectionKey<
  Readonly<Ref<number>> | undefined
> = Symbol("semi-timeline-data-index");
