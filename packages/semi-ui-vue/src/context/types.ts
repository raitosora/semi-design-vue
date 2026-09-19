import type { InjectionKey, Ref } from "vue";
import type { Locale } from "../locale/interface.js";

/** Extend this interface as public component prop types become available. */
export interface SemiComponentProps {}

export type DefaultProps<P> = Readonly<{ [K in keyof P]?: P[K] | undefined }>;

export type SemiGlobalConfig<C extends object = SemiComponentProps> = Readonly<{
  overrideDefaultProps?:
    | Readonly<{
        [K in keyof C]?:
          | (C[K] extends object ? DefaultProps<C[K]> : never)
          | undefined;
      }>
    | undefined;
}>;

export interface SemiGlobal<C extends object = SemiComponentProps> {
  readonly config: SemiGlobalConfig<C>;
  readonly configure: (config: SemiGlobalConfig<C>) => void;
}

export type Direction = "ltr" | "rtl";
export interface DateSettings {
  readonly timeZone?: string | number | undefined;
}
export type ContainerResolver = () => HTMLElement | undefined;

/** The only application context fields exposed to Semi foundations. */
export interface SemiContext {
  readonly locale: Locale | undefined;
  readonly config: SemiGlobalConfig | undefined;
  readonly direction: Direction | undefined;
  readonly date: DateSettings | undefined;
  readonly container?: ContainerResolver | undefined;
}

/** Own keys are meaningful: an own `undefined` deliberately clears an inherited value. */
export interface SemiContextInput {
  readonly locale?: Locale | undefined;
  readonly config?: SemiGlobalConfig | undefined;
  readonly direction?: Direction | undefined;
  readonly date?: DateSettings | undefined;
  readonly container?: ContainerResolver | undefined;
}

export type SemiContextSource = Readonly<Ref<SemiContext>>;
export type SemiContextKey = InjectionKey<SemiContextSource>;

export interface StaticContext {
  get(): SemiContext | undefined;
  dispose(): void;
}
