import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconBox = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M2 6.00001L10.5542 1.29518C11.4545 0.800044 12.5455 0.800044 13.4458 1.29518L22 6.00001L12 11L2 6.00001Z`}
          fill={`currentColor`}
        />
        <path
          d={`M11 12.5L1 7.50001V16.1459C1 17.2822 1.64201 18.321 2.65836 18.8292L11 23V12.5Z`}
          fill={`currentColor`}
        />
        <path
          d={`M23 7.50001L13 12.5V23L21.3416 18.8292C22.358 18.321 23 17.2822 23 16.1459V7.50001Z`}
          fill={`currentColor`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconBox;
