import { expect, test } from "vitest";
import {
  createApp,
  createVaporApp,
  defineVaporComponent,
  h,
  nextTick,
  shallowRef,
  vaporInteropPlugin,
} from "vue";
import {
  createSemiContext,
  createStaticContext,
  semiContextKey,
  useSemiContext,
  type SemiContextInput,
  type StaticContext,
} from "semi-ui-vue";

test("app-provided sources work in pure Vapor and ordinary Vue interop", async () => {
  const input = shallowRef<SemiContextInput>({
    direction: "rtl",
    date: { timeZone: 0 },
  });
  const source = createSemiContext(() => input.value);
  const handles: StaticContext[] = [];
  const Probe = defineVaporComponent(() => {
    const context = useSemiContext();
    handles.push(createStaticContext(context));
    return (
      <output>{`${context.value.direction}|${String(context.value.date?.timeZone)}`}</output>
    );
  });
  const pureHost = document.createElement("div");
  const interopHost = document.createElement("div");
  document.body.append(pureHost, interopHost);
  const pure = createVaporApp(Probe);
  const interop = createApp({ render: () => h(Probe) });
  pure.provide(semiContextKey, source);
  interop.use(vaporInteropPlugin);
  interop.provide(semiContextKey, source);
  try {
    pure.mount(pureHost);
    interop.mount(interopHost);
    expect(pureHost.textContent).toBe("rtl|0");
    expect(interopHost.textContent).toBe("rtl|0");
    input.value = { direction: "ltr", date: { timeZone: "" } };
    await nextTick();
    expect(pureHost.textContent).toBe("ltr|");
    expect(interopHost.textContent).toBe("ltr|");
    expect(handles.map((handle) => handle.get()?.direction)).toEqual([
      "ltr",
      "ltr",
    ]);
  } finally {
    pure.unmount();
    interop.unmount();
    pureHost.remove();
    interopHost.remove();
  }
  expect(handles.map((handle) => handle.get())).toEqual([undefined, undefined]);
});
