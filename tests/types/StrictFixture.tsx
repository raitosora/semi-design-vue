import type { JSX } from "vue-jsx";
import type { Ref } from "vue";
import { defineVaporComponent } from "vue";

interface StrictFixtureProps {
  label: string;
  count: number;
  modelValue: string;
  onChange?: (value: number) => void;
  "onUpdate:modelValue"?: (value: string) => void;
}

export interface StrictFixtureExposed {
  focus(): string;
  reset(): void;
}

export interface StrictFixtureSlots {
  default: (props: { label: string; count: number }) => JSX.Element;
  footer: () => JSX.Element;
}

const StrictFixtureRuntime = defineVaporComponent(
  (props: StrictFixtureProps) => {
    const model = defineModel<string>()!;
    const api: StrictFixtureExposed = {
      focus: () => "focused",
      reset: () => {
        model.value = props.label;
      },
    };
    defineExpose<StrictFixtureExposed>(api);
    return (
      <button
        onClick={() => {
          props.onChange?.(props.count);
          props["onUpdate:modelValue"]?.(model.value ?? props.modelValue);
        }}
      >
        <slot count={props.count} label={props.label} />
        <slot name="footer" />
      </button>
    );
  },
);

interface StrictFixturePublicProps extends StrictFixtureProps {
  "v-slots"?: StrictFixtureSlots;
  ref?: Ref<StrictFixtureExposed | null>;
}

// Vue's Vapor slot generic accepts Blocks while vue-jsx exposes JSX elements.
// Keep this adapter bound to the actual runtime component and limit it to the
// public JSX props that the runtime fixture exercises.
type StrictFixtureAdapter = typeof StrictFixtureRuntime & {
  readonly __vapor: true;
  new (
    props: StrictFixturePublicProps,
  ): { $props: StrictFixturePublicProps } & StrictFixtureExposed;
};

export const StrictFixture = StrictFixtureRuntime as StrictFixtureAdapter;
