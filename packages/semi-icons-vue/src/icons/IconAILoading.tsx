import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconAILoading =
  /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
    (props) => {
      const attrs = useAttrs();
      const prefix = useSvgIdPrefix();
      return (
        <svg
          color={props.color}
          fill={`none`}
          viewBox={`0 0 16 16`}
          xmlns={`http://www.w3.org/2000/svg`}
          {...definedSvgAttrs(attrs)}
          height={svgDimension(props.height, props.size, "16px")}
          width={svgDimension(props.width, props.size, "16px")}
        >
          <g clip-path={`url(#${prefix}-clip0_11509_33466)`}>
            <path
              d={`M15.1112 7.99978C15.1112 4.07242 11.9275 0.888672 8.00009 0.888672C5.18219 0.888672 2.74711 2.52771 1.59619 4.90445`}
              stroke={`url(#${prefix}-paint0_linear_11509_33466)`}
              stroke-linecap={`round`}
              stroke-width={`1.77778`}
            />
          </g>
          <defs>
            <linearGradient
              gradientUnits={`userSpaceOnUse`}
              id={`${prefix}-paint0_linear_11509_33466`}
              x1={`16`}
              x2={`2.68594`}
              y1={`8`}
              y2={`11.022`}
            >
              <stop stop-color={`#E945FF`} />
              <stop offset={`0.3`} stop-color={`#A647FF`} />
              <stop offset={`0.6`} stop-color={`#6B61FF`} />
              <stop offset={`1`} stop-color={`#2E8CFF`} stop-opacity={`0`} />
            </linearGradient>
            <clipPath id={`${prefix}-clip0_11509_33466`}>
              <rect fill={`currentColor`} height={`16`} width={`16`} />
            </clipPath>
          </defs>
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconAILoading;
