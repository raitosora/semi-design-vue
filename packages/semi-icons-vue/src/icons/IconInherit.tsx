import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconInherit =
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
            d={`M1 2C1 1.44772 1.44772 1 2 1H10C10.5523 1 11 1.44772 11 2V10C11 10.5523 10.5523 11 10 11H7.5V15C7.5 15.8284 8.17157 16.5 9 16.5H13V14C13 13.4477 13.4477 13 14 13H22C22.5523 13 23 13.4477 23 14V22C23 22.5523 22.5523 23 22 23H14C13.4477 23 13 22.5523 13 22V19.5H9C6.51472 19.5 4.5 17.4853 4.5 15V11H2C1.44772 11 1 10.5523 1 10V2Z`}
            fill={`currentColor`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconInherit;
