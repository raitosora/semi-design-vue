import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconGallery =
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
          <rect
            fill={`currentColor`}
            height={`14`}
            rx={`3`}
            width={`18`}
            x={`5`}
            y={`9`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M15.659 0.747655L2.46269 4.22036C0.836568 4.64829 -0.120338 6.32896 0.3416 7.94575L2.69291 16.1753C2.76592 16.4309 2.87002 16.6693 2.99997 16.8876V11C2.99997 8.79088 4.79083 7.00002 6.99997 7.00002H20.5L19.307 2.82472C18.8586 1.25519 17.2376 0.332237 15.659 0.747655Z`}
            fill={`currentColor`}
            fill-rule={`evenodd`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconGallery;
