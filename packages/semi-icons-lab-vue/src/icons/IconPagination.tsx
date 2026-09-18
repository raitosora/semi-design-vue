import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconPagination =
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
            d={`M1 8C1 6.34315 2.34315 5 4 5H12V19H4C2.34315 19 1 17.6569 1 16V8Z`}
            fill={`#6A6F7F`}
          />
          <path
            d={`M8 9L5 12L8 15`}
            stroke={`white`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M12 5H20C21.6569 5 23 6.34315 23 8V16C23 17.6569 21.6569 19 20 19H12V5Z`}
            fill={`#DDE3E8`}
          />
          <path
            d={`M16 9L19 12L16 15`}
            stroke={`#AAB2BF`}
            stroke-linecap={`round`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconPagination;
