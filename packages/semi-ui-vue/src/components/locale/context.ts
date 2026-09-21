import { computed, inject } from "vue";
import type { InjectionKey, Ref } from "vue";
import type { Locale } from "../../locale/interface.js";
import DefaultLocale from "../../locale/source/zh_CN.js";
import { configContextKey } from "../configProvider/context.js";
import type { LocaleContextSource } from "./types.js";

export const localeContextKey: InjectionKey<Readonly<Ref<Locale>>> = Symbol(
  "semi-locale-provider",
);

/** Read in setup and retain the ref: dictionary and component name stay live. */
export function useLocaleContext<Name extends string>(
  componentName: () => Name,
): LocaleContextSource<Name>;
export function useLocaleContext(): LocaleContextSource;
export function useLocaleContext(
  componentName: () => string = () => "",
): LocaleContextSource {
  // Only an actual ConfigProvider participates in the upstream precedence rule.
  // useConfigContext's independent G09 defaults would otherwise hide this source.
  const config = inject(configContextKey, undefined);
  const provider = inject(localeContextKey, undefined);
  return computed(() => {
    const selected = config?.value.locale || provider?.value;
    const locale = selected?.code ? selected : DefaultLocale;
    return Object.freeze({
      componentLocale: locale[componentName() as keyof Locale],
      localeCode: locale.code,
      dateFnsLocale:
        locale.dateFnsLocale === undefined
          ? DefaultLocale.dateFnsLocale
          : locale.dateFnsLocale,
      currency: locale.currency,
    });
  });
}
