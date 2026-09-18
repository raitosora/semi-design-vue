import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSectionStroked =
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
            d={`M3 4C2.44772 4 2 4.44772 2 5V10C2 10.5523 2.44772 11 3 11H21C21.5523 11 22 10.5523 22 10V5C22 4.44772 21.5523 4 21 4H3ZM4 9V6H20V9H4ZM3 13C2.44772 13 2 13.4477 2 14V19C2 19.5523 2.44772 20 3 20H21C21.5523 20 22 19.5523 22 19V14C22 13.4477 21.5523 13 21 13H3ZM4 18V15H20V18H4Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconSectionStroked;
