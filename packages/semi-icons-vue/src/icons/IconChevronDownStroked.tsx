import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconChevronDownStroked =
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
            d={`M4.08401 8.14944C4.55377 7.64355 5.34468 7.61426 5.85057 8.08401L12 13.7942L18.1494 8.08401C18.6553 7.61426 19.4462 7.64355 19.916 8.14944C20.3857 8.65533 20.3565 9.44624 19.8506 9.916L12.8506 16.416C12.371 16.8613 11.629 16.8613 11.1494 16.416L4.14944 9.916C3.64355 9.44624 3.61426 8.65533 4.08401 8.14944Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconChevronDownStroked;
