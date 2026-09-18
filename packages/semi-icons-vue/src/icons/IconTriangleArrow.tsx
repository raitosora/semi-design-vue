import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTriangleArrow =
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
          <g clip-path={`url(#${prefix}-clip_triangle_arrow)`}>
            <path
              d={`M24 9L24 10C20 10 18.5 11 16.5 13C14.5 15 14 16 12 16C10 16 9.5 15 7.5 13C5.5 11 4 10 -4.37115e-08 10L0 9L24 9Z`}
              fill={`currentColor`}
            />
          </g>
          <defs>
            <clipPath id={`${prefix}-clip_triangle_arrow`}>
              <rect
                fill={`currentColor`}
                height={`24`}
                transform={`translate(24) rotate(90)`}
                width={`24`}
              />
            </clipPath>
          </defs>
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconTriangleArrow;
