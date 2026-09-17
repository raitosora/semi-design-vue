import { version as animationVersion } from "semi-animation-vue";
import { version as iconsLabVersion } from "semi-icons-lab-vue";
import { version as iconsVersion } from "semi-icons-vue";
import { version as illustrationsVersion } from "semi-illustrations-vue";
import {
  createFieldContextKey,
  hasProvidedProp,
  useControllableValue,
  version as uiVersion,
  type ChangeCallback,
  type ControllableValueOptions,
  type DecisionCallback,
  type FieldContext,
  type FieldControl,
} from "semi-ui-vue";
import { version as themeVersion } from "vite-plugin-semi-theme";

const options: ControllableValueOptions<number> = {
  isControlled: () => false,
  value: () => 1,
  defaultValue: () => 0,
};
const state = useControllableValue(options);
const value: number = state.value.value;
state.setValue(value);
const present: boolean = hasProvidedProp({ value: undefined }, "value");
const change: ChangeCallback<number, { type: "change" }> = (next, event) => {
  const n: number = next;
  const t: "change" = event.type;
  void n;
  void t;
};
const decision: DecisionCallback<string> = async (next) => next.length > 0;
const key = createFieldContextKey<number>();
const control: FieldControl<number> = { id: "x", value: state.value };
const context: FieldContext<number> = {
  metadata: { name: "x" },
  value: state.value,
  registerControl: () => ({ dispose() {} }),
};
void present;
void change;
void decision;
void key;
void control;
void context;
const versions: readonly string[] = [
  animationVersion,
  iconsLabVersion,
  iconsVersion,
  illustrationsVersion,
  uiVersion,
  themeVersion,
];
void versions;

// @ts-expect-error callback value must remain number
const badChange: ChangeCallback<number> = (next: string) => next;
// @ts-expect-error setValue preserves the generic T
state.setValue("wrong");
// @ts-expect-error field controls cannot register a different value type
const badControl: FieldControl<string> = control;
// @ts-expect-error decision callbacks only return boolean, void, or Promise thereof
const badDecision: DecisionCallback<number> = () => "yes";
void badChange;
void badControl;
void badDecision;

// @ts-expect-error A host must not widen T and accept controls of another value type.
const widenedContext: FieldContext<number | string> = context;
// @ts-expect-error Controls cannot replace their host's value through a read-only ref.
context.value.value = 2;
// @ts-expect-error Metadata is read-only for controls.
context.metadata.required = true;
void widenedContext;
// @ts-expect-error Effective state is a read-only computed value.
state.value.value = 3;
// @ts-expect-error Control mode is derived, not consumer-writable.
state.controlled.value = true;
// @ts-expect-error Reading a numeric state must not erase T to any.
const badRead: string = state.value.value;
// @ts-expect-error A numeric state cannot be widened to accept string writes.
const widenedState: ReturnType<typeof useControllableValue<number | string>> =
  state;
void [badRead, widenedState];

// Foundation bridge declarations are consumed without upstream Foundation types.
import {
  useFoundation,
  type FoundationAdapter,
  type FoundationScope,
} from "semi-ui-vue";
function foundationTypes(
  scope: FoundationScope,
  adapter: FoundationAdapter<{ value?: number }, { count: number }>,
) {
  const promise = Promise.resolve(false);
  const result: Promise<boolean> | undefined = scope.decide(() => promise);
  const bridge = useFoundation({
    props: () => ({ label: "label" }),
    initialState: { count: 0 },
    create: (base, resources) => ({
      init() {
        base.setState({ count: 1 });
        resources.own(() => {});
      },
      destroy() {},
      request(value: number) {
        base.setState({ count: value });
      },
    }),
    watchProps(next, previous, instance) {
      const label: string = previous.label + next.label;
      instance.request(label.length);
    },
    onError(error) {
      const value: unknown = error;
      void value;
    },
  });
  const count: number = bridge.state.value.count;
  bridge.foundation.request(count);
  // @ts-expect-error State is a readonly snapshot.
  bridge.state.value.count = 2;
  // @ts-expect-error State patches retain their field types.
  adapter.setState({ count: "wrong" });
  // @ts-expect-error The adapter must not be widened to accept incompatible state.
  const wider: FoundationAdapter<
    { value?: number },
    { count: number | string }
  > = adapter;
  // @ts-expect-error Disposal must run through the bridge to invoke Foundation.destroy.
  scope.dispose();
  // @ts-expect-error Task commits contain effects, not arbitrary data.
  scope.task().commit(1);
  void [result, wider];
}
void foundationTypes;
