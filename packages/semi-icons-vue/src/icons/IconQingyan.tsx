import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconQingyan =
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
            d={`M21.4288 4.14284C22.2967 4.14284 23.0003 3.43929 23.0003 2.57142C23.0003 1.70355 22.2967 1 21.4288 1C20.561 1 19.8574 1.70355 19.8574 2.57142C19.8574 3.43929 20.561 4.14284 21.4288 4.14284ZM11.2142 22.9997C16.8554 22.9997 21.4284 18.4267 21.4284 12.7855C21.4284 7.14435 16.8554 2.57129 11.2142 2.57129C5.57306 2.57129 1 7.14435 1 12.7855C1 18.4267 5.57306 22.9997 11.2142 22.9997Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconQingyan;
