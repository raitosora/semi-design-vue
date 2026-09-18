import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconDesktop =
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
            d={`M2.50009 14.5V5.5C2.50009 4.39543 3.39552 3.5 4.50009 3.5H19.5001C20.6047 3.5 21.5001 4.39543 21.5001 5.5V14.5C21.5001 15.6046 20.6047 16.5 19.5001 16.5H4.50009C3.39552 16.5 2.50009 15.6046 2.50009 14.5Z`}
            stroke={`currentColor`}
            stroke-width={`3`}
          />
          <path
            d={`M7.5 21.5H16.5`}
            stroke={`currentColor`}
            stroke-linecap={`round`}
            stroke-width={`3`}
          />
          <path
            d={`M12 15.5V20.5`}
            stroke={`currentColor`}
            stroke-width={`4`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconDesktop;
