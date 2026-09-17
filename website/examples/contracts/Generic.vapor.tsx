import { defineVaporComponent, ref } from "vue";

export interface GenericChoiceProps<T extends string | number> {
  items: readonly T[];
  value: NoInfer<T>;
  onSelect: (value: T) => void;
}

// Infer T from data, not from a conflicting value or event handler.
export function GenericChoice<T extends string | number>(
  props: GenericChoiceProps<T>,
) {
  return (
    <button onClick={() => props.onSelect(props.value)}>
      {props.items.length}:{props.value}
    </button>
  );
}

export default defineVaporComponent(() => {
  const selected = ref(0);
  return (
    <section>
      <h3>泛型数据与通知</h3>
      <GenericChoice
        items={[1, 2]}
        onSelect={(value) => {
          selected.value = value;
        }}
        value={2}
      />
      <output>选择：{selected.value}</output>
    </section>
  );
});
