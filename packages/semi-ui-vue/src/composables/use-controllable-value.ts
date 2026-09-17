import { computed, shallowRef } from "vue";

export interface ControllableValueOptions<T> {
  readonly isControlled: () => boolean;
  readonly value: () => T;
  readonly defaultValue: () => T;
}

/** State selection only; event dispatch and async hooks belong to the caller. */
export function useControllableValue<T>(options: ControllableValueOptions<T>) {
  const local = shallowRef<{ value: T }>({ value: options.defaultValue() });
  const controlled = computed(options.isControlled);
  const value = computed<T>(() =>
    controlled.value ? options.value() : local.value.value,
  );
  return {
    controlled,
    value,
    setValue: (next: T): void => {
      if (!controlled.value) local.value = { value: next };
    },
  };
}
