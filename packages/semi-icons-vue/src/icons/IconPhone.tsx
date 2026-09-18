import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconPhone = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M8 0.5C6.34315 0.5 5 1.84315 5 3.5V20.5C5 22.1569 6.34315 23.5 8 23.5H16C17.6569 23.5 19 22.1569 19 20.5V3.5C19 1.84315 17.6569 0.5 16 0.5H8ZM12 18C10.8954 18 10 18.8954 10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20C14 18.8954 13.1046 18 12 18Z`}
          fill={`currentColor`}
          fill-rule={`evenodd`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconPhone;
