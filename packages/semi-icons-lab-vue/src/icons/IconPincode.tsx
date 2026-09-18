import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconPincode =
  /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
    (props) => {
      const attrs = useAttrs();
      const prefix = useSvgIdPrefix();
      return (
        <svg
          color={props.color}
          fill={`none`}
          viewBox={`0 0 22 16`}
          xmlns={`http://www.w3.org/2000/svg`}
          {...definedSvgAttrs(attrs)}
          height={svgDimension(props.height, props.size, "16px")}
          width={svgDimension(props.width, props.size, "16px")}
        >
          <rect fill={`#4CC3FA`} height={`16`} rx={`2`} width={`22`} />
          <rect
            fill={`white`}
            height={`8`}
            rx={`1`}
            width={`16`}
            x={`3`}
            y={`4`}
          />
          <circle cx={`6.5`} cy={`8`} fill={`#4CC3FA`} r={`1`} />
          <circle cx={`9.5`} cy={`8`} fill={`#4CC3FA`} r={`1`} />
          <circle cx={`12.5`} cy={`8`} fill={`#4CC3FA`} r={`1`} />
          <circle cx={`15.5`} cy={`8`} fill={`#4CC3FA`} r={`1`} />
          <path
            d={`M3 7V4.5C3 4.22386 3.22386 4 3.5 4H6`}
            stroke={`#F8CE27`}
            stroke-linecap={`square`}
            stroke-linejoin={`round`}
            stroke-width={`1.5`}
          />
          <path
            d={`M19 9V11.5C19 11.7761 18.7761 12 18.5 12H16`}
            stroke={`#F8CE27`}
            stroke-linecap={`square`}
            stroke-linejoin={`round`}
            stroke-width={`1.5`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconPincode;
