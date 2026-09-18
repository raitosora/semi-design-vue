import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSpace = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          fill={`#DDE3E8`}
          height={`20`}
          rx={`1`}
          width={`2`}
          x={`1`}
          y={`2`}
        />
        <rect
          fill={`#DDE3E8`}
          height={`20`}
          rx={`1`}
          width={`2`}
          x={`21`}
          y={`2`}
        />
        <path
          d={`M6 12L18 12`}
          stroke={`#4CC3FA`}
          stroke-linecap={`round`}
          stroke-width={`2`}
        />
        <path
          d={`M15 9L18 12L15 15`}
          stroke={`#4CC3FA`}
          stroke-linecap={`round`}
          stroke-linejoin={`round`}
          stroke-width={`2`}
        />
        <path
          d={`M9 9L6 12L9 15`}
          stroke={`#4CC3FA`}
          stroke-linecap={`round`}
          stroke-linejoin={`round`}
          stroke-width={`2`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconSpace;
