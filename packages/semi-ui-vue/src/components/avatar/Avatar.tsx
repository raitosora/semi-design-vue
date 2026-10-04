import {
  computed,
  defineVaporComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useSlots,
} from "vue";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import { AvatarFace } from "./face.js";
import { AvatarTop, AvatarBottom, AvatarBorder } from "./decorations.js";
import {
  avatarCallbacks,
  avatarSizes,
  safeAvatarAttrs,
  validateAvatarProps,
} from "./input.js";
import { useAvatarGroup } from "./group-context.js";
import type { AvatarProps, AvatarSlots } from "./types.js";
const avatarKeys = [
  "children",
  "className",
  "class",
  "style",
  "color",
  "shape",
  "size",
  "hoverMask",
  "src",
  "srcSet",
  "alt",
  "gap",
  "onError",
  "onClick",
  "onMouseEnter",
  "onMouseLeave",
  "imgAttr",
  "bottomSlot",
  "topSlot",
  "border",
  "contentMotion",
] as const;
const builtins = Object.freeze({
  size: "medium",
  color: "grey" as const,
  shape: "circle" as const,
  gap: 3,
});
const Component = defineVaporComponent<AvatarProps, {}, string, {}>(
  (props) => {
    const attrs = useAttrs();
    const slots = useSlots();
    const group = useAvatarGroup();
    const id = Symbol("avatar");
    const root = ref<HTMLElement | null>(null);
    const hover = ref(false);
    const resolver = createDefaultPropsResolver(semiGlobal, "Avatar", builtins);
    const own = computed(
      () =>
        resolver.resolve(
          Object.fromEntries(
            Object.entries(props).filter(([, value]) => value !== undefined),
          ),
        ) as AvatarProps,
    );
    const source = computed<AvatarProps>(() => {
      const value = group
        ? {
            ...own.value,
            ...group.value.rest,
            className: own.value.className,
            children: own.value.children,
            size: group.value.size,
            shape: group.value.shape,
          }
        : own.value;
      validateAvatarProps(value);
      return value;
    });
    source.value;
    const state = computed(() => group?.value.getState(id));
    const overlap = computed(() =>
      state.value && state.value.index >= 0 && group?.value.overlapFrom
        ? `semi-avatar-item-${group.value.overlapFrom}-${state.value.index}`
        : undefined,
    );
    const hidden = computed(() => state.value?.hidden === true);
    const wrapped = computed(
      () =>
        !!(
          source.value.topSlot ||
          source.value.bottomSlot ||
          source.value.border
        ),
    );
    const customStyle = computed(() => [
      !avatarSizes.includes(source.value.size ?? "")
        ? { width: source.value.size, height: source.value.size }
        : {},
      source.value.style,
    ]);
    const style = computed(() => [
      customStyle.value,
      hidden.value ? { display: "none" } : {},
    ]);
    const nativeAttrs = computed(() =>
      safeAvatarAttrs(
        Object.fromEntries(
          Object.entries({ ...attrs, ...group?.value.rest }).filter(
            ([key]) => !new Set<string>(avatarKeys).has(key),
          ),
        ),
      ),
    );
    const rootAttrs = computed(() => ({
      ...Object.fromEntries(
        Object.entries(nativeAttrs.value).filter(([key]) =>
          ["hidden", "inert", "aria-hidden"].includes(key),
        ),
      ),
      style: style.value,
      ...(hidden.value
        ? { hidden: true, inert: true, "aria-hidden": "true" as const }
        : {}),
    }));
    const faceAttrs = nativeAttrs;
    let active = true;
    let release: (() => void) | undefined;
    const click = (event: MouseEvent | KeyboardEvent) => {
      for (const callback of avatarCallbacks(source.value.onClick))
        callback(event);
    };
    const enter = (event: MouseEvent) => {
      hover.value = true;
      void nextTick(() => {
        if (active)
          for (const callback of avatarCallbacks(source.value.onMouseEnter))
            callback(event);
      });
    };
    const leave = (event: MouseEvent) => {
      hover.value = false;
      void nextTick(() => {
        if (active)
          for (const callback of avatarCallbacks(source.value.onMouseLeave))
            callback(event);
      });
    };
    const faceBind = (element: HTMLSpanElement | null) => {
      if (!wrapped.value) root.value = element;
    };
    onMounted(() => {
      release = group?.value.register({
        id,
        element: () => root.value,
        props: () => own.value,
        label: () =>
          own.value.alt ??
          (typeof own.value.children === "string" ? own.value.children : ""),
      });
    });
    onBeforeUnmount(() => {
      active = false;
      release?.();
    });
    return (
      <>
        {wrapped.value ? (
          <span
            class={["semi-avatar-wrapper", overlap.value]}
            {...rootAttrs.value}
            onClick={(event: unknown) => click(event as MouseEvent)}
            onMouseenter={(event: unknown) => enter(event as MouseEvent)}
            onMouseleave={(event: unknown) => leave(event as MouseEvent)}
            ref={root}
          >
            {source.value.border ? (
              <div style={[{ position: "relative" }, customStyle.value]}>
                <AvatarFace
                  attrs={faceAttrs.value}
                  bind={faceBind}
                  click={click}
                  enter={enter}
                  hasSlot={slots.default !== undefined}
                  hostAttrs={{}}
                  hover={hover.value}
                  leave={leave}
                  overlap={undefined}
                  source={source.value}
                  wrapped={true}
                >
                  {() => <slot />}
                </AvatarFace>
                <AvatarBorder source={source.value} />
              </div>
            ) : (
              <AvatarFace
                attrs={faceAttrs.value}
                bind={faceBind}
                click={click}
                enter={enter}
                hasSlot={slots.default !== undefined}
                hostAttrs={{}}
                hover={hover.value}
                leave={leave}
                overlap={undefined}
                source={source.value}
                wrapped={true}
              >
                {() => <slot />}
              </AvatarFace>
            )}
            {source.value.topSlot &&
            source.value.shape === "circle" &&
            avatarSizes.slice(1).includes(source.value.size ?? "") ? (
              <AvatarTop source={source.value} />
            ) : null}
            {source.value.bottomSlot &&
            avatarSizes.slice(1).includes(source.value.size ?? "") ? (
              <AvatarBottom source={source.value} />
            ) : null}
          </span>
        ) : (
          <AvatarFace
            attrs={faceAttrs.value}
            bind={faceBind}
            click={click}
            enter={enter}
            hasSlot={slots.default !== undefined}
            hostAttrs={rootAttrs.value}
            hover={hover.value}
            leave={leave}
            overlap={overlap.value}
            source={source.value}
            wrapped={false}
          >
            {() => <slot />}
          </AvatarFace>
        )}
      </>
    );
  },
  { props: [...avatarKeys], inheritAttrs: false },
);
export const Avatar = Object.assign(Component, {
  __SemiComponentName__: "Avatar" as const,
  elementType: "Avatar" as const,
}) as typeof Component & {
  new (props: AvatarProps): { $props: AvatarProps; $slots: AvatarSlots };
  readonly __SemiComponentName__: "Avatar";
  readonly elementType: "Avatar";
};
export default Avatar;
