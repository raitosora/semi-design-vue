import { defineVaporComponent } from "vue";
import { useConfigContext } from "./context.js";
import type { ConfigConsumerProps, ConfigConsumerSlots } from "./types.js";

/** A native Vapor scoped slot carrying a stable readonly reactive source. */
const Consumer = defineVaporComponent<ConfigConsumerProps, {}, string, {}>(
  (_props: ConfigConsumerProps) => {
    const config = useConfigContext();
    return <slot config={config} />;
  },
  { props: [], inheritAttrs: false },
);

// Type-only JSX boundary: Vue's native slots return Blocks; JSX callbacks use
// the public render-result union. The runtime remains the same Vapor component.
type ConsumerComponent = typeof Consumer & {
  new (props: ConfigConsumerProps): {
    $props: ConfigConsumerProps;
    $slots: ConfigConsumerSlots;
  };
};
export const ConfigConsumer = Consumer as ConsumerComponent;
