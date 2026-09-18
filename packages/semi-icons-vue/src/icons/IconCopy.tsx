import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCopy = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M7 4C7 2.89543 7.89543 2 9 2H20C21.1046 2 22 2.89543 22 4V15C22 16.1046 21.1046 17 20 17H19V8C19 6 18 5 16 5H7V4Z`}
          fill={`currentColor`}
        />
        <path
          d={`M5 7C3.89543 7 3 7.89543 3 9V19C3 20.1046 3.89543 21 5 21H15C16.1046 21 17 20.1046 17 19V9C17 7.89543 16.1046 7 15 7H5Z`}
          fill={`currentColor`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconCopy;
