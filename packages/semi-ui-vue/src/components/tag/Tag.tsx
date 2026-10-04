import {
  computed,
  defineVaporComponent,
  inject,
  onBeforeUnmount,
  provide,
  ref,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import IconClose from "semi-icons-vue/IconClose";
import { createDefaultPropsResolver, semiGlobal } from "../../context/index.js";
import Avatar from "../avatar/Avatar.js";
import { safeTagAttrs, tagCallbacks, validateTagProps } from "./input.js";
import { TagContentView } from "./render.js";
import { tagTriggerKey } from "./trigger-context.js";
import type { TagProps, TagSlots } from "./types.js";
const tagKeys = [
  "children",
  "tagKey",
  "size",
  "color",
  "type",
  "closable",
  "onClose",
  "onClick",
  "onKeyDown",
  "onMouseEnter",
  "prefixIcon",
  "suffixIcon",
  "style",
  "class",
  "className",
  "avatarSrc",
  "avatarShape",
  "shape",
  "colorful",
  "gradient",
  "tabIndex",
] as const;
const defaultClick = () => undefined;
const builtins = Object.freeze({
  size: "default" as const,
  color: "grey" as const,
  type: "light" as const,
  closable: false,
  onClick: defaultClick,
  shape: "square" as const,
  avatarShape: "square" as const,
  prefixIcon: null,
  suffixIcon: null,
  colorful: false,
  gradient: false,
});
const Component = defineVaporComponent<TagProps, {}, string, {}>(
  (props: TagProps) => {
    let active = true;
    onBeforeUnmount(() => {
      active = false;
    });
    const attrs = useAttrs();
    const slots = useSlots();
    const trigger = inject(tagTriggerKey, undefined);
    provide(tagTriggerKey, undefined);
    const resolver = createDefaultPropsResolver(semiGlobal, "Tag", builtins);
    const capturedDefaultOnClick = resolver.resolve({}).onClick;
    const source = computed(() => {
      const value = resolver.resolve({
        ...Object.fromEntries(
          Object.entries(props).filter(([, value]) => value !== undefined),
        ),
        ...(Object.hasOwn(attrs, "visible")
          ? { visible: attrs.visible as boolean | undefined }
          : {}),
      }) as TagProps;
      validateTagProps(value);
      return value;
    });
    const visible = ref<boolean | undefined>(true);
    watch(
      source,
      (value) => {
        if (Object.hasOwn(value, "visible")) visible.value = value.visible;
      },
      { immediate: true, flush: "sync" },
    );
    const clickable = computed(
      () =>
        source.value.onClick !== capturedDefaultOnClick ||
        source.value.closable ||
        typeof trigger?.value.triggerProps.onClick === "function",
    );
    const nativeAttrs = computed(() => safeTagAttrs(attrs));
    const triggerProps = computed(() =>
      safeTagAttrs(
        Object.fromEntries(
          Object.entries(trigger?.value.triggerProps ?? {}).filter(
            ([key]) => !["onClick", "onMouseenter", "onKeydown"].includes(key),
          ),
        ),
      ),
    );
    const click = (event: MouseEvent | KeyboardEvent) => {
      if (!active) return;
      const callbacks = tagCallbacks(source.value.onClick);
      const bridgeClick: unknown = trigger?.value.triggerProps.onClick;
      if (typeof bridgeClick === "function") bridgeClick(event);
      for (const callback of callbacks) callback(event);
    };
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (!active) return;
      const value = slots.default ?? source.value.children;
      const tagKey = source.value.tagKey;
      const callbacks = tagCallbacks(source.value.onClose);
      event.stopPropagation();
      event.stopImmediatePropagation();
      for (const callback of callbacks) callback(value, event, tagKey);
      if (!event.defaultPrevented && !Object.hasOwn(source.value, "visible"))
        visible.value = false;
    };
    const keydown = (event: KeyboardEvent) => {
      if (!active) return;
      const callbacks = tagCallbacks(source.value.onKeyDown);
      const bridgeKeydown: unknown = trigger?.value.triggerProps.onKeydown;
      if (clickable.value) {
        if (event.key === "Delete" || event.key === "Backspace") {
          if (source.value.closable) close(event);
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === "Enter") {
          // Tooltip clones its click handler before the child handler upstream.
          // The private native bridge retains that order for keyboard activation.
          click(event);
          event.stopPropagation();
          event.preventDefault();
        } else if (event.key === "Escape") {
          const target = event.target as HTMLElement | null;
          target?.blur?.();
        }
      }
      if (typeof bridgeKeydown === "function") bridgeKeydown(event);
      for (const callback of callbacks) callback(event);
    };
    return (
      <div
        {...trigger?.value.attrs}
        {...triggerProps.value}
        {...nativeAttrs.value}
        aria-label={
          Object.hasOwn(attrs, "aria-label")
            ? (attrs["aria-label"] as string | undefined)
            : typeof source.value.children === "string" && !slots.default
              ? `${source.value.closable ? "Closable " : ""}Tag: ${source.value.children}`
              : ""
        }
        class={[
          "semi-tag",
          `semi-tag-${source.value.size}`,
          `semi-tag-${source.value.shape}`,
          `semi-tag-${source.value.type}`,
          `semi-tag-${source.value.color}-${source.value.type}`,
          {
            "semi-tag-closable": source.value.closable,
            "semi-tag-invisible": !visible.value,
            "semi-tag-colorful": source.value.colorful,
            "semi-tag-gradient": source.value.gradient,
          },
          source.value.avatarSrc
            ? `semi-tag-avatar-${source.value.avatarShape}`
            : undefined,
          source.value.class,
          source.value.className,
        ]}
        onClick={(event: unknown) => click(event as MouseEvent)}
        onKeydown={(event: unknown) => keydown(event as KeyboardEvent)}
        onMouseenter={(event: unknown) => {
          if (!active) return;
          const callbacks = tagCallbacks(source.value.onMouseEnter);
          const bridgeEnter: unknown = trigger?.value.triggerProps.onMouseenter;
          if (typeof bridgeEnter === "function") bridgeEnter(event);
          for (const callback of callbacks) callback(event as MouseEvent);
        }}
        ref={(element: Element | null) => trigger?.value.triggerRef(element)}
        role={
          clickable.value
            ? "button"
            : (nativeAttrs.value.role as string | undefined)
        }
        style={source.value.style}
        tabindex={
          clickable.value
            ? source.value.tabIndex || 0
            : (source.value.tabIndex ?? trigger?.value.triggerProps.tabIndex)
        }
      >
        {source.value.prefixIcon ? (
          <div class="semi-tag-prefix-icon">
            <TagContentView content={source.value.prefixIcon} />
          </div>
        ) : null}
        {source.value.avatarSrc ? (
          <Avatar
            shape={source.value.avatarShape}
            src={source.value.avatarSrc}
          />
        ) : null}
        <div
          class={[
            "semi-tag-content",
            `semi-tag-content-${typeof source.value.children === "string" && !slots.default ? "ellipsis" : "center"}`,
          ]}
        >
          {slots.default ? (
            <slot />
          ) : (
            <TagContentView content={source.value.children} />
          )}
        </div>
        {source.value.suffixIcon ? (
          <div class="semi-tag-suffix-icon">
            <TagContentView content={source.value.suffixIcon} />
          </div>
        ) : null}
        {source.value.closable ? (
          <div
            class="semi-tag-close"
            onClick={(event: unknown) => close(event as MouseEvent)}
          >
            <IconClose size="small" />
          </div>
        ) : null}
      </div>
    );
  },
  { props: [...tagKeys], inheritAttrs: false },
);
export const Tag = Object.assign(Component, {
  __SemiComponentName__: "Tag" as const,
}) as typeof Component & {
  new (props: TagProps): { $props: TagProps; $slots: TagSlots };
  readonly __SemiComponentName__: "Tag";
};
export default Tag;
