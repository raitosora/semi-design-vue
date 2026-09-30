import {
  computed,
  defineVaporComponent,
  onBeforeUnmount,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  watch,
} from "vue";
import { waitForMotion, type MotionHandle } from "semi-animation-vue";
import {
  createFoundationScope,
  observeMediaQuery,
} from "semi-animation-vue/lifecycle";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import type { CollapsibleProps, CollapsibleSlots } from "./types.js";

const builtins = Object.freeze({
  isOpen: false,
  duration: 250,
  motion: true,
  keepDOM: false,
  lazyRender: false,
  collapseHeight: 0,
  collapseHeightAdaptive: false,
  fade: false,
});
export function getEntryInfo(entry: ResizeObserverEntry) {
  const box = entry.borderBoxSize?.[0];
  return {
    isShown: box
      ? !(box.blockSize === 0 && box.inlineSize === 0)
      : !(entry.contentRect.height === 0 && entry.contentRect.width === 0),
    height: box
      ? Math.ceil(box.blockSize)
      : (entry.target as HTMLElement).clientHeight,
  };
}
const Component = defineVaporComponent<CollapsibleProps, {}, string, {}>(
  (props: CollapsibleProps) => {
    const attrs = useAttrs();
    const root = ref<HTMLDivElement | null>(null);
    const content = ref<HTMLDivElement | null>(null);
    const resolver = createDefaultPropsResolver(
      semiGlobal,
      "Collapsible",
      builtins,
    );
    const resolved = computed(() =>
      resolver.resolve(
        Object.fromEntries(
          Object.entries(props).filter(([, v]) => v !== undefined),
        ),
      ),
    );
    const open = () => !!resolved.value.isOpen;
    const retained = ref(open());
    const rendered = ref(false);
    const transitioning = ref(false);
    const height = ref(0);
    const reduced = ref(false);
    const scope = createFoundationScope();
    let observer: ResizeObserver | undefined;
    let motion: MotionHandle | undefined;
    let generation = 0;
    let ready = false;
    let shown = false;
    const requestVersion = ref(0);
    const cancel = () => {
      generation++;
      motion?.cancel();
      motion = undefined;
    };
    scope.own(
      observeMediaQuery(
        () => "(prefers-reduced-motion: reduce)",
        (v) => {
          reduced.value = v;
        },
        () => root.value?.ownerDocument.defaultView ?? undefined,
      ),
    );
    const shouldRender = computed(
      () =>
        !!(
          (resolved.value.keepDOM &&
            (!resolved.value.lazyRender || rendered.value)) ||
          resolved.value.collapseHeight !== 0 ||
          retained.value ||
          open()
        ),
    );
    watch(
      shouldRender,
      (value) => {
        if (value) rendered.value = true;
      },
      { immediate: true, flush: "sync" },
    );
    const measure = () => {
      if (content.value && scope.active)
        height.value = content.value.scrollHeight;
    };
    watch(
      open,
      () => {
        cancel();
        if (open()) retained.value = true;
        else if (!resolved.value.motion || reduced.value)
          retained.value = false;
        transitioning.value = !!resolved.value.motion && !reduced.value;
        requestVersion.value++;
      },
      { flush: "sync" },
    );
    watch(
      [() => resolved.value.motion, () => reduced.value],
      () => {
        if (!resolved.value.motion || reduced.value) {
          cancel();
          transitioning.value = false;
          retained.value = open();
        }
      },
      { flush: "sync" },
    );
    // A request owns its completion. Native child events and cancelled generations
    // cannot hide a replacement; fallback settlement also handles absent CSS events.
    watch(
      [
        open,
        () => resolved.value.motion,
        () => resolved.value.duration,
        () => reduced.value,
        () => requestVersion.value,
        () => resolved.value.style,
      ],
      () => {
        if (!ready) return;
        cancel();
        const current = generation;
        const requested = open();
        if (!resolved.value.motion || reduced.value) {
          transitioning.value = false;
          retained.value = requested;
          return;
        }
        if (!transitioning.value) return;
        measure();
        const node = root.value;
        if (!node) return;
        // Use final computed CSS timings, including caller duration/delay overrides.
        // waitForMotion applies its own computed fallback within the native timer bound.
        const limit = 2147483647;
        // Vapor DOM effects must commit the final style before reading native
        // animations, otherwise a previous transitioncancel can end this request.
        void nextTick(() => {
          if (
            !scope.active ||
            current !== generation ||
            requested !== open() ||
            node !== root.value
          )
            return;
          motion = waitForMotion(
            node,
            { kind: "transition", timeout: limit, ignoreCancel: true },
            () => {
              if (
                !scope.active ||
                current !== generation ||
                requested !== open()
              )
                return;
              motion = undefined;
              transitioning.value = false;
              // Callback precedes removal of the retained slot tree.
              try {
                resolved.value.onMotionEnd?.();
              } finally {
                if (current === generation && scope.active && !open())
                  retained.value = false;
              }
            },
          );
        });
      },
      { flush: "post", deep: true },
    );
    watch([() => resolved.value.reCalcKey, shouldRender], measure, {
      flush: "post",
    });
    onMounted(() => {
      ready = true;
      measure();
      const node = content.value!;
      shown = node.offsetHeight > 0;
      const Observer = node.ownerDocument.defaultView?.ResizeObserver;
      if (Observer) {
        observer = new Observer((entries) => {
          if (!scope.active) return;
          const entry = entries.find((e) => e.target === content.value);
          if (entry) {
            const info = getEntryInfo(entry);
            height.value = info.height;
            if (info.isShown && !shown) measure();
            shown = info.isShown;
          }
        });
        observer.observe(node);
      }
    });
    onBeforeUnmount(() => {
      ready = false;
      cancel();
      observer?.disconnect();
      scope.dispose();
    });
    const nativeAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(
          ([name]) =>
            ![
              "innerHTML",
              "textContent",
              "onTransitionend",
              "onTransitionEnd",
            ].includes(name),
        ),
      ),
    );
    const wrapperStyle = computed(() => ({
      overflow: "hidden",
      height: `${open() ? height.value : resolved.value.collapseHeightAdaptive ? Math.min(height.value, resolved.value.collapseHeight!) : resolved.value.collapseHeight}px`,
      opacity:
        open() || !resolved.value.fade || resolved.value.collapseHeight !== 0
          ? 1
          : 0,
      transitionDuration: `${resolved.value.motion && transitioning.value && !reduced.value ? (resolved.value.duration ?? 0) : 0}ms`,
    }));
    return (
      <div
        {...nativeAttrs.value}
        class={[
          "semi-collapsible-wrapper",
          resolved.value.motion &&
            transitioning.value &&
            !reduced.value &&
            "semi-collapsible-transition",
          attrs.class,
          resolved.value.className,
        ]}
        ref={root}
        style={[
          wrapperStyle.value,
          resolved.value.style,
          reduced.value && {
            transitionDuration: "0ms",
            transitionDelay: "0ms",
          },
        ]}
      >
        <div
          id={resolved.value.id}
          ref={content}
          style={{ overflow: "hidden" }}
          x-semi-prop="children"
        >
          {shouldRender.value ? <slot /> : null}
        </div>
      </div>
    );
  },
  {
    props: [
      "isOpen",
      "motion",
      "duration",
      "keepDOM",
      "lazyRender",
      "collapseHeight",
      "collapseHeightAdaptive",
      "fade",
      "reCalcKey",
      "id",
      "className",
      "style",
      "onMotionEnd",
      "children",
    ],
    inheritAttrs: false,
  },
);
type ComponentType = typeof Component & {
  new (props: CollapsibleProps): {
    $props: CollapsibleProps;
    $slots: CollapsibleSlots;
  };
};
export const Collapsible = Object.assign(Component, {
  __SemiComponentName__: "Collapsible" as const,
  getEntryInfo,
}) as ComponentType & {
  readonly __SemiComponentName__: "Collapsible";
  readonly getEntryInfo: typeof getEntryInfo;
};
export default Collapsible;
