import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconOverflow =
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
            fill={`#DDE3E8`}
            height={`16`}
            rx={`3`}
            width={`22`}
            x={`1`}
            y={`4`}
          />
          <circle cx={`6`} cy={`12`} fill={`#6A6F7F`} r={`2`} />
          <circle cx={`12`} cy={`12`} fill={`#6A6F7F`} r={`2`} />
          <circle cx={`18`} cy={`12`} fill={`#6A6F7F`} r={`2`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconOverflow;
