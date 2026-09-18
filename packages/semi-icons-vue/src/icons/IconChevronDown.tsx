import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconChevronDown =
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
            clip-rule={`evenodd`}
            d={`M4.08045 7.59809C4.66624 7.01231 5.61599 7.01231 6.20177 7.59809L11.8586 13.2549L17.5155 7.59809C18.1013 7.01231 19.051 7.01231 19.6368 7.59809C20.2226 8.18388 20.2226 9.13363 19.6368 9.71941L12.9193 16.4369C12.3335 17.0227 11.3838 17.0227 10.798 16.4369L4.08045 9.71941C3.49467 9.13363 3.49467 8.18388 4.08045 7.59809Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconChevronDown;
