import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconGrid = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          clip-rule={`evenodd`}
          d={`M22 2H2V22H22V2ZM20 4H4V20H20V4Z`}
          fill={`#6A6F7F`}
          fill-rule={`evenodd`}
        />
        <path
          clip-rule={`evenodd`}
          d={`M22 9H20V15H22V9ZM2 15H4V9H2V15Z`}
          fill={`#DDE3E8`}
          fill-rule={`evenodd`}
        />
        <path
          clip-rule={`evenodd`}
          d={`M15 22V20H9V22H15ZM9 2V4H15V2H9Z`}
          fill={`#DDE3E8`}
          fill-rule={`evenodd`}
        />
        <rect fill={`#6A6F7F`} height={`3`} width={`3`} x={`7`} y={`7`} />
        <rect fill={`#DDE3E8`} height={`4`} width={`3`} x={`7`} y={`10`} />
        <rect fill={`#DDE3E8`} height={`4`} width={`3`} x={`14`} y={`10`} />
        <rect fill={`#DDE3E8`} height={`3`} width={`4`} x={`10`} y={`7`} />
        <rect fill={`#DDE3E8`} height={`3`} width={`4`} x={`10`} y={`14`} />
        <rect fill={`#6A6F7F`} height={`3`} width={`3`} x={`14`} y={`7`} />
        <rect fill={`#6A6F7F`} height={`3`} width={`3`} x={`7`} y={`14`} />
        <rect fill={`#6A6F7F`} height={`3`} width={`3`} x={`14`} y={`14`} />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconGrid;
