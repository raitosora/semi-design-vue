import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconBackTop =
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
            d={`M2.9685 14.1284L12 6L21.0315 14.1284C21.3721 14.4349 21.1553 15 20.697 15H16V22H8V15H3.30298C2.84474 15 2.62789 14.4349 2.9685 14.1284Z`}
            fill={`#4CC3FA`}
          />
          <rect
            fill={`#AAB2BF`}
            height={`4`}
            rx={`1`}
            width={`18`}
            x={`3`}
            y={`2`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconBackTop;
