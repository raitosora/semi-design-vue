import {
  definedSvgAttrs,
  defineVaporComponent,
  svgDimension,
  useAttrs,
  useSvgIdPrefix,
} from "../runtime.js";
import type { SvgResourceProps } from "../runtime.js";

export const IconForm = /* @__PURE__ */ defineVaporComponent<SvgResourceProps>(
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
        <g clip-path={`url(#${prefix}-clip0_1_3028)`}>
          <rect
            fill={`#FF7D95`}
            height={`21`}
            rx={`2`}
            transform={`rotate(-6 3.05081 2.88827)`}
            width={`16`}
            x={`3.051`}
            y={`2.888`}
          />
          <rect
            fill={`white`}
            height={`17`}
            rx={`1`}
            transform={`rotate(-6 5.2489 4.66825)`}
            width={`12`}
            x={`5.249`}
            y={`4.668`}
          />
          <path
            clip-rule={`evenodd`}
            d={`M12.3094 0.909647L13.886 0.743932C14.4353 0.686203 14.9273 1.08467 14.9851 1.63393L15.2987 4.61749L7.34248 5.45372L7.0289 2.47015C6.97117 1.92089 7.36963 1.42883 7.91889 1.3711L9.49556 1.20539C9.63945 0.60446 10.1484 0.131264 10.7979 0.0629958C11.4475 -0.00527278 12.0437 0.351766 12.3094 0.909647Z`}
            fill={`#AAB2BF`}
            fill-rule={`evenodd`}
          />
          <rect
            fill={`#DDE3E8`}
            height={`2`}
            transform={`rotate(-6 7.65607 8.43729)`}
            width={`8`}
            x={`7.656`}
            y={`8.437`}
          />
          <rect
            fill={`#DDE3E8`}
            height={`2`}
            transform={`rotate(-6 8.07417 12.4154)`}
            width={`8`}
            x={`8.074`}
            y={`12.415`}
          />
          <rect
            fill={`#DDE3E8`}
            height={`2`}
            transform={`rotate(-6 8.49229 16.3935)`}
            width={`3.35025`}
            x={`8.492`}
            y={`16.393`}
          />
          <path
            d={`M20.0336 9.94762L15.1077 14.9076C15.0165 14.9977 14.9448 15.1053 14.8969 15.2237L14.0353 17.3532C13.8798 17.7375 14.2655 18.1188 14.6542 17.9651L16.8082 17.1133C16.9279 17.0659 17.0367 16.995 17.1279 16.9049L22.0538 11.9449L20.0336 9.94762Z`}
            fill={`#6A6F7F`}
          />
          <path
            d={`M22.0538 11.9449L22.7211 11.2731C23.093 10.9054 23.093 10.3092 22.7211 9.94153L22.0477 9.27577C21.6758 8.90808 21.0728 8.90808 20.7009 9.27577L20.0336 9.94762L22.0538 11.9449Z`}
            fill={`#6A6F7F`}
          />
        </g>
        <defs>
          <clipPath id={`${prefix}-clip0_1_3028`}>
            <rect fill={`white`} height={`24`} width={`24`} />
          </clipPath>
        </defs>
      </svg>
    );
  },
  { props: ["size", "color", "width", "height"], inheritAttrs: false },
);

export default IconForm;
