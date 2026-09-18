import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconColumnsStroked =
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
            d={`M4 5C4 3.89543 4.89543 3 6 3H9C10.1046 3 11 3.89543 11 5V19C11 20.1046 10.1046 21 9 21H6C4.89543 21 4 20.1046 4 19V5ZM9 5H6V19H9V5Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M13 5C13 3.89543 13.8954 3 15 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H15C13.8954 21 13 20.1046 13 19V5ZM18 5H15V19H18V5Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconColumnsStroked;
