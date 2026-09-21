import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  ref,
  useAttrs,
} from "vue";
import { definedSvgAttrs, useSvgIdPrefix } from "../runtime.js";
import type { IconHandle, IconProps } from "./types.js";

const namedSizes = new Set([
  "extra-small",
  "small",
  "default",
  "large",
  "extra-large",
]);

const IconComponent = defineVaporComponent<
  IconProps,
  {},
  string,
  {},
  IconHandle
>(
  (props: IconProps) => {
    const attrs = useAttrs();
    const element = ref<HTMLSpanElement | null>(null);
    const id = useSvgIdPrefix();
    const api: IconHandle = { getElement: () => element.value };
    defineExpose<IconHandle>(api);
    onBeforeUnmount(() => {
      element.value = null;
    });
    const prefix = computed(() => props.prefixCls ?? "semi");
    const size = computed(() => props.size ?? "default");
    const named = computed(() =>
      [attrs["aria-label"], attrs["aria-labelledby"]].some(
        (value) => typeof value === "string" && value.trim().length > 0,
      ),
    );
    return (
      <span
        aria-hidden={named.value ? undefined : true}
        role={named.value ? "img" : undefined}
        {...definedSvgAttrs(attrs)}
        class={[
          `${prefix.value}-icon`,
          namedSizes.has(size.value) && `${prefix.value}-icon-${size.value}`,
          props.spin === true && `${prefix.value}-icon-spinning`,
          props.type && `${prefix.value}-icon-${props.type}`,
          props.className,
        ]}
        ref={element}
        style={[
          {
            color: props.color,
            transform: Number.isSafeInteger(props.rotate)
              ? `rotate(${props.rotate}deg)`
              : undefined,
          },
          props.style,
        ]}
      >
        <slot fill={props.fill} id={id} name="svg" size={"1em" as const}>
          <slot fill={props.fill} id={id} size={"1em" as const} />
        </slot>
      </span>
    );
  },
  {
    props: [
      "size",
      "spin",
      "rotate",
      "prefixCls",
      "type",
      "fill",
      "color",
      "className",
      "style",
    ],
    inheritAttrs: false,
  },
);

/** Compatibility marker; rendering never depends on inspecting child nodes. */
export const Icon = Object.assign(IconComponent, {
  elementType: "Icon" as const,
});
export default Icon;
