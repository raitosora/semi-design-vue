import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconListView =
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
            d={`M2 4C2 2.89543 2.89543 2 4 2H20C21.1046 2 22 2.89543 22 4V5C22 6.10457 21.1046 7 20 7H4C2.89543 7 2 6.10457 2 5V4Z`}
            fill={`currentColor`}
          />
          <path
            d={`M2 11.5C2 10.3954 2.89543 9.5 4 9.5H20C21.1046 9.5 22 10.3954 22 11.5V12.5C22 13.6046 21.1046 14.5 20 14.5H4C2.89543 14.5 2 13.6046 2 12.5V11.5Z`}
            fill={`currentColor`}
          />
          <path
            d={`M2 19C2 17.8954 2.89543 17 4 17H20C21.1046 17 22 17.8954 22 19V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V19Z`}
            fill={`currentColor`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconListView;
