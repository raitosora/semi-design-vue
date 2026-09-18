import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconAnchor =
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
            d={`M6.16667 12H3.66667C3.66667 16.6024 7.39763 20.3333 12 20.3333C16.6024 20.3333 20.3333 16.6024 20.3333 12H17.8333`}
            stroke={`#AAB2BF`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
          <path
            d={`M12 20.3333V7.83333`}
            stroke={`#818A9B`}
            stroke-linejoin={`round`}
            stroke-width={`2`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M12.0016 9.83667C13.7054 9.83667 15.0866 8.45545 15.0866 6.75167C15.0866 5.04787 13.7054 3.66667 12.0016 3.66667C10.2978 3.66667 8.91663 5.04787 8.91663 6.75167C8.91663 8.45545 10.2978 9.83667 12.0016 9.83667Z`}
            fill={`#324350`}
            fill-rule={`evenodd`}
            stroke={`#324350`}
            stroke-linejoin={`round`}
            stroke-width={`1.25`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconAnchor;
