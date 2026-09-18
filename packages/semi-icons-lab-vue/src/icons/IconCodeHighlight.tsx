import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCodeHighlight =
  /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
    (props) => {
      const attrs = useAttrs();
      const prefix = useSvgIdPrefix();
      return (
        <svg
          color={props.color}
          fill={`none`}
          viewBox={`0 0 22 18`}
          xmlns={`http://www.w3.org/2000/svg`}
          {...definedSvgAttrs(attrs)}
          height={svgDimension(props.height, props.size, "16px")}
          width={svgDimension(props.width, props.size, "16px")}
        >
          <rect
            fill={`#49C4FD`}
            height={`10`}
            rx={`2`}
            width={`22`}
            y={`0.40625`}
          />
          <path
            d={`M0 4.59375H11V17.5938H2C0.895431 17.5938 0 16.6983 0 15.5938V4.59375Z`}
            fill={`#F9FCFF`}
          />
          <path
            d={`M11 4.59375H22V15.5938C22 16.6983 21.1046 17.5938 20 17.5938H11V4.59375Z`}
            fill={`#F9FCFF`}
          />
          <path
            d={`M7 8L4 11L7 14`}
            stroke={`#F8CE27`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`1.5`}
          />
          <path
            d={`M15 8L18 11L15 14`}
            stroke={`#49C4FD`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`1.5`}
          />
          <path
            d={`M12 8L10 14.5`}
            stroke={`#E0E4E7`}
            stroke-linecap={`round`}
            stroke-width={`1.5`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconCodeHighlight;
