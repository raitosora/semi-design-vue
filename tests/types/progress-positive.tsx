import type { Ref } from "vue";
import { Progress } from "../../packages/semi-ui-vue/src/index";
import ProgressSubpath, {
  type ProgressProps,
  type ProgressSlots,
  type ProgressMotion,
  type ProgressFormat,
  type ProgressStroke,
} from "../../packages/semi-ui-vue/src/components/progress/index";
const format: ProgressFormat = (percent) => (percent > 0 ? percent : null);
const stroke: ProgressStroke = [
  { percent: 0, color: "#fff" },
  { percent: 100, color: "#000" },
];
const motion: ProgressMotion = () => ({ duration: 1 });
// Motion options are opaque truthiness inputs, so known key shapes are not validated.
const opaqueMotion: ProgressMotion = { state: 1, onStart: 1 };
const recordMotion: Record<string, unknown> = { duration: 300 };
const recordMotionCallback = (
  options: Record<string, unknown>,
): Record<string, unknown> => ({ ...options, duration: 300 });
const recordMotionValue: ProgressMotion = recordMotion;
const recordCallbackValue: ProgressMotion = recordMotionCallback;
const slots: ProgressSlots = {
  format: ({ percent }) => {
    const value: Readonly<Ref<number>> = percent;
    return <b>{value.value}</b>;
  },
};
const props: ProgressProps = {
  percent: 22.5,
  direction: "vertical",
  size: "large",
  type: "circle",
  strokeLinecap: "square",
  strokeWidth: 8,
  width: 90,
  stroke,
  strokeGradient: true,
  orbitStroke: "transparent",
  style: { color: "red" },
  className: "p",
  class: ["a"],
  "aria-label": "Upload",
  "aria-labelledby": "label",
  "aria-valuetext": "quarter",
  "data-": "bare",
  motion,
  format,
  showInfo: true,
  indeterminate: false,
  id: "p",
};
const positive = (
  <>
    <Progress {...props} />
    <ProgressSubpath motion={opaqueMotion} />
    <ProgressSubpath motion={recordMotionValue} />
    <ProgressSubpath motion={recordCallbackValue} />
    <ProgressSubpath motion={false} v-slots={slots} />
    <ProgressSubpath
      format={undefined}
      motion={undefined}
      percent={undefined}
    />
  </>
);
void positive;
