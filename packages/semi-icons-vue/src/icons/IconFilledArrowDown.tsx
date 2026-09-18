import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconFilledArrowDown =
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
            d={`M22.1464 12.0606L12.3535 21.8535C12.1582 22.0488 11.8417 22.0488 11.6464 21.8535L1.8535 12.0606C1.53852 11.7457 1.7616 11.2071 2.20706 11.2071H7.99995V2.20709C7.99995 1.65481 8.44767 1.20709 8.99995 1.20709H15C15.5522 1.20709 16 1.65481 16 2.20709V11.2071H21.7928C22.2383 11.2071 22.4614 11.7457 22.1464 12.0606Z`}
            fill={`currentColor`}
          />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconFilledArrowDown;
