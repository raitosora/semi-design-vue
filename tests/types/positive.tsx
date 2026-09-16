import { ref } from "vue";
import {
  StrictFixture,
  type StrictFixtureExposed,
  type StrictFixtureSlots,
} from "./StrictFixture";

const fixtureRef = ref<StrictFixtureExposed | null>(null);
const slots: StrictFixtureSlots = {
  default: ({ label, count }) => <span>{`${label}:${count}`}</span>,
  footer: () => <small>footer</small>,
};

const positive = (
  <StrictFixture
    count={1}
    label="ready"
    modelValue="initial"
    onChange={(value) => value.toFixed()}
    onUpdate:modelValue={(value) => value.toUpperCase()}
    ref={fixtureRef}
    v-slots={slots}
  />
);

fixtureRef.value?.focus().toUpperCase();
fixtureRef.value?.reset();
void positive;
