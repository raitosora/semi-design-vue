import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconArrowUp =
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
            d={`M12 23C11.1716 23 10.5 22.3284 10.5 21.5L10.5 6.12132L4.06066 12.5607C3.47487 13.1464 2.52513 13.1464 1.93934 12.5607C1.35355 11.9749 1.35355 11.0251 1.93934 10.4393L10.9393 1.43934C11.5251 0.853554 12.4749 0.853554 13.0607 1.43934L22.0607 10.4393C22.6464 11.0251 22.6464 11.9749 22.0607 12.5607C21.4749 13.1464 20.5251 13.1464 19.9393 12.5607L13.5 6.12132L13.5 21.5C13.5 22.3284 12.8284 23 12 23Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconArrowUp;
