import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSteps = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M14 10C14 9.44772 14.4477 9 15 9H20C20.5523 9 21 9.44772 21 10V21C21 21.5523 20.5523 22 20 22H3C2.44772 22 2 21.5523 2 21V18C2 17.4477 2.44772 17 3 17H7.5C7.77614 17 8 16.7761 8 16.5V14C8 13.4477 8.44772 13 9 13H13.5C13.7761 13 14 12.7761 14 12.5V10Z`}
          fill={`#AAB2BF`}
        />
        <rect fill={`#AAB2BF`} height={`4`} width={`2`} x={`16`} y={`5`} />
        <path d={`M23 5L16 2V8L23 5Z`} fill={`#F82C2C`} />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconSteps;
