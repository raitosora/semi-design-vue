import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconModal = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          fill={`#AAB2BF`}
          height={`20`}
          rx={`3`}
          width={`20`}
          x={`2`}
          y={`2`}
        />
        <rect
          fill={`white`}
          height={`12`}
          rx={`1`}
          width={`16`}
          x={`4`}
          y={`6`}
        />
        <rect
          fill={`#AAB2BF`}
          height={`3`}
          rx={`1`}
          width={`5`}
          x={`6`}
          y={`13`}
        />
        <rect
          fill={`#4CC3FA`}
          height={`3`}
          rx={`1`}
          width={`5`}
          x={`13`}
          y={`13`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconModal;
