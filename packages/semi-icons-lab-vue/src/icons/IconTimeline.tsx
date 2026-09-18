import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTimeline =
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
          <rect fill={`#AAB2BF`} height={`2`} width={`18`} x={`3`} y={`11`} />
          <circle cx={`4`} cy={`12`} fill={`#DDE3E8`} r={`3`} />
          <circle cx={`12`} cy={`12`} fill={`#DDE3E8`} r={`3`} />
          <circle cx={`20`} cy={`12`} fill={`#4CC3FA`} r={`3`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconTimeline;
