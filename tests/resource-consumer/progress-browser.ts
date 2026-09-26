import { Progress } from "semi-ui-vue";
// @ts-expect-error Progress types are exported from the component subpath only.
import type { ProgressProps as RootProps } from "semi-ui-vue";
import SubpathProgress, {
  Progress as NamedProgress,
  type ProgressProps,
  type ProgressSlots,
  type ProgressMotion,
} from "semi-ui-vue/progress";
const identity: typeof Progress = SubpathProgress;
const namedIdentity: typeof Progress = NamedProgress;

const props: ProgressProps = {
  percent: -1.25,
  type: "circle",
  size: "large",
  direction: "vertical",
  indeterminate: false,
  motion: { duration: 20 },
  showInfo: true,
  stroke: [
    { percent: 0, color: "red" },
    { percent: 100, color: "blue" },
  ],
  strokeGradient: true,
  strokeLinecap: "square",
  strokeWidth: 5,
  width: 0,
  orbitStroke: "#ddd",
  format: (percent) => `${percent}%`,
  className: "consumer-progress",
  style: { width: "100px" },
  id: "consumer-progress",
  "aria-label": "Upload",
  "aria-labelledby": "label",
  "aria-valuetext": "Half",
};
const scalarFormats: ProgressProps[] = [
  { format: () => 0 },
  { format: () => false },
  { format: () => null },
  { format: () => undefined },
];
const defaults: ProgressProps = {
  percent: undefined,
  type: undefined,
  size: undefined,
  direction: undefined,
  motion: undefined,
  showInfo: undefined,
  format: undefined,
};
const slots: ProgressSlots = {
  format: ({ percent }) => {
    const value: number = percent.value;
    // @ts-expect-error Scoped percent is readonly.
    percent.value = 50;
    return document.createTextNode(String(value));
  },
};
// @ts-expect-error Progress has no status API.
const status: ProgressProps = { status: "success" };
// @ts-expect-error Only line/circle are supported.
const type: ProgressProps = { type: "dashboard" };
// @ts-expect-error Percent remains a number.
const percent: ProgressProps = { percent: "50" };
// @ts-expect-error Upstream has three sizes.
const size: ProgressProps = { size: "mini" };
// @ts-expect-error Only round/square linecaps are supported.
const cap: ProgressProps = { strokeLinecap: "butt" };
// @ts-expect-error Structured content uses the owned format slot.
const node: ProgressProps = { format: () => document.createElement("b") };
// @ts-expect-error No default content slot exists.
const children: ProgressSlots = { default: () => [] };
// @ts-expect-error Async slots are not Vapor render results.
const asyncSlot: ProgressSlots = { format: async () => [] };
// @ts-expect-error No native click listener is part of the filtered root contract.
const click: ProgressProps = { onClick: () => {} };
void [
  identity,
  namedIdentity,
  props,
  scalarFormats,
  defaults,
  slots,
  status,
  type,
  percent,
  size,
  cap,
  node,
  children,
  asyncSlot,
  click,
];

const rejectedRootType: RootProps = {};
void rejectedRootType;

// Motion option contents are opaque: runtime uses only truthiness.
const opaqueMotion: ProgressMotion = { state: 1, onStart: 1 };
const indexedMotionOptions: Record<string, unknown> = { duration: 200 };
const indexedMotion: ProgressMotion = indexedMotionOptions;
const indexedMotionFunction: ProgressMotion = (
  options: Record<string, unknown>,
) => options;
interface DeclaredMotionOptions {
  duration: number;
}
const declaredMotionOptions: DeclaredMotionOptions = { duration: 200 };
// @ts-expect-error Interface options without a string index are outside this adapter type.
const unindexedMotion: ProgressMotion = declaredMotionOptions;
// @ts-expect-error Callback input cannot narrow the opaque Record parameter to percent.
const narrowMotion: ProgressMotion = (options: { percent: number }) => ({
  duration: options.percent,
});
// @ts-expect-error Callback results must satisfy Record, not an unindexed interface.
const unindexedMotionResult: ProgressMotion = () => declaredMotionOptions;
void [
  opaqueMotion,
  indexedMotion,
  indexedMotionFunction,
  unindexedMotion,
  narrowMotion,
  unindexedMotionResult,
];
