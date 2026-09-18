import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconCascader =
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
            d={`M2 3.54818C2 2.82211 2.74939 2.33807 3.41122 2.63664L9 5.15789V22L3.17756 19.3733C2.46078 19.05 2 18.3366 2 17.5503V3.54818Z`}
            fill={`#4CC3FA`}
          />
          <path
            d={`M15 2L20.8224 4.62666C21.5392 4.95002 22 5.6634 22 6.44974V20.4518C22 21.1779 21.2506 21.6619 20.5888 21.3634L15 18.8421V2Z`}
            fill={`#FBCD2C`}
          />
          <path d={`M9 5.15789L15 2V18.8421L9 22V5.15789Z`} fill={`#324350`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconCascader;
