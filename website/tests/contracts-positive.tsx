import { ref } from "vue";
import {
  Protocol,
  ProtocolGroup,
  type ProtocolApi,
  type ProtocolProps,
  type ProtocolSlots,
} from "../examples/contracts/Protocol.vapor";
import { GenericChoice } from "../examples/contracts/Generic.vapor";
const api = ref<ProtocolApi | null>(null);
const slots: ProtocolSlots = {
  default: (slot) => <span>{String(slot.value)}</span>,
};
const props: ProtocolProps = {
  value: undefined,
  beforeChange: async () => false,
};
export const examples = (
  <div>
    <Protocol
      {...props}
      onChange={(value, event) => {
        void value;
        event.preventDefault();
      }}
      ref={api}
      v-slots={slots}
    />
    <ProtocolGroup.Part label="part" />
    <GenericChoice
      items={[1, 2]}
      onSelect={(value) => value.toFixed()}
      value={1}
    />
    <GenericChoice<string>
      items={["a"]}
      onSelect={(value) => value.toUpperCase()}
      value="a"
    />
  </div>
);
api.value?.focus();
api.value?.decide(false);
