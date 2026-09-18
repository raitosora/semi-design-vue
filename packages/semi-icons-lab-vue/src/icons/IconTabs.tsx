import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTabs = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M12 5.99997C12 4.8954 12.8954 3.99997 14 3.99997H19C20.1046 3.99997 21 4.8954 21 5.99997V11C21 12.1045 20.1046 13 19 13H14C12.8954 13 12 12.1045 12 11V5.99997Z`}
          fill={`#818A9B`}
        />
        <path
          d={`M3.99999 1.99997C2.89542 1.99997 1.99999 2.8954 1.99999 3.99997L1.99999 20C1.99999 21.1045 2.89542 22 3.99999 22H20C21.1046 22 22 21.1045 22 20V9.99997C22 8.8954 21.1046 7.99997 20 7.99997H14C12.8954 7.99997 12 7.10454 12 5.99997V3.99997C12 2.8954 11.1046 1.99997 9.99999 1.99997L3.99999 1.99997Z`}
          fill={`#DDE3E8`}
        />
        <rect fill={`#AAB2BF`} height={`2`} width={`12`} x={`6`} y={`12`} />
        <rect fill={`#AAB2BF`} height={`2`} width={`9`} x={`6`} y={`16`} />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconTabs;
