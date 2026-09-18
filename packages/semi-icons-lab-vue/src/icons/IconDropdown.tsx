import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconDropdown =
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
          <rect
            fill={`#6A6F7F`}
            height={`20`}
            rx={`3`}
            transform={`rotate(-6 1.00949 3.10007)`}
            width={`20`}
            x={`1.009`}
            y={`3.1`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M5.65261 9.58962C6.17396 8.94581 7.11851 8.84653 7.76231 9.36788L12.0918 12.8739L15.5978 8.54433C16.1192 7.90052 17.0637 7.80125 17.7075 8.32259C18.3513 8.84394 18.4506 9.78849 17.9293 10.4323L13.4793 15.9275C12.958 16.5714 12.0134 16.6706 11.3696 16.1493L5.87435 11.6993C5.23054 11.178 5.13127 10.2334 5.65261 9.58962Z`}
            fill={`white`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconDropdown;
