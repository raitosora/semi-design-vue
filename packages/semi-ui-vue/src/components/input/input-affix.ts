import { computed, shallowRef, watch, type Ref } from "vue";

/** Classify committed native content, never execute a slot to discover its shape. */
export function useInputAffixIcon(root: Readonly<Ref<HTMLElement | null>>) {
  const icon = shallowRef(false);
  watch(
    root,
    (element, _previous, onCleanup) => {
      let active = true;
      let observer: MutationObserver | undefined;
      onCleanup(() => {
        active = false;
        observer?.disconnect();
      });
      const update = () => {
        if (!active) return;
        const nodes = Array.from(element?.childNodes ?? []).filter(
          (node) =>
            node.nodeType !== 8 &&
            !(node.nodeType === 3 && node.textContent === ""),
        );
        const node = nodes.length === 1 ? nodes[0] : undefined;
        icon.value = Boolean(
          node?.nodeType === 1 &&
          ((node as Element).hasAttribute("data-semi-icon") ||
            ((node as Element).namespaceURI === "http://www.w3.org/2000/svg" &&
              (node as Element).localName === "svg")),
        );
      };
      update();
      const Observer = element?.ownerDocument.defaultView?.MutationObserver;
      if (element && Observer) {
        observer = new Observer(update);
        observer.observe(element, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["data-semi-icon"],
        });
      }
    },
    { flush: "post" },
  );
  return computed(() => icon.value);
}
