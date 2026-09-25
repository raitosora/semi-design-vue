import {
  computed,
  defineVaporComponent,
  inject,
  onMounted,
  onScopeDispose,
  useAttrs,
  watch,
} from "vue";
import { layoutSiderRegistryKey } from "./context.js";
import type {
  LayoutBreakpoint,
  ResponsiveMap,
  SiderProps,
  SiderSlots,
} from "./types.js";

export const responsiveMap: Readonly<ResponsiveMap> = {
  xs: "(max-width: 575px)",
  sm: "(min-width: 576px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 992px)",
  xl: "(min-width: 1200px)",
  xxl: "(min-width: 1600px)",
};
const breakpoints = Object.keys(responsiveMap) as LayoutBreakpoint[];

const Component = defineVaporComponent<SiderProps, {}, string, {}>(
  (props: SiderProps) => {
    const attrs = useAttrs();
    const registry = inject(layoutSiderRegistryKey, undefined);
    const id = Symbol("semi-layout-sider");
    const prefix = computed(() =>
      props.prefixCls === undefined ? "semi-layout" : props.prefixCls,
    );
    const dataAttrs = computed(() =>
      Object.fromEntries(
        Object.entries(attrs).filter(([name]) => name.startsWith("data-")),
      ),
    );
    const selected = computed(() =>
      breakpoints
        .filter((screen) => props.breakpoint?.includes(screen))
        .join("|"),
    );
    let mounted = false;
    let removeListeners: Array<() => void> = [];
    function clearListeners() {
      for (const remove of removeListeners) remove();
      removeListeners = [];
    }
    function subscribe() {
      clearListeners();
      if (
        !mounted ||
        typeof window === "undefined" ||
        typeof window.matchMedia !== "function"
      )
        return;
      for (const screen of breakpoints) {
        if (!selected.value.split("|").includes(screen)) continue;
        const media = window.matchMedia(responsiveMap[screen]);
        const notify = (event: MediaQueryList | MediaQueryListEvent) =>
          props.onBreakpoint?.(screen, event.matches);
        notify(media);
        if (typeof media.addEventListener === "function") {
          media.addEventListener("change", notify);
          removeListeners.push(() =>
            media.removeEventListener("change", notify),
          );
        } else {
          media.addListener(notify);
          removeListeners.push(() => media.removeListener(notify));
        }
      }
    }
    watch(selected, subscribe);
    onMounted(() => {
      mounted = true;
      subscribe();
      registry?.add(id);
    });
    onScopeDispose(() => {
      mounted = false;
      clearListeners();
      registry?.remove(id);
    });
    return (
      <aside
        {...dataAttrs.value}
        aria-label={
          props["aria-label"] ??
          (props as SiderProps & { ariaLabel?: string }).ariaLabel ??
          (attrs["aria-label"] as string | undefined)
        }
        class={[`${prefix.value}-sider`, attrs.class, props.className]}
        style={props.style}
        x-semi-prop="children"
      >
        <div class={`${prefix.value}-sider-children`}>
          <slot />
        </div>
      </aside>
    );
  },
  {
    props: [
      "prefixCls",
      "className",
      "style",
      "breakpoint",
      "onBreakpoint",
      "aria-label",
      "role",
      "children",
    ],
    inheritAttrs: false,
  },
);

type SiderComponent = typeof Component & {
  new (props: SiderProps): { $props: SiderProps; $slots: SiderSlots };
};
export const Sider = Component as SiderComponent;
export default Sider;
