import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconMoon = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23ZM17 15C17.476 15 17.9408 14.9525 18.3901 14.862C17.296 17.3011 14.8464 19 12 19C8.13401 19 5 15.866 5 12C5 8.60996 7.40983 5.78277 10.6099 5.13803C10.218 6.01173 10 6.98041 10 8C10 11.866 13.134 15 17 15Z`}
          fill={`currentColor`}
          fill-rule={`evenodd`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconMoon;
