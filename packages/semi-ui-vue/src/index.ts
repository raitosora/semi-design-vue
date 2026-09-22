export * from "./infrastructure.js";
export { Icon } from "./components/icons/index.js";
export type {
  IconProps,
  IconSize,
  IconSlots,
  IconSvgScope,
  IconHandle,
} from "./components/icons/index.js";

export {
  ConfigProvider,
  ConfigConsumer,
  useConfigContext,
} from "./components/configProvider/index.js";
export type {
  ConfigProviderProps,
  ConfigProviderSlots,
  ConfigConsumerProps,
  ConfigConsumerSlots,
  ConfigContextValue,
  ConfigContextSource,
  ResponsiveMap,
  BreakpointScreens,
  Breakpoint,
  OnBreakpointScreensCallback,
  OnBreakpointChangeCallback,
  OnBreakpoint,
  ResponsiveConfig,
} from "./components/configProvider/index.js";

export {
  LocaleProvider,
  LocaleConsumer,
  useLocaleContext,
} from "./components/locale/index.js";
export type {
  LocaleProviderProps,
  LocaleProviderSlots,
  LocaleConsumerProps,
  LocaleConsumerSlots,
  LocaleContextValue,
  LocaleContextSource,
} from "./components/locale/index.js";

export { Spin } from "./components/spin/index.js";
export type {
  SpinProps,
  SpinSize,
  SpinSlots,
} from "./components/spin/index.js";
