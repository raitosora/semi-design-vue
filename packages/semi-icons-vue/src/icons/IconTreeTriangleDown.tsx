import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTreeTriangleDown =
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
            d={`M20.5598 9.65618L12.7546 18.6322C12.3559 19.0906 11.644 19.0906 11.2453 18.6322L3.4401 9.65618C2.8773 9.00895 3.33701 8 4.19471 8L19.8052 8C20.6629 8 21.1226 9.00895 20.5598 9.65618Z`}
            fill={`currentColor`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconTreeTriangleDown;
