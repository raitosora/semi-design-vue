import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconArrowLeft =
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
            d={`M23 12C23 12.8284 22.3284 13.5 21.5 13.5L6.12132 13.5L12.5607 19.9393C13.1464 20.5251 13.1464 21.4749 12.5607 22.0607C11.9749 22.6464 11.0251 22.6464 10.4393 22.0607L1.43934 13.0607C0.853554 12.4749 0.853554 11.5251 1.43934 10.9393L10.4393 1.93934C11.0251 1.35355 11.9749 1.35355 12.5607 1.93934C13.1464 2.52513 13.1464 3.47487 12.5607 4.06066L6.12132 10.5L21.5 10.5C22.3284 10.5 23 11.1716 23 12Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconArrowLeft;
