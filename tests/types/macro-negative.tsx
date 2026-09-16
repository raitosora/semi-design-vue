import { defineVaporComponent } from "vue";

const InvalidMacroAssignment = defineVaporComponent(() => {
  const model = defineModel<string>()!;
  // @ts-expect-error model values remain strings.
  model.value = 1;
  return <div />;
});

void InvalidMacroAssignment;
