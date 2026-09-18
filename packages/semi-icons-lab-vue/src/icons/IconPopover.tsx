import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconPopover =
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
            height={`13`}
            rx={`2`}
            width={`13`}
            x={`9`}
            y={`9`}
          />
          <rect
            fill={`#AAB2BF`}
            height={`12`}
            rx={`2`}
            width={`12`}
            x={`2`}
            y={`7`}
          />
          <rect
            fill={`#DDE3E8`}
            height={`11`}
            rx={`2`}
            width={`11`}
            x={`8`}
            y={`2`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconPopover;
