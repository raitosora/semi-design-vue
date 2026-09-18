import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconProgress =
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
          <circle
            cx={`12`}
            cy={`12`}
            r={`8`}
            stroke={`#3BCE4A`}
            stroke-width={`6`}
          />
          <path
            d={`M12.1378 4C16.48 4 20 7.58172 20 12C20 16.4183 16.48 20 12.1378 20C9.65493 20 7.44087 18.8289 6 17`}
            stroke={`#3BCE4A`}
            stroke-linecap={`round`}
            stroke-width={`6`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconProgress;
