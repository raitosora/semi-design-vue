import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCarousel =
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
            height={`11`}
            rx={`2`}
            width={`11`}
            x={`10.5`}
            y={`7.5`}
          />
          <rect
            fill={`#AAB2BF`}
            height={`11`}
            rx={`2`}
            width={`12`}
            x={`2.5`}
            y={`7.5`}
          />
          <rect
            fill={`#6A6F7F`}
            height={`13`}
            rx={`2`}
            width={`14`}
            x={`5`}
            y={`5.5`}
          />
          <path
            d={`M12.1824 10.7059C12.768 9.76471 14.232 9.76471 14.8176 10.7059L16.7939 13.8824C17.3795 14.8235 16.6475 16 15.4763 16H11.5237C10.3525 16 9.62051 14.8235 10.2061 13.8824L12.1824 10.7059Z`}
            fill={`#DDE3E8`}
          />
          <circle cx={`8.5`} cy={`9.5`} fill={`white`} r={`1.5`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconCarousel;
