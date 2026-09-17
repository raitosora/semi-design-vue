import { ref, type Ref } from "vue";
import {
  Protocol,
  ProtocolGroup,
  type ProtocolApi,
  type ProtocolSlots,
} from "../examples/contracts/Protocol.vapor";
import { GenericChoice } from "../examples/contracts/Generic.vapor";
// @ts-expect-error Unsupported value type.
export const badValue = <Protocol value={{}} />;
// @ts-expect-error The decision hook cannot return an arbitrary string.
export const badDecision = <Protocol beforeChange={() => "yes"} />;
// @ts-expect-error A change notification receives the declared value union and native Event.
export const badChange = <Protocol onChange={(value: Date) => value} />;
// @ts-expect-error A model update carries the value union.
export const badUpdate = <Protocol onUpdate:value={(value: Date) => value} />;
// @ts-expect-error Slot children must be render functions.
export const badSlot = <Protocol>raw child</Protocol>;
const badSlots: ProtocolSlots = {
  // @ts-expect-error Slot props have no missing field.
  default: (slot) => <p>{slot.missing}</p>,
};
// @ts-expect-error Static child requires label.
export const missingLabel = <ProtocolGroup.Part />;
// @ts-expect-error The root type has no invented static child.
export const missingStatic = <ProtocolGroup.Missing />;
export const badGenericValue = (
  // @ts-expect-error T comes from numeric items, value cannot widen it to string.
  <GenericChoice items={[1]} onSelect={() => {}} value="x" />
);
export const badGenericEvent = (
  <GenericChoice<number>
    items={[1]}
    // @ts-expect-error Generic notification preserves numeric T.
    onSelect={(value: string) => value}
    value={1}
  />
);
const invalid = ref<{ missing: true } | null>(null);
// @ts-expect-error Ordinary Ref assignment checks the exposed contract (JSX ref remains loose upstream).
const invalidRef: Ref<ProtocolApi | null> = invalid;
const valid = ref<ProtocolApi | null>(null);
// @ts-expect-error focus returns void.
valid.value?.focus().toFixed();
// @ts-expect-error No public instance $el.
valid.value?.$el;
void [badSlots, invalidRef];
const wrongSlot = (slot: { value: Date }) => <p>{slot.value.getTime()}</p>;
export const invalidJsxSlot = (
  // @ts-expect-error The actual component JSX slot rejects a Date payload contract.
  <Protocol v-slots={{ default: wrongSlot }} />
);
