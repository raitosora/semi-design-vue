import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSelect =
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
          <g clip-path={`url(#${prefix}-clip0_1_3050)`}>
            <rect
              fill={`#DDE3E8`}
              height={`5`}
              rx={`0.5`}
              width={`16`}
              x={`2`}
              y={`2`}
            />
            <rect
              fill={`#DDE3E8`}
              height={`5`}
              rx={`0.5`}
              width={`16`}
              x={`2`}
              y={`17`}
            />
            <rect
              fill={`#FBCD2C`}
              height={`6`}
              rx={`0.5`}
              width={`16`}
              x={`6`}
              y={`9`}
            />
            <path
              clip-rule={`evenodd`}
              d={`M12.5 10.7929C12.5 9.902 13.5771 9.45583 14.2071 10.0858L22.9142 18.7929C23.5442 19.4229 23.098 20.5 22.2071 20.5H18.2488C17.6797 20.5 17.1376 20.7424 16.7581 21.1666L14.2453 23.9756C13.6333 24.6598 12.5 24.2269 12.5 23.3089V10.7929ZM16.6837 19H21L14 12V22L16.6837 19Z`}
              fill={`white`}
              fill-rule={`evenodd`}
            />
            <path d={`M14 22V12L21 19H16.6837L14 22Z`} fill={`#324350`} />
          </g>
          <defs>
            <clipPath id={`${prefix}-clip0_1_3050`}>
              <rect fill={`white`} height={`24`} width={`24`} />
            </clipPath>
          </defs>
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconSelect;
