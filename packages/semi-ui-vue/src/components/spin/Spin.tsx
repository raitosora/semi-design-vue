import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  ref,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import { createFoundationScope } from "semi-animation-vue/lifecycle";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { SpinIcon } from "./icon.js";
import type { SpinProps, SpinSlots } from "./types.js";

const prefixCls = "semi-spin";
const builtins = Object.freeze({
  size: "middle" as const,
  spinning: true,
  delay: 0,
});

function definedRootAttrs(attrs: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key, value]) =>
        value !== undefined &&
        (key === "role" || key.startsWith("aria-") || key.startsWith("data-")),
    ),
  );
}

const SpinComponent = defineVaporComponent<SpinProps, {}, string, {}>(
  (props: SpinProps) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const resources = createFoundationScope();
    const resolver = createDefaultPropsResolver(semiGlobal, "Spin", builtins);
    const loading = ref(true);
    let cancelPending: (() => void) | undefined;

    // React defaultProps treats an explicit undefined as absent. The generic
    // context resolver intentionally preserves it, so omit it before resolve.
    const resolved = computed(() => {
      const raw = Object.fromEntries(
        Object.entries(props).filter(([, value]) => value !== undefined),
      );
      const merged = resolver.resolve(raw);
      return {
        size: merged.size,
        spinning: merged.spinning,
        delay: merged.delay,
        tip: merged.tip,
        wrapperClassName: merged.wrapperClassName,
        childStyle: merged.childStyle,
        style: merged.style,
      };
    });
    // The upstream constructor starts true, then derived state immediately
    // applies an undelayed `spinning` value. A captured global `undefined`
    // therefore remains an effective undefined loading value, not `true`.
    if (!resolved.value.delay) loading.value = resolved.value.spinning === true;
    else if (resolved.value.spinning === false) loading.value = false;
    const hasChildren = computed(() => slots.default !== undefined);

    const cancel = () => {
      const pending = cancelPending;
      cancelPending = undefined;
      pending?.();
      resources.invalidate();
    };
    const schedule = (delay: number, spinning: boolean | undefined) => {
      cancel();
      const task = resources.task();
      cancelPending = resources.timeout(() => {
        task.commit(() => {
          cancelPending = undefined;
          loading.value = spinning === true;
        });
      }, delay);
    };

    watch(
      resolved,
      (next, previous) => {
        if (!next.delay) {
          cancel();
          loading.value = next.spinning === true;
          return;
        }
        if (next.spinning === false) {
          cancel();
          loading.value = false;
          return;
        }
        if (
          next.spinning === previous.spinning &&
          next.delay === previous.delay
        )
          return;
        if (!loading.value || next.spinning === undefined || cancelPending) {
          schedule(next.delay, next.spinning);
        }
      },
      { flush: "sync" },
    );
    // A global own undefined can replace the built-in boolean. The fixed
    // upstream constructor is initially visible with a truthy delay, then its
    // timer applies that effective undefined value as hidden.
    if (resolved.value.delay && resolved.value.spinning === undefined)
      schedule(resolved.value.delay, undefined);
    onBeforeUnmount(() => resources.dispose());

    return (
      <div
        class={[
          prefixCls,
          attrs.class,
          resolved.value.wrapperClassName,
          resolved.value.size && `${prefixCls}-${resolved.value.size}`,
          hasChildren.value && `${prefixCls}-block`,
          !loading.value && `${prefixCls}-hidden`,
        ]}
        style={resolved.value.style}
        {...definedRootAttrs(attrs)}
      >
        {loading.value ? (
          <div class={`${prefixCls}-wrapper`}>
            {slots.indicator ? (
              <div class={`${prefixCls}-animate`} x-semi-prop="indicator">
                <slot name="indicator" />
              </div>
            ) : (
              <SpinIcon />
            )}
            {slots.tip ? (
              <div x-semi-prop="tip">
                <slot name="tip" />
              </div>
            ) : resolved.value.tip ? (
              <div x-semi-prop="tip">{resolved.value.tip}</div>
            ) : null}
          </div>
        ) : null}
        <div class={`${prefixCls}-children`} style={resolved.value.childStyle}>
          <slot />
        </div>
      </div>
    );
  },
  {
    props: [
      "size",
      "spinning",
      "delay",
      "tip",
      "wrapperClassName",
      "childStyle",
      "style",
    ],
    inheritAttrs: false,
  },
);

type SpinComponentType = typeof SpinComponent & {
  new (props: SpinProps): { $props: SpinProps; $slots: SpinSlots };
};

export const Spin = Object.assign(SpinComponent, {
  __SemiComponentName__: "Spin" as const,
}) as SpinComponentType & { readonly __SemiComponentName__: "Spin" };
export default Spin;
