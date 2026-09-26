import {
  computed,
  defineVaporComponent,
  useAttrs,
  useSlots,
  watchPostEffect,
  ref,
} from "vue";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { selectStroke } from "./color.js";
import { clampPercent, finitePercent, usePercentNumber } from "./percent.js";
import type { ProgressProps, ProgressSlots } from "./types.js";

const builtins = Object.freeze({
  className: "",
  direction: "horizontal" as const,
  format: (percent: number) => `${percent}%`,
  indeterminate: false,
  motion: true,
  percent: 0,
  showInfo: false,
  size: "default" as const,
  strokeGradient: false,
  strokeLinecap: "round" as const,
  strokeWidth: 4,
  style: {},
  type: "line" as const,
});

const Component = defineVaporComponent<ProgressProps, {}, string, {}>(
  (props: ProgressProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const resolver = createDefaultPropsResolver(
      semiGlobal,
      "Progress",
      builtins,
    );
    const resolved = computed(() =>
      resolver.resolve(
        Object.fromEntries(
          [
            ...Object.entries(props),
            ...Object.entries(attrs).filter(([key]) => key.startsWith("data-")),
          ]
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [
              {
                ariaLabel: "aria-label",
                ariaLabelledby: "aria-labelledby",
                ariaValuetext: "aria-valuetext",
              }[key] ?? key,
              value,
            ]),
        ),
      ),
    );
    const percentNumber = usePercentNumber(resolved);
    const percent = computed(() =>
      clampPercent(finitePercent(resolved.value.percent)),
    );
    const displayed = computed(() => clampPercent(percentNumber.value));
    const line = computed(() => resolved.value.type === "line");
    const indeterminate = computed(() => resolved.value.indeterminate);
    const horizontal = computed(
      () => resolved.value.direction === "horizontal",
    );
    const color = computed(() =>
      selectStroke(
        resolved.value.stroke,
        finitePercent(resolved.value.percent),
        Boolean(resolved.value.strokeGradient),
      ),
    );
    const width = computed(() => {
      const requested = resolved.value.width;
      return requested && Number.isFinite(requested)
        ? requested
        : resolved.value.size === "default"
          ? 72
          : 24;
    });
    const strokeWidth = computed(() =>
      Number.isFinite(resolved.value.strokeWidth)
        ? resolved.value.strokeWidth
        : 4,
    );
    const radius = computed(() => (width.value - strokeWidth.value!) / 2);
    const circumference = computed(() => radius.value * 2 * Math.PI);
    const showInfo = computed(
      () =>
        resolved.value.showInfo &&
        !indeterminate.value &&
        (line.value || resolved.value.size !== "small"),
    );
    const data = () =>
      Object.fromEntries(
        Object.entries(resolved.value).filter(([key]) =>
          key.startsWith("data-"),
        ),
      );
    const trackRef = ref<SVGCircleElement>();
    const ringRef = ref<SVGCircleElement>();
    watchPostEffect(() => {
      // The pinned JSX compiler treats SVG style objects as attributes.
      // Native CSS setters retain property isolation and inline precedence.
      if (trackRef.value)
        trackRef.value.style.stroke = resolved.value.orbitStroke ?? "";
      if (ringRef.value) ringRef.value.style.stroke = color.value ?? "";
    });
    const scalar = () => {
      const value = resolved.value.format?.(displayed.value);
      return typeof value === "boolean" ? null : value;
    };
    return (
      <div
        {...data()}
        aria-label={resolved.value["aria-label"]}
        aria-labelledby={resolved.value["aria-labelledby"]}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={
          indeterminate.value
            ? undefined
            : line.value
              ? percent.value
              : displayed.value
        }
        aria-valuetext={resolved.value["aria-valuetext"]}
        class={[
          line.value ? "semi-progress" : "semi-progress-circle",
          attrs.class,
          resolved.value.className,
          line.value &&
            (horizontal.value
              ? "semi-progress-horizontal"
              : "semi-progress-vertical"),
          line.value &&
            resolved.value.size === "large" &&
            "semi-progress-large",
          line.value && indeterminate.value && "semi-progress-indeterminate",
        ]}
        id={resolved.value.id}
        role="progressbar"
        style={resolved.value.style}
      >
        {line.value ? (
          <div
            aria-hidden="true"
            class="semi-progress-track"
            style={{ backgroundColor: resolved.value.orbitStroke }}
          >
            <div
              aria-hidden="true"
              class={[
                "semi-progress-track-inner",
                indeterminate.value &&
                  "semi-progress-track-inner-indeterminate",
              ]}
              style={{
                background: color.value,
                ...(!indeterminate.value
                  ? horizontal.value
                    ? { width: `${percent.value}%` }
                    : { height: `${percent.value}%` }
                  : {}),
              }}
            />
          </div>
        ) : (
          <svg
            aria-hidden="true"
            class="semi-progress-circle-ring"
            height={width.value}
            width={width.value}
          >
            <circle
              aria-hidden="true"
              class="semi-progress-circle-ring-track"
              cx={width.value / 2}
              cy={width.value / 2}
              fill="transparent"
              r={radius.value}
              ref={trackRef}
              stroke-dasharray={`${circumference.value} ${circumference.value}`}
              stroke-dashoffset={0}
              stroke-linecap={resolved.value.strokeLinecap}
              stroke-width={strokeWidth.value}
            />
            <circle
              aria-hidden="true"
              class={`semi-progress-circle-ring-inner${indeterminate.value ? " semi-progress-circle-ring-inner-indeterminate" : ""}`}
              cx={width.value / 2}
              cy={width.value / 2}
              fill="transparent"
              r={radius.value}
              ref={ringRef}
              stroke-dasharray={
                indeterminate.value
                  ? `${circumference.value * 0.3} ${circumference.value}`
                  : `${circumference.value} ${circumference.value}`
              }
              stroke-dashoffset={
                indeterminate.value
                  ? 0
                  : (1 - percent.value / 100) * circumference.value
              }
              stroke-linecap={resolved.value.strokeLinecap}
              stroke-width={strokeWidth.value}
            />
          </svg>
        )}
        {showInfo.value ? (
          line.value ? (
            <div class="semi-progress-line-text">
              {slots.format ? (
                <slot name="format" percent={displayed} />
              ) : (
                scalar()
              )}
            </div>
          ) : (
            <span class="semi-progress-circle-text">
              {slots.format ? (
                <slot name="format" percent={displayed} />
              ) : (
                scalar()
              )}
            </span>
          )
        ) : null}
      </div>
    );
  },
  {
    props: [
      "aria-label",
      "aria-labelledby",
      "aria-valuetext",
      "className",
      "direction",
      "format",
      "id",
      "indeterminate",
      "motion",
      "orbitStroke",
      "percent",
      "showInfo",
      "size",
      "stroke",
      "strokeGradient",
      "strokeLinecap",
      "strokeWidth",
      "style",
      "type",
      "width",
    ],
    inheritAttrs: false,
  },
);
export const Progress = Object.assign(Component, {
  __SemiComponentName__: "Progress" as const,
}) as typeof Component & {
  new (props: ProgressProps): { $props: ProgressProps; $slots: ProgressSlots };
  readonly __SemiComponentName__: "Progress";
};
export default Progress;
