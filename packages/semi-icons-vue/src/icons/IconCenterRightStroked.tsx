import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCenterRightStroked =
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
            d={`M22 3C22 2.44772 21.5523 2 21 2C20.4477 2 20 2.44772 20 3V21C20 21.5523 20.4477 22 21 22C21.5523 22 22 21.5523 22 21V3ZM3 6C2.44772 6 2 6.44772 2 7V17C2 17.5523 2.44772 18 3 18H13C13.5523 18 14 17.5523 14 17V7C14 6.44772 13.5523 6 13 6H3ZM4 16V8H12V16H4Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconCenterRightStroked;
