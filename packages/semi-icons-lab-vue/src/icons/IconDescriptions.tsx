import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconDescriptions =
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
            fill={`white`}
            height={`18.5`}
            rx={`3`}
            stroke={`#AAB2BF`}
            stroke-width={`1.5`}
            width={`18.5`}
            x={`2.75`}
            y={`2.75`}
          />
          <rect fill={`#AAB2BF`} height={`2`} width={`4`} x={`5`} y={`6`} />
          <rect fill={`#AAB2BF`} height={`2`} width={`4`} x={`5`} y={`11`} />
          <rect fill={`#AAB2BF`} height={`2`} width={`2`} x={`5`} y={`16`} />
          <rect fill={`#324350`} height={`2`} width={`4`} x={`11`} y={`11`} />
          <rect fill={`#324350`} height={`2`} width={`8`} x={`11`} y={`16`} />
          <rect fill={`#324350`} height={`2`} width={`8`} x={`11`} y={`6`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconDescriptions;
