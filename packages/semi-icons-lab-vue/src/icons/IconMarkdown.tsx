import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconMarkdown =
  /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
    (props) => {
      const attrs = useAttrs();
      const prefix = useSvgIdPrefix();
      return (
        <svg
          color={props.color}
          fill={`none`}
          viewBox={`0 0 22 18`}
          xmlns={`http://www.w3.org/2000/svg`}
          {...definedSvgAttrs(attrs)}
          height={svgDimension(props.height, props.size, "16px")}
          width={svgDimension(props.width, props.size, "16px")}
        >
          <path
            d={`M0 14H22V16C22 17.1046 21.1046 18 20 18H2C0.89543 18 0 17.1046 0 16V14Z`}
            fill={`#6A6F7F`}
          />
          <path
            d={`M0 2C0 0.89543 0.895431 0 2 0H20C21.1046 0 22 0.895431 22 2V14H0V2Z`}
            fill={`#DDE3E8`}
          />
          <rect
            fill={`#DDE3E8`}
            height={`2`}
            opacity={`0.5`}
            rx={`1`}
            width={`2`}
            x={`18`}
            y={`15`}
          />
          <rect fill={`#6A6F7F`} height={`1.5`} width={`5`} x={`3`} y={`5`} />
          <rect fill={`#6A6F7F`} height={`1.5`} width={`7`} x={`3`} y={`9`} />
          <rect
            fill={`#F8CE27`}
            height={`7`}
            rx={`1`}
            width={`7`}
            x={`12`}
            y={`4`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconMarkdown;
