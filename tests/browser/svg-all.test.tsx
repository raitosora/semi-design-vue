import { defineVaporComponent, nextTick, ref } from "vue";
import { expect, test } from "vitest";
import * as icons from "../../packages/semi-icons-vue/src/index.js";
import * as lab from "../../packages/semi-icons-lab-vue/src/index.js";
import * as illustrations from "../../packages/semi-illustrations-vue/src/index.js";
import {
  svgSize as iconSize,
  svgDimension as iconDimension,
} from "../../packages/semi-icons-vue/src/runtime.js";
import {
  svgSize as labSize,
  svgDimension as labDimension,
} from "../../packages/semi-icons-lab-vue/src/runtime.js";
import {
  svgSize as illustrationSize,
  svgDimension as illustrationDimension,
} from "../../packages/semi-illustrations-vue/src/runtime.js";
import inventory from "../../resources/svg/manifest.json";
import { mountVapor } from "../support/mount-vapor.js";

for (const [kind, exports] of [
  ["icons", icons],
  ["iconsLab", lab],
  ["illustrations", illustrations],
] as const) {
  test(`every generated ${kind} resource renders SVG geometry and resolves its own fragment references`, () => {
    const expectedNames = inventory.generated[kind]
      .map((entry) => entry.name)
      .sort();
    const resources = Object.entries(exports).filter(
      ([name]) => name !== "version",
    );
    expect(resources.map(([name]) => name).sort()).toEqual(expectedNames);
    expect(exports.version).toBe("0.0.0");
    for (const [name, Resource] of resources) {
      if (typeof Resource === "string")
        throw new Error(`Not a Vapor component: ${name}`);
      const mounted = mountVapor(Resource);
      try {
        const svg = mounted.host.querySelector("svg");
        expect(svg, name).not.toBeNull();
        expect(svg!.namespaceURI, name).toBe("http://www.w3.org/2000/svg");
        expect(svg!.getAttribute("viewBox"), name).toMatch(/\d/);
        expect(
          svg!.querySelectorAll(
            "path,circle,rect,ellipse,polygon,line,polyline,use",
          ).length,
          name,
        ).toBeGreaterThan(0);
        const box = svg!.getBoundingClientRect();
        expect(box.width, name).toBeGreaterThan(0);
        expect(box.height, name).toBeGreaterThan(0);
        const ids = [...svg!.querySelectorAll("[id]")].map((node) => node.id);
        expect(new Set(ids).size, name).toBe(ids.length);
        for (const node of svg!.querySelectorAll("*")) {
          for (const attribute of node.attributes) {
            const refs = [...attribute.value.matchAll(/url\(#([^)]+)\)/g)].map(
              (match) => match[1],
            );
            if (attribute.name === "href" && attribute.value.startsWith("#"))
              refs.push(attribute.value.slice(1));
            for (const id of refs)
              expect(
                svg!.querySelector(`[id="${id}"]`),
                `${name}: ${id}`,
              ).not.toBeNull();
          }
        }
      } finally {
        mounted.unmount();
      }
    }
  }, 60_000);
}

test("all resource size helpers preserve explicit sizes and named defaults", () => {
  for (const dimension of [
    iconDimension,
    labDimension,
    illustrationDimension,
  ]) {
    expect(dimension(32, "large", "16px")).toBe(32);
    expect(dimension(undefined, "large", "16px")).toBe("20px");
  }
  for (const size of [iconSize, labSize, illustrationSize]) {
    expect(size(undefined, "200")).toBe("200");
    expect(size(undefined, undefined)).toBeUndefined();
    expect(size("inherit", "16px")).toBe("1em");
    expect(size("extra-small", "16px")).toBe("8px");
    expect(size("small", "16px")).toBe("12px");
    expect(size("default", "16px")).toBe("16px");
    expect(size("large", "16px")).toBe("20px");
    expect(size("extra-large", "16px")).toBe("24px");
    expect(size(0, "16px")).toBe("0");
    expect(size(32, "16px")).toBe("32");
    expect(size("2em", "16px")).toBe("2em");
    expect(size("toString", "16px")).toBe("toString");
  }
});

test("native SVG attributes, color and size follow reactive updates", async () => {
  const size = ref(16);
  const color = ref("#1169aa");
  const width = ref<string | undefined>("48");
  const clicks = ref(0);
  const Component = defineVaporComponent(() => (
    <icons.IconHome
      class="resource-native"
      color={color.value}
      onClick={() => clicks.value++}
      size={size.value}
      width={width.value}
    />
  ));
  const mounted = mountVapor(Component);
  try {
    const svg = mounted.host.querySelector("svg")!;
    expect(svg.getAttribute("class")).toBe("resource-native");
    expect(svg.getAttribute("width")).toBe("48");
    expect(getComputedStyle(svg.querySelector("path")!).fill).toBe(
      "rgb(17, 105, 170)",
    );
    svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clicks.value).toBe(1);
    size.value = 32;
    color.value = "#7c3aed";
    width.value = "64";
    await nextTick();
    expect(svg.getAttribute("width")).toBe("64");
    expect(svg.getAttribute("height")).toBe("32");
    expect(getComputedStyle(svg.querySelector("path")!).fill).toBe(
      "rgb(124, 58, 237)",
    );
  } finally {
    mounted.unmount();
  }
  expect(document.querySelector(".resource-native")).toBeNull();
});
