import {
  defineVaporComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
} from "vue";
import type { SplitTagGroupProps, SplitTagGroupSlots } from "./group-types.js";
const firstClass = "semi-tag-first";
const lastClass = "semi-tag-last";

interface Decoration {
  readonly first: boolean;
  readonly last: boolean;
}
function release(element: Element, decoration: Decoration) {
  if (decoration.first) element.classList.remove(firstClass);
  if (decoration.last) element.classList.remove(lastClass);
}
/** Native slot roots are the siblings: never inspect or execute their renderers. */
function refresh(
  root: HTMLElement,
  previous: ReadonlyMap<Element, Decoration>,
) {
  const elements = [...root.children];
  const current = new Map<Element, Decoration>();
  for (const [element, decoration] of previous)
    if (!elements.includes(element)) release(element, decoration);
  elements.forEach((element, index) => {
    const owned = previous.get(element);
    const first = index === 0;
    const last = index === elements.length - 1;
    if (!first && owned?.first) element.classList.remove(firstClass);
    if (!last && owned?.last) element.classList.remove(lastClass);
    const addFirst = first && !element.classList.contains(firstClass);
    const addLast = last && !element.classList.contains(lastClass);
    if (addFirst) element.classList.add(firstClass);
    if (addLast) element.classList.add(lastClass);
    current.set(element, {
      first: first && (addFirst || owned?.first === true),
      last: last && (addLast || owned?.last === true),
    });
  });
  return current;
}
const Component = defineVaporComponent<SplitTagGroupProps, {}, string, {}>(
  () => {
    const attrs = useAttrs() as Readonly<SplitTagGroupProps>;
    const root = ref<HTMLDivElement | null>(null);
    let observer: MutationObserver | undefined;
    let elements: ReadonlyMap<Element, Decoration> = new Map();
    let active = true;
    onMounted(() => {
      const current = root.value!;
      elements = refresh(current, elements);
      const Observer = current.ownerDocument.defaultView?.MutationObserver;
      if (!Observer) return;
      observer = new Observer(() => {
        if (active) elements = refresh(current, elements);
      });
      observer.observe(current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      });
    });
    onBeforeUnmount(() => {
      active = false;
      observer?.disconnect();
      for (const [element, decoration] of elements)
        release(element, decoration);
      elements = new Map();
    });
    return (
      <div
        aria-label={attrs["aria-label"]}
        class={["semi-tag-split", attrs.class, attrs.className]}
        ref={root}
        role="group"
        style={attrs.style}
      >
        <slot />
      </div>
    );
  },
  { props: [], inheritAttrs: false },
);
type SplitTagGroupComponent = typeof Component & {
  new (props: SplitTagGroupProps): {
    $props: SplitTagGroupProps;
    $slots: SplitTagGroupSlots;
  };
};
export const SplitTagGroup = Component as SplitTagGroupComponent;
export default SplitTagGroup;
export type { SplitTagGroupProps, SplitTagGroupSlots } from "./group-types.js";
