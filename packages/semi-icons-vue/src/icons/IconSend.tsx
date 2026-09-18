import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSend = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
          d={`M20.6027 2.13245L1.53504 8.48833C0.829806 8.72341 0.618511 9.61847 1.14416 10.1441L4.95675 13.9567C5.2771 14.2771 5.77281 14.3421 6.16489 14.1151L14.351 9.37577C14.5283 9.27312 14.7269 9.47176 14.6243 9.64907L9.88494 17.8351C9.65794 18.2272 9.7229 18.7229 10.0433 19.0433L13.8559 22.8559C14.3816 23.3815 15.2766 23.1702 15.5117 22.465L21.8676 3.39736C22.1282 2.6156 21.3844 1.87187 20.6027 2.13245Z`}
          fill={`currentColor`}
        />
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconSend;
