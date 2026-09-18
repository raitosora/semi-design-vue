import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconInput = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
        <path
          d={`M12 8.5C12 8.5 12.5 6 11 4C9.5 2 8 2 8 2`}
          stroke={`#AAB2BF`}
          stroke-linecap={`round`}
          stroke-width={`2`}
        />
        <rect
          fill={`#DDE3E8`}
          height={`15`}
          rx={`2`}
          width={`22`}
          x={`1`}
          y={`6`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`3`}
          y={`8`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`8`}
          y={`8`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`13`}
          y={`8`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`18`}
          y={`8`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`3`}
          y={`12`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`8`}
          y={`12`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`13`}
          y={`12`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`3`}
          rx={`1.5`}
          width={`3`}
          x={`18`}
          y={`12`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`2`}
          rx={`1`}
          width={`12`}
          x={`6`}
          y={`17`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconInput;
