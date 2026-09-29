import { computed, defineVaporComponent, shallowRef, watchEffect } from "vue";
import type { ArrowProps } from "./types.js";
export const Arrow = defineVaporComponent<ArrowProps>(
  (props) => {
    const vertical = computed(() => /^(top|bottom)/.test(props.position ?? ""));
    const borderPath = shallowRef<SVGPathElement | null>(null);
    const backgroundPath = shallowRef<SVGPathElement | null>(null);
    const border = computed(() => ({
      fill:
        props.arrowStyle?.borderColor === undefined
          ? props.popStyle?.borderColor
          : props.arrowStyle.borderColor,
      opacity: props.arrowStyle?.borderOpacity,
    }));
    const background = computed(() => ({
      fill:
        props.arrowStyle?.backgroundColor === undefined
          ? props.popStyle?.backgroundColor
          : props.arrowStyle.backgroundColor,
    }));
    watchEffect(() => {
      if (borderPath.value) {
        borderPath.value.style.fill = String(border.value.fill ?? "");
        borderPath.value.style.opacity = String(border.value.opacity ?? "");
      }
      if (backgroundPath.value)
        backgroundPath.value.style.fill = String(background.value.fill ?? "");
    });
    return (
      <svg
        aria-hidden="true"
        class={["semi-popover-icon-arrow", props.className]
          .filter(Boolean)
          .join(" ")}
        height="8"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={
            vertical.value
              ? "M0 0.5L0 1.5C4 1.5, 5.5 3, 7.5 5S10,8 12,8S14.5 7, 16.5 5S20,1.5 24,1.5L24 0.5L0 0.5z"
              : "M0.5 0L1.5 0C1.5 4, 3 5.5, 5 7.5S8,10 8,12S7 14.5, 5 16.5S1.5,20 1.5,24L0.5 24L0.5 0z"
          }
          ref={borderPath}
        />
        <path
          d={
            vertical.value
              ? "M0 0L0 1C4 1, 5.5 2, 7.5 4S10,7 12,7S14.5 6, 16.5 4S20,1 24,1L24 0L0 0z"
              : "M0 0L1 0C1 4, 2 5.5, 4 7.5S7,10 7,12S6 14.5, 4 16.5S1,20 1,24L0 24L0 0z"
          }
          ref={backgroundPath}
        />
      </svg>
    );
  },
  {
    props: ["position", "className", "arrowStyle", "popStyle"],
    inheritAttrs: false,
  },
);
