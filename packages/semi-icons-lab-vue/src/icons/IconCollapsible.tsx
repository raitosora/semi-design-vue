import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCollapsible =
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
            d={`M2.72361 5.44721C2.39116 4.78231 2.87465 4 3.61803 4H20.382C21.1253 4 21.6088 4.78231 21.2764 5.44721L18 12H6L2.72361 5.44721Z`}
            fill={`#DDE3E8`}
          />
          <path
            d={`M2.72361 18.5528C2.39116 19.2177 2.87465 20 3.61803 20H20.382C21.1253 20 21.6088 19.2177 21.2764 18.5528L18 12H6L2.72361 18.5528Z`}
            fill={`#6A6F7F`}
          />
          <path
            d={`M12 2V10`}
            stroke={`#4CC3FA`}
            stroke-linecap={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M9 7L12 10L15 7`}
            stroke={`#4CC3FA`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M12 22V14`}
            stroke={`#4CC3FA`}
            stroke-linecap={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M9 17L12 14L15 17`}
            stroke={`#4CC3FA`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconCollapsible;
