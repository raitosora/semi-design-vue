import type { Ref, VaporRenderResult } from "vue";
import type { Direction, ContainerResolver } from "../../context/types.js";
import type { Locale } from "../../locale/interface.js";
import type {
  ResponsiveMap,
  BreakpointScreens,
  OnBreakpoint,
} from "./responsiveTypes.js";

export interface ConfigProviderSlots {
  default?: () => VaporRenderResult;
}
export interface ConfigProviderProps {
  // Override Vue's implicit AllowedComponentProps: these attrs are not forwarded.
  readonly class?: never;
  readonly style?: never;
  readonly locale?: Locale | undefined;
  readonly timeZone?: string | number | undefined;
  readonly direction?: Direction | undefined;
  readonly getPopupContainer?: ContainerResolver | undefined;
  readonly responsiveMap?: ResponsiveMap | undefined;
  readonly responsiveObserve?: boolean | undefined;
  readonly "v-slots"?:
    | ConfigProviderSlots
    | ConfigProviderSlots["default"]
    | undefined;
}
export interface ConfigContextValue {
  readonly locale: Locale | undefined;
  readonly timeZone: string | number | undefined;
  readonly direction: Direction | undefined;
  readonly getPopupContainer: ContainerResolver | undefined;
  readonly responsiveMap: ResponsiveMap;
  readonly responsiveObserve: boolean;
  readonly screens: Readonly<BreakpointScreens>;
  readonly onBreakpoint: OnBreakpoint | undefined;
}
export type ConfigContextSource = Readonly<Ref<ConfigContextValue>>;
export interface ConfigConsumerSlots {
  default?: (scope: {
    readonly config: ConfigContextSource;
  }) => VaporRenderResult;
}
export interface ConfigConsumerProps {
  readonly class?: never;
  readonly style?: never;
  readonly "v-slots"?:
    | ConfigConsumerSlots
    | ConfigConsumerSlots["default"]
    | undefined;
}
