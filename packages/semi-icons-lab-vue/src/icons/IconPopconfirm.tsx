import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconPopconfirm =
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
          <rect
            fill={`#AAB2BF`}
            height={`14`}
            rx={`2`}
            width={`17`}
            x={`5`}
            y={`8`}
          />
          <path
            d={`M8.46515 2.29217C8.23247 1.90171 7.66701 1.90171 7.43432 2.29217L5.82062 5H4C2.89543 5 2 5.89543 2 7V17C2 18.1046 2.89543 19 4 19H17C18.1046 19 19 18.1046 19 17V7C19 5.89543 18.1046 5 17 5H10.0789L8.46515 2.29217Z`}
            fill={`#DDE3E8`}
          />
          <rect
            fill={`#4CC3FA`}
            height={`3`}
            rx={`1`}
            width={`4`}
            x={`7`}
            y={`13`}
          />
          <rect
            fill={`#324350`}
            height={`3`}
            rx={`1`}
            width={`4`}
            x={`13`}
            y={`13`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconPopconfirm;
