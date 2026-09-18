import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconPause = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M4.5 4.75C4.5 3.23122 5.73122 2 7.25 2C8.76878 2 10 3.23122 10 4.75V19.25C10 20.7688 8.76878 22 7.25 22C5.73122 22 4.5 20.7688 4.5 19.25V4.75Z`}
          fill={`currentColor`}
        />
        <path
          d={`M14 4.75C14 3.23122 15.2312 2 16.75 2C18.2688 2 19.5 3.23122 19.5 4.75V19.25C19.5 20.7688 18.2688 22 16.75 22C15.2312 22 14 20.7688 14 19.25V4.75Z`}
          fill={`currentColor`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconPause;
