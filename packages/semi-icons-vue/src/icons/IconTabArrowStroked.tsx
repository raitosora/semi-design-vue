import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconTabArrowStroked =
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
            d={`M2 5C2 3.89543 2.89543 3 4 3H15C15.5523 3 16 3.44772 16 4C16 4.55228 15.5523 5 15 5H4V19H20V11C20 10.4477 20.4477 10 21 10C21.5523 10 22 10.4477 22 11V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M18.2929 8.70711C17.9024 8.31658 17.9024 7.68342 18.2929 7.29289L19.5858 6L18.2929 4.70711C17.9024 4.31658 17.9024 3.68342 18.2929 3.29289C18.6834 2.90237 19.3166 2.90237 19.7071 3.29289L21.7071 5.29289C21.8946 5.48043 22 5.73478 22 6C22 6.26522 21.8946 6.51957 21.7071 6.70711L19.7071 8.70711C19.3166 9.09763 18.6834 9.09763 18.2929 8.70711Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconTabArrowStroked;
