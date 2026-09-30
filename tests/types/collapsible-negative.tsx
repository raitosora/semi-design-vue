import Collapsible, {
  type CollapsibleProps,
  type CollapsibleSlots,
} from "../../packages/semi-ui-vue/src/components/collapsible/index.js";
// @ts-expect-error Collapsible is controlled through isOpen, no defaultOpen API.
const uncontrolled: CollapsibleProps = { defaultOpen: true };
// @ts-expect-error Collapsible has no update event or v-model API.
const notification: CollapsibleProps = { "onUpdate:isOpen": () => {} };
// @ts-expect-error duration is numeric.
const time: CollapsibleProps = { duration: "250ms" };
// @ts-expect-error owned native content uses the default slot.
const child = <Collapsible children="React node" />;
// @ts-expect-error content injection cannot replace owned native slots.
const html: CollapsibleProps = { innerHTML: "<b/>" };
// @ts-expect-error no title named slot.
const named: CollapsibleSlots = { title: () => <b /> };
// @ts-expect-error asynchronous slot results are unsupported.
const async: CollapsibleSlots = { default: async () => <b /> };
// @ts-expect-error no invented imperative open method.
Collapsible.open();
void [uncontrolled, notification, time, child, html, named, async];
