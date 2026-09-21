import { expect, test } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import { ConfigProvider } from "../../packages/semi-ui-vue/src/components/configProvider";
import type { ConfigProviderProps } from "../../packages/semi-ui-vue/src/components/configProvider";
import {
  createOverlayHost,
  type OverlayHost,
  type OverlayHostHandle,
} from "../../packages/semi-ui-vue/src/internal/overlay/host";
import {
  createStaticContext,
  useSemiContext,
} from "../../packages/semi-ui-vue/src/context";
import { mountVapor } from "../support/mount-vapor";

test("public provider drives a live host container and direction, keeps local state and disposes its owned layer", async () => {
  const first = document.createElement("section");
  const second = document.createElement("section");
  const foreign = document.implementation.createHTMLDocument("foreign").body;
  document.body.append(first, second);
  const props = shallowRef<ConfigProviderProps>({
    getPopupContainer: () => first,
    direction: "rtl",
  });
  let host!: OverlayHost<{ label: string }>;
  let entry!: OverlayHostHandle<{ label: string }>;
  let retained!: ReturnType<typeof createStaticContext>;
  const Child = defineVaporComponent(() => {
    retained = createStaticContext(useSemiContext());
    host = createOverlayHost({
      context: retained,
      mount(element, state) {
        const Content = defineVaporComponent(() => {
          const clicks = ref(0);
          return (
            <button
              onClick={() => clicks.value++}
            >{`${state.props.value.label}:${clicks.value}:${state.context.value?.direction}`}</button>
          );
        });
        const app = createVaporApp(Content);
        app.mount(element);
        return () => app.unmount();
      },
    });
    return <span>owner</span>;
  });
  const Root = defineVaporComponent(() => (
    <ConfigProvider {...props.value}>{() => <Child />}</ConfigProvider>
  ));
  const mounted = mountVapor(Root);
  try {
    entry = host.open({ label: "layer" });
    await nextTick();
    expect(entry.element.parentElement).toBe(first);
    expect(entry.element.dir).toBe("rtl");
    const button = entry.element.querySelector("button")!;
    button.click();
    props.value = { getPopupContainer: () => second, direction: "ltr" };
    await nextTick();
    expect(entry.element.parentElement).toBe(second);
    expect(entry.element.querySelector("button")).toBe(button);
    expect(button.textContent).toBe("layer:1:ltr");
    expect(() => entry.update({}, { container: () => foreign })).toThrow(
      /creating document/,
    );
    expect(entry.element.parentElement).toBe(second);
    props.value = { getPopupContainer: undefined, direction: undefined };
    await nextTick();
    expect(entry.element.parentElement).toBe(document.body);
    expect(entry.element.hasAttribute("dir")).toBe(false);
    entry.element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    mounted.unmount();
    await nextTick();
    expect(entry.destroyed).toBe(true);
    expect(entry.element.isConnected).toBe(false);
    expect(retained.get()).toBeUndefined();
    expect(() => host.open({ label: "late" })).toThrow(/disposed/);
  } finally {
    host.dispose();
    first.remove();
    second.remove();
    if (mounted.host.isConnected) mounted.unmount();
  }
});
