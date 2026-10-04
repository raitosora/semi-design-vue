import type { ComputedRef, InjectionKey } from "vue";
import type { PopoverTriggerScope } from "../popover/types.js";
/** Private native root bridge for the count tag owned by TagGroup. */
export const tagTriggerKey: InjectionKey<
  ComputedRef<PopoverTriggerScope> | undefined
> = Symbol("semi-tag-trigger");
