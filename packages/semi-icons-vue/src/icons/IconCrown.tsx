import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCrown = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M0.830911 7.65904C0.591258 6.89214 1.50509 6.29012 2.11513 6.81301L3.96861 8.40171C5.48542 9.70184 7.82541 9.18404 8.65209 7.36535L11.0896 2.00282C11.4449 1.22123 12.5551 1.22123 12.9103 2.00282L15.3478 7.36535C16.1745 9.18404 18.5145 9.70184 20.0313 8.40171L21.8848 6.81301C22.4948 6.29012 23.4087 6.89215 23.169 7.65904L19.4385 20.5966C19.1776 21.4315 18.4044 22 17.5296 22H6.47035C5.59558 22 4.82231 21.4315 4.56139 20.5966L0.830911 7.65904Z`}
          fill={`currentColor`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconCrown;
