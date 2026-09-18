import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSwitch =
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
            height={`10`}
            rx={`5`}
            width={`20`}
            x={`2`}
            y={`1`}
          />
          <circle cx={`7.5`} cy={`5.99997`} fill={`white`} r={`3.5`} />
          <rect
            fill={`#3BCE4A`}
            height={`10`}
            rx={`5`}
            width={`20`}
            x={`2`}
            y={`13`}
          />
          <circle cx={`16.5`} cy={`18`} fill={`white`} r={`3.5`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconSwitch;
