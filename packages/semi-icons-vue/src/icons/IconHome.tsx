import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconHome = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M2 11.4454C2 11.1619 2.12032 10.8917 2.33104 10.7021L11.331 2.60207C11.7113 2.2598 12.2887 2.2598 12.669 2.60207L21.669 10.7021C21.8797 10.8917 22 11.1619 22 11.4454V20C22 21.1046 21.1046 22 20 22H16C15.4477 22 15 21.5523 15 21V17C15 15.3432 13.6569 14 12 14C10.3431 14 9 15.3432 9 17V21C9 21.5523 8.55228 22 8 22H4C2.89543 22 2 21.1046 2 20V11.4454Z`}
          fill={`currentColor`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconHome;
