import { defineVaporComponent, onBeforeUnmount } from "vue";
import type { AvatarProps } from "./types.js";
import { avatarAttrName, safeAvatarAttrs } from "./input.js";

export function avatarImageKey(source: AvatarProps): string {
  return JSON.stringify([
    source.src,
    source.srcSet,
    source.imgAttr?.src,
    source.imgAttr?.srcset,
  ]);
}
export function avatarImageAttrs(source: AvatarProps) {
  return safeAvatarAttrs(
    Object.fromEntries(
      Object.entries(source.imgAttr ?? {}).filter(([key]) => {
        const normalized = avatarAttrName(key).replace(/^on:/, "on");
        if (
          /^on(?:error|load|abort|keydown|focus|blur)(?:(?:once|capture|passive))*$/.test(
            normalized,
          )
        )
          return false;
        if (["class", "classname", "tabindex"].includes(normalized))
          return false;
        if (normalized === "src" || normalized === "srcset")
          return key === normalized;
        return true;
      }),
    ),
  );
}
export interface AvatarImageProps {
  source: AvatarProps;
  failed: () => void;
  clickable: boolean;
  onKey: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: () => void;
}
/** Each source revision owns its image and callbacks; detached revisions go inert. */
export const AvatarImage = defineVaporComponent<
  AvatarImageProps,
  {},
  string,
  {}
>(
  (props) => {
    let active = true;
    const revision = avatarImageKey(props.source);
    onBeforeUnmount(() => {
      active = false;
    });
    const current = () => active && avatarImageKey(props.source) === revision;
    const error = (event: Event) => {
      if (!current()) return;
      const override = props.source.imgAttr?.onError;
      if (override) {
        override(event);
        return;
      }
      if (props.source.onError?.() !== false && current()) props.failed();
    };
    return (
      <img
        alt={
          props.clickable
            ? `clickable Avatar: ${props.source.alt}`
            : props.source.alt
        }
        src={props.source.src}
        srcset={props.source.srcSet}
        {...avatarImageAttrs(props.source)}
        class={props.clickable ? "semi-avatar-no-focus-visible" : undefined}
        onAbort={(value: unknown) => {
          if (current()) props.source.imgAttr?.onAbort?.(value as UIEvent);
        }}
        onBlur={(value: unknown) => {
          if (!current()) return;
          const event = value as FocusEvent;
          if (props.clickable) props.onBlur();
          else props.source.imgAttr?.onBlur?.(event);
        }}
        onError={(event: unknown) => error(event as Event)}
        onFocus={(value: unknown) => {
          if (!current()) return;
          const event = value as FocusEvent;
          if (props.clickable) props.onFocus(event);
          else props.source.imgAttr?.onFocus?.(event);
        }}
        onKeydown={(value: unknown) => {
          if (!current()) return;
          const event = value as KeyboardEvent;
          if (props.clickable) props.onKey(event);
          else props.source.imgAttr?.onKeydown?.(event);
        }}
        onLoad={(value: unknown) => {
          if (current()) props.source.imgAttr?.onLoad?.(value as Event);
        }}
        tabindex={props.clickable ? 0 : props.source.imgAttr?.tabindex}
      />
    );
  },
  {
    props: ["source", "failed", "clickable", "onKey", "onFocus", "onBlur"],
    inheritAttrs: false,
  },
);
