import { expect, test } from "vitest";
import { defineVaporComponent, nextTick, shallowRef, useAttrs } from "vue";
import { hasProvidedProp } from "../../packages/semi-ui-vue/src/contracts/props";
import { mountVapor } from "../support/mount-vapor";

test("distinguishes provided attrs before defaults through dynamic TSX spreads", async () => {
  const incoming = shallowRef<{
    value?: string | number | boolean;
    fallback?: string;
  }>({});
  const Probe = defineVaporComponent(
    (props: { value?: string | number | boolean; fallback?: string }) => {
      const attrs = useAttrs();
      return (
        <output>{`${hasProvidedProp(attrs, "value")}:${String(attrs.value)}:${props.fallback}`}</output>
      );
    },
    {
      props: { fallback: { type: String, default: "default" } },
      inheritAttrs: false,
    },
  );
  const root = defineVaporComponent(() => <Probe {...incoming.value} />);
  const mounted = mountVapor(root);
  try {
    expect(mounted.host.textContent).toBe("false:undefined:default");
    for (const [value, text] of [
      [undefined, "undefined"],
      [false, "false"],
      [0, "0"],
      ["", ""],
      ["next", "next"],
    ] as const) {
      incoming.value = { value };
      await nextTick();
      expect(mounted.host.textContent).toBe(`true:${text}:default`);
    }
    incoming.value = {};
    await nextTick();
    expect(mounted.host.textContent).toBe("false:undefined:default");
  } finally {
    mounted.unmount();
  }
});
