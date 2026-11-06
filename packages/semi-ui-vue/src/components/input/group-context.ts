import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
  watch,
} from "vue";
import type { InjectionKey, Ref } from "vue";
import type { InputGroupProps } from "./group-types.js";
export type InputGroupValues = Readonly<
  Pick<InputGroupProps, "size" | "disabled" | "onFocus" | "onBlur">
>;
interface InputGroupContext {
  readonly root: Readonly<Ref<HTMLElement | null>>;
  readonly revision: Readonly<Ref<number>>;
  readonly values: Readonly<Ref<InputGroupValues>>;
}
const groupKey: InjectionKey<InputGroupContext> = Symbol("semi-input-group");
/** Native root membership replaces React child cloning. */
export function provideInputGroup(
  root: Readonly<Ref<HTMLElement | null>>,
  values: Readonly<Ref<InputGroupValues>>,
) {
  const revision = shallowRef(0);
  let observer: MutationObserver | undefined;
  let disposed = false;
  const refresh = () => {
    if (!disposed) revision.value++;
  };
  const observe = () => {
    observer?.disconnect();
    observer = undefined;
    refresh();
    const current = root.value;
    const Observer = current?.ownerDocument.defaultView?.MutationObserver;
    if (!disposed && current && Observer) {
      observer = new Observer(refresh);
      observer.observe(current, { childList: true, subtree: true });
    }
  };
  provide(groupKey, { root, revision, values });
  watch(root, observe, { flush: "post" });
  onMounted(refresh);
  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
  });
}
/** Future grouped controls consume this at their outer root, not internal inputs. */
export function useInputGroup(root: Readonly<Ref<HTMLElement | null>>) {
  const group = inject(groupKey, undefined);
  return computed(() => {
    if (!group) return undefined;
    void group.revision.value;
    return root.value && root.value.parentElement === group.root.value
      ? group.values.value
      : undefined;
  });
}
