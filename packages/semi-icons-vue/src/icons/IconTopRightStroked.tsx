import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTopRightStroked =
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
            d={`M3 2C2.44772 2 2 2.44772 2 3C2 3.55228 2.44772 4 3 4H20V21C20 21.5523 20.4477 22 21 22C21.5523 22 22 21.5523 22 21V3C22 2.44772 21.5523 2 21 2H3ZM3 10C2.44772 10 2 10.4477 2 11V21C2 21.5523 2.44772 22 3 22H13C13.5523 22 14 21.5523 14 21V11C14 10.4477 13.5523 10 13 10H3ZM4 20V12H12V20H4Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconTopRightStroked;
