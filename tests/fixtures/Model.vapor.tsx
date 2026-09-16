import { defineVaporComponent, ref } from "vue";

export const Model = defineVaporComponent(() => {
  const model = defineModel<string>()!;
  const input = ref<HTMLInputElement | null>(null);
  defineExpose({ focus: () => input.value?.focus() });
  return <input aria-label="Model" ref={input} v-model={model.value} />;
});
