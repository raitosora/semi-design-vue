import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconBeaker =
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
            d={`M6.99995 9.63222V4C6.17155 3.99997 5.5 3.32841 5.5 2.5C5.5 1.67157 6.17157 1 7 1H8.49995H15.5H17C17.8284 1 18.5 1.67157 18.5 2.5C18.5 3.32843 17.8284 4 17 4H17V9.63222L22.0668 19.3436C22.9351 21.008 21.7276 23 19.8503 23H4.14962C2.27229 23 1.06476 21.008 1.93315 19.3436L6.99995 9.63222ZM14 4H9.99995V10C9.99995 10.2416 9.94159 10.4796 9.82983 10.6938L8.62662 13H15.3733L14.1701 10.6938C14.0583 10.4796 14 10.2416 14 10V4Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconBeaker;
