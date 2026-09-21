import { computed, defineVaporComponent, inject, provide, useAttrs } from "vue";
import { provideSemiContext } from "../../context/context.js";
import type { SemiContextInput } from "../../context/types.js";
import { configContextKey } from "./context.js";
import {
  createResponsiveObserver,
  defaultResponsiveMap,
} from "./responsive.js";
import type { ConfigContextSource, ConfigProviderProps } from "./types.js";

const Provider = defineVaporComponent<ConfigProviderProps, {}, string, {}>(
  (_props: ConfigProviderProps) => {
    // Public attrs retain missing versus explicit undefined before defaults.
    const attrs = useAttrs() as Omit<
      ConfigProviderProps,
      "class" | "style" | "v-slots"
    >;
    const parent = inject(configContextKey, undefined);
    const context = provideSemiContext(() => {
      const input: SemiContextInput = {
        ...(Object.hasOwn(attrs, "locale") ? { locale: attrs.locale } : {}),
        ...(Object.hasOwn(attrs, "direction")
          ? { direction: attrs.direction }
          : {}),
        ...(Object.hasOwn(attrs, "timeZone")
          ? { date: { timeZone: attrs.timeZone } }
          : {}),
        ...(Object.hasOwn(attrs, "getPopupContainer")
          ? { container: attrs.getPopupContainer }
          : {}),
      };
      return input;
    });
    const settings = computed(() => ({
      enabled: Object.hasOwn(attrs, "responsiveObserve")
        ? attrs.responsiveObserve === true
        : (parent?.value.responsiveObserve ?? false),
      map:
        (Object.hasOwn(attrs, "responsiveMap")
          ? attrs.responsiveMap
          : parent?.value.responsiveMap) ?? defaultResponsiveMap,
      // The provider observes its creating realm, independently of popup targets.
      view: globalThis.window as Window | undefined,
    }));
    const responsive = createResponsiveObserver(() => settings.value);
    const source: ConfigContextSource = computed(() =>
      Object.freeze({
        locale: context.value.locale,
        direction: context.value.direction,
        timeZone: context.value.date?.timeZone,
        getPopupContainer: context.value.container,
        responsiveMap: settings.value.map,
        responsiveObserve: settings.value.enabled,
        screens: responsive.screens.value,
        onBreakpoint: responsive.onBreakpoint,
      }),
    );
    provide(configContextKey, source);
    return (
      <div
        class={context.value.direction === "rtl" ? "semi-rtl" : undefined}
        dir={context.value.direction}
      >
        <slot />
      </div>
    );
  },
  { props: [], inheritAttrs: false },
);

/** Stable wrapper preserves native child state while direction changes. */
export const ConfigProvider = Object.assign(Provider, { defaultResponsiveMap });
export default ConfigProvider;
