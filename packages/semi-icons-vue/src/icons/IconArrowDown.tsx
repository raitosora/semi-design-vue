import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconArrowDown =
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
            d={`M12 1C12.8284 1 13.5 1.67157 13.5 2.5V17.8787L19.9393 11.4393C20.5251 10.8536 21.4749 10.8536 22.0607 11.4393C22.6464 12.0251 22.6464 12.9749 22.0607 13.5607L13.0607 22.5607C12.4749 23.1464 11.5251 23.1464 10.9393 22.5607L1.93934 13.5607C1.35355 12.9749 1.35355 12.0251 1.93934 11.4393C2.52513 10.8536 3.47487 10.8536 4.06066 11.4393L10.5 17.8787V2.5C10.5 1.67157 11.1716 1 12 1Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconArrowDown;
