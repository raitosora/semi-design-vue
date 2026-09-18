import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconWebcomponents =
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
            fill={`#41B3FF`}
            height={`20`}
            rx={`5`}
            width={`20`}
            x={`2`}
            y={`2`}
          />
          <rect
            fill={`#E9E7E7`}
            height={`3`}
            rx={`1.5`}
            width={`10`}
            x={`7`}
            y={`5.5`}
          />
          <rect
            fill={`#483D3D`}
            height={`3`}
            rx={`1.5`}
            width={`10`}
            x={`7`}
            y={`10.5`}
          />
          <rect
            fill={`#E9E7E7`}
            height={`3`}
            rx={`1.5`}
            width={`10`}
            x={`7`}
            y={`15.5`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconWebcomponents;
