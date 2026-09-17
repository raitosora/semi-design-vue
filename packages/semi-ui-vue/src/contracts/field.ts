import type { InjectionKey, Ref } from "vue";

/**
 * Metadata shared by a field host and its controls. Hosts own this object;
 * controls must treat it as an immutable description.
 */
export interface FieldMetadata {
  readonly name?: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
}

/**
 * A control can be registered by a field host without requiring a Form
 * implementation. The value ref is intentionally read-only for controls that
 * only need to observe the current field value.
 */
export interface FieldControl<T> {
  readonly id: string;
  readonly value: Readonly<Ref<T>>;
  focus?(): void;
}

/**
 * Releasing a registration must be safe to call more than once. Field hosts
 * use this to remove a control during both explicit teardown and unmount.
 */
export interface FieldControlRegistration {
  dispose(): void;
}

/**
 * Optional contract between a field host and a control. It deliberately does
 * not prescribe validation, layout, or a Form runtime.
 */
export interface FieldContext<T> {
  readonly metadata: Readonly<FieldMetadata>;
  readonly value: Readonly<Ref<T>>;
  readonly registerControl: (
    control: FieldControl<T>,
  ) => FieldControlRegistration;
}

/**
 * Basic controls can accept this optional prop when their caller has a context
 * directly. A supplied prop takes precedence over injection. Without either,
 * controls remain usable as standalone components.
 */
export interface FieldContextProps<T> {
  readonly fieldContext?: FieldContext<T>;
}

/**
 * Creates a typed key that a field host and its controls share. A factory keeps
 * independently typed and nested field trees isolated without erasing T.
 */
export function createFieldContextKey<T>(
  description = "semi-ui-vue-field-context",
): InjectionKey<FieldContext<T>> {
  return Symbol(description);
}
