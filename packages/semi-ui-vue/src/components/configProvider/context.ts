import { computed, inject } from "vue";
import type { InjectionKey } from "vue";
import { useSemiContext } from "../../context/context.js";
import { defaultResponsiveMap } from "./responsive.js";
import type { ConfigContextSource } from "./types.js";

export const configContextKey: InjectionKey<ConfigContextSource> = Symbol(
  "semi-config-provider",
);
const emptyScreens = Object.freeze({
  xs: false,
  sm: false,
  md: false,
  lg: false,
  xl: false,
  xxl: false,
});

/** Read the live configuration in setup; retain the ref rather than a snapshot. */
export function useConfigContext(): ConfigContextSource {
  const source = inject(configContextKey, undefined);
  const context = useSemiContext();
  return computed(() =>
    Object.freeze({
      locale: context.value.locale,
      direction: context.value.direction,
      timeZone: context.value.date?.timeZone,
      getPopupContainer: context.value.container,
      responsiveMap: source?.value.responsiveMap ?? defaultResponsiveMap,
      responsiveObserve: source?.value.responsiveObserve ?? false,
      screens: source?.value.screens ?? emptyScreens,
      onBreakpoint: source?.value.onBreakpoint,
    }),
  );
}
