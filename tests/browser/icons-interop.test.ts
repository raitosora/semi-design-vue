import { createApp, h, nextTick, ref, vaporInteropPlugin } from "vue";
import { expect, test } from "vitest";
import Icon from "../../packages/semi-icons-vue/src/components/Icon.js";
import type {
  IconHandle,
  IconSvgScope,
} from "../../packages/semi-icons-vue/src/components/types.js";

test("icons ordinary Vue interop updates SVG slot fills in place and releases the explicit handle", async () => {
  const fill = ref<readonly string[]>(["red"]);
  const handle = ref<IconHandle | null>(null);
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    render: () =>
      h(
        Icon,
        { fill: fill.value, ref: handle, "aria-label": "色彩" },
        {
          svg: (scope: IconSvgScope) =>
            h("svg", { width: scope.size, height: scope.size }, [
              h("defs", [
                h("linearGradient", { id: `${scope.id}-paint` }, [
                  h("stop", { "stop-color": scope.fill?.[0] }),
                ]),
              ]),
              h("path", { d: "M0 0h1v1z", fill: `url(#${scope.id}-paint)` }),
            ]),
        },
      ),
  });
  app.use(vaporInteropPlugin);
  try {
    app.mount(host);
    const api = handle.value!;
    const svg = host.querySelector("svg")!;
    const id = svg.querySelector("linearGradient")!.id;
    expect(api.getElement()!.getAttribute("role")).toBe("img");
    expect(svg.querySelector("stop")!.getAttribute("stop-color")).toBe("red");
    fill.value = ["blue"];
    await nextTick();
    expect(host.querySelector("svg")).toBe(svg);
    expect(svg.querySelector("stop")!.getAttribute("stop-color")).toBe("blue");
    expect(svg.querySelector("linearGradient")!.id).toBe(id);
    expect(svg.querySelector("path")!.getAttribute("fill")).toBe(`url(#${id})`);
  } finally {
    const retained = handle.value;
    app.unmount();
    expect(retained?.getElement()).toBeNull();
    expect(host.querySelector("svg")).toBeNull();
    host.remove();
  }
});
