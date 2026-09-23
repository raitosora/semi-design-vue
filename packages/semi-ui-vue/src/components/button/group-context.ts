import { inject, provide } from "vue";
import type { InjectionKey, Ref } from "vue";
import type { ButtonGroupProps, ButtonProps } from "./types.js";

export interface ButtonGroupEntry {
  readonly element: HTMLButtonElement;
  readonly readProps: () => ButtonProps;
  readonly setDirect: (direct: boolean) => void;
}

export type ButtonGroupValues = Readonly<
  Pick<ButtonGroupProps, "disabled" | "size" | "type" | "theme" | "colorful">
> & {
  readonly present: ReadonlySet<string>;
  readonly register: (entry: ButtonGroupEntry) => () => void;
};

const buttonGroupKey: InjectionKey<Ref<ButtonGroupValues>> = Symbol(
  "semi-ui-vue-button-group",
);

export function provideButtonGroup(source: Ref<ButtonGroupValues>) {
  provide(buttonGroupKey, source);
}

export function useButtonGroup() {
  return inject(buttonGroupKey, undefined);
}
