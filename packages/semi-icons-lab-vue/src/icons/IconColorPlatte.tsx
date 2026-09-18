import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconColorPlatte =
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
          <path
            d={`M12 2C6.47778 2 2 6.47778 2 12C2 17.5222 6.47778 22 12 22C12.9222 22 13.6667 21.2556 13.6667 20.3333C13.6667 19.9 13.5056 19.5111 13.2333 19.2167C12.9722 18.9222 12.8167 18.5389 12.8167 18.1111C12.8167 17.1889 13.5611 16.4444 14.4833 16.4444H16.4444C19.5111 16.4444 22 13.9556 22 10.8889C22 5.97778 17.5222 2 12 2Z`}
            fill={`#DDE3E8`}
            stroke={`#DDE3E8`}
            stroke-width={`1.5`}
          />
          <circle cx={`6`} cy={`12`} fill={`#F82C2C`} r={`2`} />
          <circle cx={`10.5`} cy={`7`} fill={`#4CC3FA`} r={`2`} />
          <circle cx={`17`} cy={`9`} fill={`#3BCE4A`} r={`2`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconColorPlatte;
