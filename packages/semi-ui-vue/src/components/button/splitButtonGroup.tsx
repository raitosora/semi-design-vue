import {
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
} from "vue";
import type { SplitButtonGroupProps, SplitButtonGroupSlots } from "./types.js";

const firstClass = "semi-button-first";
const lastClass = "semi-button-last";

function refresh(root: HTMLElement, previous: ReadonlySet<HTMLButtonElement>) {
  const buttons = [
    ...root.querySelectorAll<HTMLButtonElement>("button"),
  ].filter((button) => button.closest(".semi-button-split") === root);
  const current = new Set(buttons);
  for (const button of previous) {
    if (!current.has(button)) button.classList.remove(firstClass, lastClass);
  }
  buttons.forEach((button, index) => {
    button.classList.toggle(firstClass, index === 0);
    button.classList.toggle(lastClass, index === buttons.length - 1);
  });
  return current;
}

const SplitButtonGroupComponent = defineVaporComponent<
  SplitButtonGroupProps,
  {},
  string,
  {}
>(
  () => {
    const attrs = useAttrs() as Readonly<Record<string, unknown>>;
    const root = ref<HTMLElement | null>(null);
    let observer: MutationObserver | undefined;
    let buttons = new Set<HTMLButtonElement>();
    onMounted(() => {
      // The native wrapper ref is installed before the mounted hook.
      const current = root.value!;
      buttons = refresh(current, buttons);
      const Observer = current.ownerDocument.defaultView?.MutationObserver;
      if (!Observer) return;
      observer = new Observer(() => {
        buttons = refresh(current, buttons);
      });
      observer.observe(current, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    });
    onBeforeUnmount(() => {
      observer?.disconnect();
      for (const button of buttons)
        button.classList.remove(firstClass, lastClass);
      buttons.clear();
    });
    return (
      <div
        aria-label={attrs["aria-label"] as string | undefined}
        class={["semi-button-split", attrs.class, attrs.className]}
        ref={root}
        role="group"
        style={attrs.style as SplitButtonGroupProps["style"]}
      >
        <slot />
      </div>
    );
  },
  { props: [], inheritAttrs: false },
);

type SplitButtonGroupComponentType = typeof SplitButtonGroupComponent & {
  new (props: SplitButtonGroupProps): {
    $props: SplitButtonGroupProps;
    $slots: SplitButtonGroupSlots;
  };
};
export const SplitButtonGroup =
  SplitButtonGroupComponent as SplitButtonGroupComponentType;
export default SplitButtonGroup;
export type { SplitButtonGroupProps, SplitButtonGroupSlots } from "./types.js";
