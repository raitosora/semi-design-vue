import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSideSheet =
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
          <path
            d={`M2 5C2 3.34315 3.34315 2 5 2H14V22H5C3.34315 22 2 20.6569 2 19V5Z`}
            fill={`#DDE3E8`}
          />
          <path
            d={`M14 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H14V2Z`}
            fill={`#4CC3FA`}
          />
          <rect
            fill={`#AAB2BF`}
            height={`8`}
            rx={`1`}
            width={`2`}
            x={`11`}
            y={`8`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconSideSheet;
