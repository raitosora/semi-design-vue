import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconToken = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
  (props) => {
    const attrs = useAttrs();
    const prefix = useSvgIdPrefix();
    return (
      <svg
        color={props.color}
        fill={`none`}
        viewBox={`0 0 20 20`}
        xmlns={`http://www.w3.org/2000/svg`}
        {...definedSvgAttrs(attrs)}
        height={svgDimension(props.height, props.size, "16px")}
        width={svgDimension(props.width, props.size, "16px")}
      >
        <rect fill={`#F0B114`} height={`8`} rx={`4`} width={`8`} />
        <rect fill={`#E91E63`} height={`8`} rx={`4`} width={`8`} y={`10`} />
        <rect fill={`#0077FA`} height={`8`} rx={`4`} width={`8`} x={`10`} />
        <rect
          fill={`#00B3A1`}
          height={`8`}
          rx={`4`}
          width={`8`}
          x={`10`}
          y={`10`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconToken;
