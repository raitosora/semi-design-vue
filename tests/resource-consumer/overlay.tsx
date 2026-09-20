import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onUnmounted,
  ref,
  shallowRef,
} from "vue";
import {
  createOverlayHost,
  createSemiContext,
  createStaticContext,
  type OverlayHostState,
  type SemiContextInput,
} from "semi-ui-vue";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

type Props = { label: string; detail?: string | undefined };

// Renderers belong to the consuming app; every library import uses copied dist.
export async function checkOverlayConsumer() {
  const firstContainer = document.createElement("section");
  const nextContainer = document.createElement("section");
  document.body.append(firstContainer, nextContainer);
  const container = shallowRef(firstContainer);
  const contextInput = shallowRef<SemiContextInput>({ direction: "rtl" });
  const context = createStaticContext(
    createSemiContext(() => ({
      ...contextInput.value,
      container: () => container.value,
    })),
  );
  let mounted = 0;
  let unmounted = 0;
  const mount = (element: HTMLElement, state: OverlayHostState<Props>) => {
    const View = defineVaporComponent(() => {
      const count = ref(0);
      mounted++;
      onUnmounted(() => unmounted++);
      return (
        <>
          <button data-overlay-count onClick={() => count.value++}>
            {`${state.props.value.label}:${count.value}`}
          </button>
          <output data-overlay-context>
            {`${String(state.context.value?.direction)}|${String(state.props.value.detail)}`}
          </output>
        </>
      );
    });
    const app = createVaporApp(View);
    try {
      app.mount(element);
    } catch (error) {
      app.unmount();
      throw error;
    }
    return () => app.unmount();
  };
  const firstHost = createOverlayHost<Props>({ context, mount });
  const otherContext = createStaticContext(
    createSemiContext(() => ({ direction: "ltr" })),
  );
  const otherHost = createOverlayHost<Props>({ context: otherContext, mount });
  try {
    const first = firstHost.open({ label: "first", detail: "initial" });
    const other = otherHost.open({ label: "other" });
    await nextTick();
    const button = first.element.querySelector<HTMLButtonElement>(
      "[data-overlay-count]",
    );
    assert(button, "host did not mount its real Vapor renderer");
    assert(
      first.element.parentElement === firstContainer &&
        first.element.dir === "rtl" &&
        other.element.dir === "ltr",
      "host did not resolve context container and isolated directions",
    );
    button.click();
    await nextTick();
    assert(button.textContent === "first:1", "Vapor delegated click failed");
    first.update({ label: "updated", detail: undefined });
    contextInput.value = { direction: "ltr" };
    container.value = nextContainer;
    await nextTick();
    assert(
      first.element.querySelector("[data-overlay-count]") === button &&
        String(button.textContent) === "updated:1" &&
        mounted === 2,
      "host update remounted Vapor state or replaced its DOM",
    );
    assert(
      first.element.querySelector("output")?.textContent === "ltr|undefined" &&
        String(first.element.dir) === "ltr" &&
        first.element.parentElement === nextContainer,
      "host did not follow live static context and dynamic container",
    );
    first.update({}, { container: () => firstContainer });
    await nextTick();
    assert(
      first.element.parentElement === firstContainer &&
        first.element.querySelector("button") === button,
      "explicit container update did not move the existing rendered host",
    );
    firstHost.destroyAll();
    assert(
      first.destroyed && !first.element.isConnected && unmounted === 1,
      "destroyAll did not release the renderer and host DOM",
    );
    assert(
      !other.destroyed &&
        other.element.isConnected &&
        other.element.querySelector("button")?.textContent === "other:0",
      "one host's destroyAll affected another app host",
    );
    const reopened = firstHost.open({ label: "reopened" });
    firstHost.dispose();
    assert(
      reopened.destroyed && !reopened.element.isConnected,
      "host dispose did not release a reopened instance",
    );
    other.destroy();
    other.destroy();
    first.update({ label: "after destroy" });
    assert(
      !other.element.isConnected &&
        Number(unmounted) === 3 &&
        Number(mounted) === 3,
      "destroy was not idempotent or leaked Vapor instances",
    );
    assert(context.get()?.direction === "ltr", "host disposed caller context");
    return "overlay consumer passed";
  } finally {
    firstHost.dispose();
    otherHost.dispose();
    context.dispose();
    otherContext.dispose();
    firstContainer.remove();
    nextContainer.remove();
  }
}
