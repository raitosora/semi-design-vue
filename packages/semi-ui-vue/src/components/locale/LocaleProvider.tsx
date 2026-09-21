import { computed, defineVaporComponent, provide } from "vue";
import DefaultLocale from "../../locale/source/zh_CN.js";
import { localeContextKey } from "./context.js";
import type { LocaleProviderProps } from "./types.js";

/** Each provider replaces the dictionary; omitted or undefined locale resets it. */
export const LocaleProvider = defineVaporComponent<
  LocaleProviderProps,
  {},
  string,
  {}
>(
  (props: LocaleProviderProps) => {
    provide(
      localeContextKey,
      computed(() =>
        props.locale === undefined ? DefaultLocale : props.locale,
      ),
    );
    return <slot />;
  },
  { props: ["locale"], inheritAttrs: false },
);
export default LocaleProvider;
