import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconUpload =
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
            d={`M17.8395 8.05827C17.1837 5.16226 14.5944 3 11.5 3C7.91015 3 5 5.91015 5 9.5C5 10.0204 5.06115 10.5264 5.17665 11.0114C2.84229 11.1772 1 13.1234 1 15.5C1 17.9853 3.01469 20 5.49995 20H17C20.3137 20 23 17.3137 23 14C23 10.9712 20.7558 8.46659 17.8395 8.05827ZM12.3201 8.26674C12.1347 8.11222 11.8653 8.11222 11.6799 8.26674L6.53047 12.5579C6.35084 12.7076 6.45669 13 6.69051 13H10V17.5C10 17.7761 10.2239 18 10.5 18H13.5C13.7761 18 14 17.7761 14 17.5V13H17.3095C17.5433 13 17.6492 12.7076 17.4695 12.5579L12.3201 8.26674Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconUpload;
