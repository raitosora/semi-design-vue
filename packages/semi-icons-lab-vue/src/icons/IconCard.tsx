import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCard = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          height={`16`}
          rx={`2`}
          width={`22`}
          x={`1`}
          y={`4`}
        />
        <rect fill={`#AAB2BF`} height={`4`} width={`14`} x={`5`} y={`8`} />
        <rect fill={`#AAB2BF`} height={`2`} width={`8`} x={`5`} y={`14`} />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconCard;
