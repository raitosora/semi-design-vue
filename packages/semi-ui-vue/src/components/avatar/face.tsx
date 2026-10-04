import {
  computed,
  createComponent,
  createFor,
  createSlot,
  defineVaporComponent,
  ref,
  watch,
} from "vue";
import type { ShallowRef } from "vue";
import type { AvatarProps } from "./types.js";
import { avatarCallbacks } from "./input.js";
import { avatarImageKey, AvatarImage } from "./image.js";
import { AvatarContentView } from "./render.js";
import { useAvatarMeasure } from "./measure.js";

export interface AvatarFaceProps {
  source: AvatarProps;
  attrs: Record<string, unknown>;
  hostAttrs: Record<string, unknown>;
  wrapped: boolean;
  hover: boolean;
  hasSlot: boolean;
  bind: (element: HTMLSpanElement | null) => void;
  enter: (event: MouseEvent) => void;
  leave: (event: MouseEvent) => void;
  click: (event: MouseEvent | KeyboardEvent) => void;
  overlap: string | undefined;
}
export const AvatarFace = defineVaporComponent<AvatarFaceProps, {}, string, {}>(
  (props) => {
    const root = ref<HTMLElement | null>(null);
    const content = ref<HTMLElement | null>(null);
    const failed = ref(false);
    const focused = ref(false);
    let focusedElement: HTMLElement | undefined;
    const imageSource = computed(() => avatarImageKey(props.source));
    watch(
      imageSource,
      () => {
        failed.value = false;
      },
      { flush: "sync" },
    );
    const image = computed(() => !!props.source.src && !failed.value);
    const clickable = computed(
      () => avatarCallbacks(props.source.onClick).length > 0,
    );
    // Removing a focused native node need not dispatch blur. Reconcile after
    // branch/source updates while preserving focus for same-node text updates.
    watch(
      [
        imageSource,
        image,
        () => props.hasSlot,
        () => typeof props.source.children,
        clickable,
      ],
      () => {
        if (focusedElement?.ownerDocument.activeElement !== focusedElement) {
          focused.value = false;
          focusedElement = undefined;
        }
      },
      { flush: "post" },
    );
    const scale = useAvatarMeasure(root, content, () => props.source.gap ?? 3);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        props.click(event);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === "Escape") (event.target as HTMLElement).blur();
    };
    const focus = (event: FocusEvent) => {
      focusedElement = event.target as HTMLElement;
      focused.value = focusedElement.matches(":focus-visible");
    };
    const blur = () => {
      focusedElement = undefined;
      focused.value = false;
    };
    const imageTree = () =>
      createFor(
        () => (image.value ? [imageSource.value] : []),
        (_source: ShallowRef<string>) =>
          createComponent(AvatarImage, {
            source: () => props.source,
            failed: () => () => {
              failed.value = true;
            },
            clickable: () => clickable.value,
            onKey: () => key,
            onFocus: () => focus,
            onBlur: () => blur,
          }),
        (source: string) => source,
      );
    const label = computed(
      () => props.source.alt ?? String(props.source.children ?? ""),
    );
    return (
      <span
        {...props.attrs}
        {...props.hostAttrs}
        class={[
          "semi-avatar",
          props.source.shape && `semi-avatar-${props.source.shape}`,
          props.source.size && `semi-avatar-${props.source.size}`,
          !image.value &&
            props.source.color &&
            `semi-avatar-${props.source.color}`,
          image.value && "semi-avatar-img",
          focused.value && "semi-avatar-focus",
          props.source.contentMotion && "semi-avatar-animated",
          props.source.className,
          props.source.class,
          props.overlap,
        ]}
        onClick={(value: unknown) => {
          const event = value as MouseEvent;
          if (!props.wrapped) props.click(event);
        }}
        onMouseenter={(value: unknown) => {
          const event = value as MouseEvent;
          if (!props.wrapped) props.enter(event);
        }}
        onMouseleave={(value: unknown) => {
          const event = value as MouseEvent;
          if (!props.wrapped) props.leave(event);
        }}
        ref={(element: HTMLSpanElement | null) => {
          root.value = element;
          props.bind(element);
        }}
        role="listitem"
      >
        {image.value ? (
          imageTree()
        ) : props.hasSlot ? (
          createSlot()
        ) : typeof props.source.children === "string" ? (
          <span
            class="semi-avatar-content"
            ref={content}
            style={{ transform: `scale(${scale.value})` }}
          >
            <span
              aria-label={
                clickable.value
                  ? `clickable Avatar: ${label.value}`
                  : label.value
              }
              class={[
                "semi-avatar-label",
                clickable.value && "semi-avatar-no-focus-visible",
              ]}
              onBlur={blur}
              onFocus={(event: unknown) => focus(event as FocusEvent)}
              onKeydown={(value: unknown) => {
                const event = value as KeyboardEvent;
                if (clickable.value) key(event);
              }}
              role="img"
              tabindex={clickable.value ? 0 : undefined}
              x-semi-prop="children"
            >
              {props.source.children}
            </span>
          </span>
        ) : (
          props.source.children
        )}
        {props.hover && props.source.hoverMask ? (
          <div class="semi-avatar-hover" x-semi-prop="hoverContent">
            <AvatarContentView content={props.source.hoverMask} />
          </div>
        ) : null}
      </span>
    );
  },
  {
    props: [
      "source",
      "attrs",
      "hostAttrs",
      "wrapped",
      "hover",
      "hasSlot",
      "bind",
      "enter",
      "leave",
      "click",
      "overlap",
    ],
    inheritAttrs: false,
  },
);
