import type { Locale as DateFnsLocale } from "date-fns";
import type { Ref, VaporRenderResult } from "vue";
import type { Locale } from "../../locale/interface.js";

export interface LocaleProviderSlots {
  default?: () => VaporRenderResult;
}
export interface LocaleProviderProps {
  readonly class?: never;
  readonly style?: never;
  readonly locale?: Locale | undefined;
  readonly "v-slots"?:
    | LocaleProviderSlots
    | LocaleProviderSlots["default"]
    | undefined;
}

/** Known dictionary names retain their value type; arbitrary names are unknown. */
export interface LocaleContextValue<Name extends string = string> {
  readonly componentLocale:
    | (Name extends keyof Locale ? Locale[Name] : unknown)
    | undefined;
  readonly localeCode: string;
  readonly dateFnsLocale: DateFnsLocale;
  readonly currency: string | undefined;
}
export type LocaleContextSource<Name extends string = string> = Readonly<
  Ref<LocaleContextValue<Name>>
>;
export interface LocaleConsumerSlots<Name extends string = string> {
  default?: (scope: {
    readonly locale: LocaleContextSource<Name>;
  }) => VaporRenderResult;
}
export interface LocaleConsumerProps<Name extends string = string> {
  readonly class?: never;
  readonly style?: never;
  readonly componentName?: Name | undefined;
  readonly "v-slots"?:
    | LocaleConsumerSlots<Name>
    | LocaleConsumerSlots<Name>["default"]
    | undefined;
}
