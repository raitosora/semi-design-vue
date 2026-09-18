import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconButton =
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
            d={`M2 16.5C2 15.1193 3.11929 14 4.5 14H19.5C20.8807 14 22 15.1193 22 16.5C22 17.8807 20.8807 19 19.5 19H4.5C3.11929 19 2 17.8807 2 16.5Z`}
            fill={`#6A6F7F`}
          />
          <rect fill={`#DDE3E8`} height={`2`} width={`8`} x={`8`} y={`12`} />
          <path
            d={`M6 5.67391C6 4.73519 6.65356 3.9279 7.58364 3.80089C8.66208 3.65362 10.2149 3.5 12 3.5C13.7851 3.5 15.3379 3.65362 16.4164 3.80089C17.3464 3.9279 18 4.73519 18 5.67391V11C18 11.5523 17.5523 12 17 12H7C6.44772 12 6 11.5523 6 11V5.67391Z`}
            fill={`#F82C2C`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconButton;
