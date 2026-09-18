import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconBanner =
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
          <rect fill={`#6A6F7F`} height={`1`} width={`12`} x={`6`} y={`19`} />
          <rect
            fill={`#AAB2BF`}
            height={`22.2633`}
            rx={`1`}
            transform={`rotate(10 7.94241 0.896553)`}
            width={`2`}
            x={`7.942`}
            y={`.897`}
          />
          <rect
            fill={`#AAB2BF`}
            height={`22.3119`}
            rx={`1`}
            transform={`rotate(-10 14.0853 1.22887)`}
            width={`2`}
            x={`14.085`}
            y={`1.229`}
          />
          <rect
            fill={`#FBCD2C`}
            height={`14`}
            rx={`2`}
            width={`22`}
            x={`1`}
            y={`3`}
          />
          <rect fill={`#324350`} height={`2`} width={`16`} x={`4`} y={`6`} />
          <rect fill={`#324350`} height={`2`} width={`9`} x={`4`} y={`11`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconBanner;
