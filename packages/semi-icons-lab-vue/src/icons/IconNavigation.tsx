import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconNavigation =
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
          <g clip-path={`url(#${prefix}-clip0_1_3057)`}>
            <circle
              cx={`12`}
              cy={`12`}
              fill={`#DDE3E8`}
              r={`11`}
              transform={`rotate(-45 12 12)`}
            />
            <path
              d={`M4.95413 12.237L16.8183 6.92269L12.2377 19.089L10.5096 13.6288L4.95413 12.237Z`}
              fill={`#324350`}
            />
          </g>
          <defs>
            <clipPath id={`${prefix}-clip0_1_3057`}>
              <rect fill={`white`} height={`24`} width={`24`} />
            </clipPath>
          </defs>
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconNavigation;
