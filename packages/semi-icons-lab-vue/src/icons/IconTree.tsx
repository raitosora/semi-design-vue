import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTree = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          height={`5`}
          rx={`0.5`}
          width={`13`}
          x={`9`}
          y={`16`}
        />
        <rect
          fill={`#6A6F7F`}
          height={`5`}
          rx={`0.5`}
          width={`13`}
          x={`9`}
          y={`9`}
        />
        <path
          clip-rule={`evenodd`}
          d={`M5 6C5.55228 6 6 6.44772 6 7V18H7C7.55228 18 8 18.4477 8 19C8 19.5523 7.55228 20 7 20H5C4.44772 20 4 19.5523 4 19V7C4 6.44772 4.44772 6 5 6Z`}
          fill={`#AAB2BF`}
          fill-rule={`evenodd`}
        />
        <path
          clip-rule={`evenodd`}
          d={`M5 12C5 11.4477 5.44772 11 6 11H7C7.55228 11 8 11.4477 8 12C8 12.5523 7.55228 13 7 13H6C5.44772 13 5 12.5523 5 12Z`}
          fill={`#AAB2BF`}
          fill-rule={`evenodd`}
        />
        <rect
          fill={`#4CC3FA`}
          height={`5`}
          rx={`0.5`}
          width={`15`}
          x={`2`}
          y={`2`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconTree;
