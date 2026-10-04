import { inject, provide } from "vue";
import type { InjectionKey, Ref } from "vue";
import type { AvatarProps, AvatarShape } from "./types.js";
import type { AvatarGroupOverlapFrom } from "./group-types.js";

export interface AvatarGroupEntry {
  readonly id: symbol;
  readonly element: () => HTMLElement | null;
  readonly props: () => Readonly<AvatarProps>;
  readonly label: () => string;
}
export interface AvatarGroupState {
  readonly index: number;
  readonly hidden: boolean;
}
export interface AvatarGroupValues {
  readonly size: string | undefined;
  readonly shape: AvatarShape | undefined;
  readonly overlapFrom: AvatarGroupOverlapFrom | undefined;
  readonly rest: Readonly<Record<string, unknown>>;
  readonly register: (entry: AvatarGroupEntry) => () => void;
  readonly getState: (id: symbol) => AvatarGroupState;
}
const avatarGroupKey: InjectionKey<Readonly<Ref<AvatarGroupValues>>> = Symbol(
  "semi-ui-vue-avatar-group",
);

export function provideAvatarGroup(source: Readonly<Ref<AvatarGroupValues>>) {
  provide(avatarGroupKey, source);
}
export function useAvatarGroup() {
  return inject(avatarGroupKey, undefined);
}
