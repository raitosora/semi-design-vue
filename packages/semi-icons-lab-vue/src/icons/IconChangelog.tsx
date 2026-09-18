import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconChangelog =
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
            fill={`#DDE3E8`}
            height={`20`}
            rx={`3`}
            width={`20`}
            x={`2`}
            y={`2`}
          />
          <rect fill={`#324350`} height={`2`} width={`14`} x={`5`} y={`6`} />
          <rect fill={`#324350`} height={`2`} width={`14`} x={`5`} y={`11`} />
          <rect fill={`#324350`} height={`2`} width={`10`} x={`5`} y={`16`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconChangelog;
