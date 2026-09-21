/** The six named breakpoints supported by Semi configuration. */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type ResponsiveMap = Readonly<Record<Breakpoint, string>>;
export type BreakpointScreens = Readonly<Record<Breakpoint, boolean>>;
export type OnBreakpointScreensCallback = (screens: BreakpointScreens) => void;
export type OnBreakpointChangeCallback = (
  screen: Breakpoint,
  match: boolean,
) => void;
export interface OnBreakpoint {
  (callback: OnBreakpointScreensCallback): () => void;
  (
    breakpoints: readonly Breakpoint[],
    callback: OnBreakpointChangeCallback,
  ): () => void;
}
export interface ResponsiveConfig {
  readonly responsiveMap?: ResponsiveMap | undefined;
  readonly onBreakpoint?: OnBreakpoint | undefined;
  readonly screens?: BreakpointScreens | undefined;
}
