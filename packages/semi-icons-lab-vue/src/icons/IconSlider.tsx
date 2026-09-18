import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSlider =
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
            height={`2`}
            rx={`1`}
            width={`17`}
            x={`5`}
            y={`4`}
          />
          <rect
            fill={`#4CC3FA`}
            height={`2`}
            rx={`1`}
            width={`18`}
            x={`2`}
            y={`11`}
          />
          <rect
            fill={`#AAB2BF`}
            height={`2`}
            rx={`1`}
            width={`17`}
            x={`5`}
            y={`18`}
          />
          <circle cx={`5.5`} cy={`5`} fill={`#DDE3E8`} r={`3.5`} />
          <circle cx={`18.5`} cy={`12`} fill={`#DDE3E8`} r={`3.5`} />
          <circle cx={`5.5`} cy={`19`} fill={`#DDE3E8`} r={`3.5`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconSlider;
