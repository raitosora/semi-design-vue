import { defineVaporComponent } from "vue";
import { useLocaleContext } from "./context.js";
import type { LocaleConsumerProps, LocaleConsumerSlots } from "./types.js";

const Consumer = defineVaporComponent<LocaleConsumerProps, {}, string, {}>(
  (props: LocaleConsumerProps) => {
    const locale = useLocaleContext(() => props.componentName ?? "");
    return <slot locale={locale} />;
  },
  { props: ["componentName"], inheritAttrs: false },
);

// Native slots render Blocks. This type-only JSX boundary preserves the public
// render-result union and dictionary types for explicit string-key generics.
type ConsumerComponent = typeof Consumer & {
  new <Name extends string = string>(
    props: LocaleConsumerProps<Name>,
  ): {
    $props: LocaleConsumerProps<Name>;
    $slots: LocaleConsumerSlots<Name>;
  };
};
export const LocaleConsumer = Consumer as ConsumerComponent;
export default LocaleConsumer;
