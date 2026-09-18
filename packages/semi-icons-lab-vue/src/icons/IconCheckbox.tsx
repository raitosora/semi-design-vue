import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCheckbox =
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
            fill={`#4CC3FA`}
            height={`20`}
            rx={`3`}
            transform={`rotate(-6 1.00949 3.10003)`}
            width={`20`}
            x={`1.009`}
            y={`3.1`}
          />
          <path
            d={`M8.07416 12.9153L11.4236 16.0826L15.6645 8.59828`}
            stroke={`white`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`3`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconCheckbox;
