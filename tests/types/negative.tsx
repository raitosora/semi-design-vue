import { ref, type Ref } from "vue";
import {
  StrictFixture,
  type StrictFixtureExposed,
  type StrictFixtureSlots,
} from "./StrictFixture";

const invalidSlots: StrictFixtureSlots = {
  default: ({ label }) => (
    <span>
      {/* @ts-expect-error label is a string. */}
      {label.toFixed()}
    </span>
  ),
  footer: () => <small />,
};

const missingRequiredProp = (
  // @ts-expect-error label is required by the runtime component generic.
  <StrictFixture count={1} modelValue="x" />
);
const invalidProp = (
  // @ts-expect-error count is a number.
  <StrictFixture count="one" label="x" modelValue="x" />
);
const invalidModel = (
  // @ts-expect-error modelValue is a string.
  <StrictFixture count={1} label="x" modelValue={1} />
);
const invalidEvent = (
  <StrictFixture
    count={1}
    label="x"
    modelValue="x"
    // @ts-expect-error onChange receives a number.
    onChange={(value: string) => value}
  />
);
const invalidModelEvent = (
  <StrictFixture
    count={1}
    label="x"
    modelValue="x"
    // @ts-expect-error onUpdate:modelValue receives a string.
    onUpdate:modelValue={(value: number) => value}
  />
);
const invalidSlot = (
  <StrictFixture count={1} label="x" modelValue="x" v-slots={invalidSlots} />
);
const invalidExposeRef = ref<{ missing: true } | null>(null);
// @ts-expect-error The Ref value must match the exposed API.
const invalidDirectRef: Ref<StrictFixtureExposed | null> = invalidExposeRef;
const exposed = ref<StrictFixtureExposed | null>(null);
// @ts-expect-error focus returns a string.
exposed.value?.focus().toFixed();
// @ts-expect-error the exposed API has no missing member.
exposed.value?.missing();

void [
  missingRequiredProp,
  invalidProp,
  invalidModel,
  invalidEvent,
  invalidModelEvent,
  invalidSlot,
  invalidDirectRef,
];
