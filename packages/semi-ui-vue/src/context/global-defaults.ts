import type {
  DefaultProps,
  SemiComponentProps,
  SemiGlobal,
  SemiGlobalConfig,
} from "./types.js";

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}

/**
 * A process-wide default registry. `configure` replaces the configuration so a
 * caller cannot mutate a configuration that existing instances captured.
 */
export function createSemiGlobal<
  C extends object = SemiComponentProps,
>(): SemiGlobal<C> {
  let current: SemiGlobalConfig<C> = freeze({});
  return Object.freeze({
    get config() {
      return current;
    },
    configure(config: SemiGlobalConfig<C>) {
      const overrides = Object.hasOwn(config, "overrideDefaultProps")
        ? config.overrideDefaultProps
        : undefined;
      const copiedOverrides = overrides
        ? (freeze(
            Object.fromEntries(
              Reflect.ownKeys(overrides).map((name) => {
                const props = (
                  overrides as Record<PropertyKey, object | undefined>
                )[name];
                return [
                  name,
                  props === undefined ? undefined : freeze({ ...props }),
                ];
              }),
            ),
          ) as SemiGlobalConfig<C>["overrideDefaultProps"])
        : undefined;
      current = freeze({
        ...config,
        ...(copiedOverrides ? { overrideDefaultProps: copiedOverrides } : {}),
      });
    },
  });
}

export const semiGlobal = createSemiGlobal();

export interface DefaultPropsResolver<P extends object> {
  readonly resolve: (rawProps: DefaultProps<P>) => DefaultProps<P>;
}

/**
 * Captures the named global override when an instance is created. Raw caller
 * props remain live, so an own caller key always wins, including `undefined`.
 */
export function createDefaultPropsResolver<C extends object, N extends keyof C>(
  global: SemiGlobal<C>,
  componentName: N,
  builtins: DefaultProps<C[N]>,
): DefaultPropsResolver<C[N] extends object ? C[N] : never> {
  type Props = C[N] extends object ? C[N] : never;
  const override = global.config.overrideDefaultProps?.[componentName] as
    | Readonly<Record<PropertyKey, unknown>>
    | undefined;
  const capturedBuiltins = freeze({ ...builtins });
  const capturedOverride = override ? freeze({ ...override }) : undefined;
  return Object.freeze({
    resolve(rawProps: DefaultProps<Props>) {
      const result: Record<PropertyKey, unknown> = Object.create(null);
      for (const key of Reflect.ownKeys(capturedBuiltins)) {
        result[key] = (capturedBuiltins as Record<PropertyKey, unknown>)[key];
      }
      if (capturedOverride) {
        for (const key of Reflect.ownKeys(capturedOverride))
          result[key] = capturedOverride[key];
      }
      for (const key of Reflect.ownKeys(rawProps)) {
        if (Object.hasOwn(rawProps, key)) {
          result[key] = (rawProps as Record<PropertyKey, unknown>)[key];
        }
      }
      return freeze(result) as DefaultProps<Props>;
    },
  });
}
