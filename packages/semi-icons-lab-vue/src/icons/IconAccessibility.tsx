import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconAccessibility =
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
          <circle cx={`12`} cy={`4`} fill={`#4CC3FA`} r={`3`} />
          <path
            clip-rule={`evenodd`}
            d={`M2 9.5C2 8.67157 2.67157 8 3.5 8H8H16H20.5C21.3284 8 22 8.67157 22 9.5C22 10.3284 21.3284 11 20.5 11H16V15.5V17V21.5C16 22.3284 15.3284 23 14.5 23C13.6716 23 13 22.3284 13 21.5V17C13 16.4477 12.5523 16 12 16C11.4477 16 11 16.4477 11 17V21.5C11 22.3284 10.3284 23 9.5 23C8.67157 23 8 22.3284 8 21.5V17V15.5V11H3.5C2.67157 11 2 10.3284 2 9.5Z`}
            fill={`#6A6F7F`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconAccessibility;
