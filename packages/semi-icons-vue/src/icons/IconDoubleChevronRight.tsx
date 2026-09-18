import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconDoubleChevronRight =
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
            d={`M4.38153 4.39653C4.89024 3.86782 5.71502 3.86782 6.22373 4.39653L12.6185 11.0427C13.1272 11.5714 13.1272 12.4286 12.6185 12.9573L6.22373 19.6035C5.71502 20.1322 4.89024 20.1322 4.38153 19.6035C3.87282 19.0748 3.87282 18.2176 4.38153 17.6888L9.85517 12L4.38153 6.31116C3.87282 5.78245 3.87282 4.92524 4.38153 4.39653Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M11.3815 4.39653C11.8902 3.86782 12.715 3.86782 13.2237 4.39653L19.6185 11.0427C20.1272 11.5714 20.1272 12.4286 19.6185 12.9573L13.2237 19.6035C12.715 20.1322 11.8902 20.1322 11.3815 19.6035C10.8728 19.0748 10.8728 18.2176 11.3815 17.6888L16.8552 12L11.3815 6.31116C10.8728 5.78245 10.8728 4.92524 11.3815 4.39653Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconDoubleChevronRight;
