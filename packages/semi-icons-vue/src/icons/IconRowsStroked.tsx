import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconRowsStroked =
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
            d={`M19 4C20.1046 4 21 4.89543 21 6L21 9C21 10.1046 20.1046 11 19 11L5 11C3.89543 11 3 10.1046 3 9L3 6C3 4.89543 3.89543 4 5 4L19 4ZM19 9L19 6L5 6L5 9L19 9Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M19 13C20.1046 13 21 13.8954 21 15L21 18C21 19.1046 20.1046 20 19 20L5 20C3.89543 20 3 19.1046 3 18L3 15C3 13.8954 3.89543 13 5 13L19 13ZM19 18L19 15L5 15L5 18L19 18Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconRowsStroked;
