import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTimePicker =
  /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
    (props) => {
      const attrs = useAttrs();
      const prefix = useSvgIdPrefix();
      return (
        <svg
          color={props.color}
          fill={`none`}
          viewBox={`0 0 24 24`}
          xmlns={`http://www.w3.org/2000/svg`}
          {...definedSvgAttrs(attrs)}
          height={svgDimension(props.height, props.size, "16px")}
          width={svgDimension(props.width, props.size, "16px")}
        >
          <circle
            cx={`12`}
            cy={`12`}
            fill={`white`}
            r={`10.25`}
            stroke={`#AAB2BF`}
            stroke-width={`1.5`}
          />
          <path
            d={`M14.5 6.5L12 12L17 17.5`}
            stroke={`#6A6F7F`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2.5`}
          />
          <circle cx={`12`} cy={`12`} fill={`#324350`} r={`2`} />
          <path
            d={`M13 11.625L12 12L5 15`}
            stroke={`#FBCD2C`}
            stroke-linecap={`round`}
          />
          <circle cx={`12`} cy={`12`} fill={`#FBCD2C`} r={`1`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconTimePicker;
