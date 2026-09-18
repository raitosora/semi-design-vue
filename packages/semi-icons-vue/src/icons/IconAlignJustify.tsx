import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconAlignJustify =
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
            clip-rule={`evenodd`}
            d={`M3.36364 3C2.61052 3 2 3.67157 2 4.5C2 5.32843 2.61052 6 3.36364 6H20.6364C21.3895 6 22 5.32843 22 4.5C22 3.67157 21.3895 3 20.6364 3H3.36364ZM3.36364 8C2.61052 8 2 8.67157 2 9.5C2 10.3284 2.61052 11 3.36364 11H20.6364C21.3895 11 22 10.3284 22 9.5C22 8.67157 21.3895 8 20.6364 8H3.36364ZM2 14.5C2 13.6716 2.61052 13 3.36364 13H20.6364C21.3895 13 22 13.6716 22 14.5C22 15.3284 21.3895 16 20.6364 16H3.36364C2.61052 16 2 15.3284 2 14.5ZM3.36364 18C2.61052 18 2 18.6716 2 19.5C2 20.3284 2.61052 21 3.36364 21H20.6364C21.3895 21 22 20.3284 22 19.5C22 18.6716 21.3895 18 20.6364 18H3.36364Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconAlignJustify;
