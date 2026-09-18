import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconSkeleton =
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
          <rect fill={`#DDE3E8`} height={`3`} width={`21`} x={`2`} y={`11`} />
          <rect fill={`#DDE3E8`} height={`3`} width={`21`} x={`2`} y={`15`} />
          <rect fill={`#AAB2BF`} height={`3`} width={`12`} x={`11`} y={`2`} />
          <rect fill={`#AAB2BF`} height={`3`} width={`9`} x={`11`} y={`6`} />
          <rect fill={`#DDE3E8`} height={`3`} width={`11`} x={`2`} y={`19`} />
          <rect fill={`#6A6F7F`} height={`7`} width={`7`} x={`2`} y={`2`} />
        </svg>
      );
    },
    { props: ["size", "color", "width", "height"], inheritAttrs: false },
  );

export default IconSkeleton;
