import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconShieldStroked =
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
            d={`M3 4.12781L12.0013 2.5L21 4.12781V9.51683C21 15.1811 17.3751 20.2095 12.0013 22C6.62604 20.2095 3 15.18 3 9.51434V4.12781Z`}
            stroke={`currentColor`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M11.9749 7.47485V15.4749`}
            stroke={`currentColor`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M7.97485 11.4749H15.9749`}
            stroke={`currentColor`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconShieldStroked;
