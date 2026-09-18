import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconComponent =
  /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
    (props) => {
      const attrs = useAttrs();
      const prefix = useSvgIdPrefix();
      return (
        <svg
          color={props.color}
          fill={`none`}
          viewBox={`0 0 22 22`}
          xmlns={`http://www.w3.org/2000/svg`}
          {...definedSvgAttrs(attrs)}
          height={svgDimension(props.height, props.size, "16px")}
          width={svgDimension(props.width, props.size, "16px")}
        >
          <path d={`M6 4L11 0L16 4L11 9.5L6 4Z`} fill={`currentColor`} />
          <path d={`M18 6L22 11L18 16L12.5 11L18 6Z`} fill={`currentColor`} />
          <path d={`M4 16L0 11L4 6L9.5 11L4 16Z`} fill={`currentColor`} />
          <path d={`M16 18L11 22L6 18L11 12.5L16 18Z`} fill={`currentColor`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconComponent;
