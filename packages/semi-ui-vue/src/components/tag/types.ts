import type { HTMLAttributes, VaporRenderResult } from "vue";
export type TagColor =
  | "amber"
  | "blue"
  | "cyan"
  | "green"
  | "grey"
  | "indigo"
  | "light-blue"
  | "light-green"
  | "lime"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "teal"
  | "violet"
  | "yellow"
  | "white";
export type TagType = "ghost" | "solid" | "light";
export type TagSize = "default" | "small" | "large";
export type TagShape = "circle" | "square";
export type TagRenderResult =
  | VaporRenderResult
  | string
  | number
  | boolean
  | null
  | undefined
  | TagRenderResult[];
export type TagContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => TagRenderResult);
export interface TagSlots {
  readonly default?: (() => VaporRenderResult) | undefined;
}
export interface TagProps extends Omit<
  HTMLAttributes,
  "innerHTML" | "textContent" | "onClick" | "onKeydown" | "onMouseenter"
> {
  readonly children?: TagContent;
  readonly "v-slots"?: TagSlots | TagSlots["default"] | undefined;
  readonly tagKey?: string | number | undefined;
  readonly size?: TagSize | undefined;
  readonly color?: TagColor | undefined;
  readonly type?: TagType | undefined;
  readonly closable?: boolean | undefined;
  readonly visible?: boolean | undefined;
  readonly onClose?:
    | ((
        value: TagContent,
        event: MouseEvent | KeyboardEvent,
        tagKey: string | number | undefined,
      ) => void)
    | undefined;
  readonly onClick?: ((event: MouseEvent | KeyboardEvent) => void) | undefined;
  readonly onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  readonly onMouseEnter?: ((event: MouseEvent) => void) | undefined;
  readonly prefixIcon?: TagContent;
  readonly suffixIcon?: TagContent;
  readonly className?: string | undefined;
  readonly avatarSrc?: string | undefined;
  readonly avatarShape?: TagShape | undefined;
  readonly shape?: TagShape | undefined;
  readonly colorful?: boolean | undefined;
  readonly gradient?: boolean | undefined;
  readonly tabIndex?: number | undefined;
}
