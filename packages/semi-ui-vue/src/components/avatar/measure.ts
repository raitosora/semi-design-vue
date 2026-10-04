import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Ref } from "vue";
import {
  createDomScheduler,
  createFoundationScope,
  observeResize,
} from "semi-animation-vue/lifecycle";
import { avatarScale } from "./input.js";

/** One live text tree: no hidden measurement clone or transferable native block. */
export function useAvatarMeasure(
  root: Ref<HTMLElement | null>,
  content: Ref<HTMLElement | null>,
  gap: () => number,
) {
  const scale = ref(1);
  const scope = createFoundationScope();
  const scheduler = createDomScheduler(
    () => root.value?.ownerDocument.defaultView ?? undefined,
  );
  let cancel: (() => void) | undefined;
  let generation = 0;
  let fontRelease: (() => void) | undefined;
  let mutations: MutationObserver | undefined;
  const measure = () => {
    cancel = undefined;
    if (!scope.active) return;
    scale.value = avatarScale(
      root.value?.offsetWidth ?? 0,
      content.value?.offsetWidth ?? 0,
      gap(),
      scale.value,
    );
  };
  const schedule = () => {
    if (!scope.active || cancel) return;
    cancel = scheduler.frame(measure);
  };
  scope.own(
    observeResize(
      () =>
        [root.value, content.value].filter(
          (element): element is HTMLElement => !!element,
        ),
      schedule,
    ),
  );
  watch([root, content, gap], schedule, { flush: "post" });
  onMounted(() => {
    schedule();
    const document = root.value?.ownerDocument;
    const fonts = document?.fonts;
    if (fonts) {
      fonts.addEventListener("loadingdone", schedule);
      fonts.addEventListener("loadingerror", schedule);
      fontRelease = () => {
        fonts.removeEventListener("loadingdone", schedule);
        fonts.removeEventListener("loadingerror", schedule);
      };
      const current = generation;
      void fonts.ready.then(() => {
        if (scope.active && current === generation) schedule();
      });
    }
    const Observer = document?.defaultView?.MutationObserver;
    if (Observer) {
      mutations = new Observer(schedule);
      let ancestor: Element | null = root.value;
      while (ancestor) {
        mutations.observe(ancestor, {
          attributes: true,
          attributeFilter: ["class", "style", "hidden", "dir"],
        });
        ancestor = ancestor.parentElement;
      }
      if (content.value)
        mutations.observe(content.value, {
          characterData: true,
          childList: true,
          subtree: true,
        });
    }
  });
  onBeforeUnmount(() => {
    generation++;
    cancel?.();
    mutations?.disconnect();
    fontRelease?.();
    scheduler.dispose();
    scope.dispose();
  });
  return scale;
}
