import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  shallowRef,
} from "vue";
import { expect, test } from "vitest";
import { IconDatePicker } from "../../packages/semi-icons-lab-vue/src/icons/IconDatePicker.js";
import { IconHome } from "../../packages/semi-icons-vue/src/icons/IconHome.js";
import { IllustrationNoContent } from "../../packages/semi-illustrations-vue/src/illustrations/IllustrationNoContent.js";

function mount(component: Parameters<typeof createVaporApp>[0]) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(component);
  app.mount(host);
  return {
    host,
    unmount: () => {
      app.unmount();
      host.remove();
    },
  };
}

test("SVG resources forward native attributes, normalize named sizes, and isolate fragment IDs across instances and apps", () => {
  const first = mount(
    defineVaporComponent(() => (
      <>
        <IconHome color="rebeccapurple" data-home="first" size="large" />
        <IconDatePicker color="rebeccapurple" data-icon="first" size="large" />
        <IllustrationNoContent data-illustration="first" />
      </>
    )),
  );
  const second = mount(
    defineVaporComponent(() => (
      <>
        <IconDatePicker data-icon="second" size="small" />
        <IllustrationNoContent data-illustration="second" />
      </>
    )),
  );
  try {
    const icons = [...document.querySelectorAll<SVGSVGElement>("[data-icon]")];
    expect(icons.map((icon) => icon.getAttribute("width"))).toEqual([
      "20px",
      "12px",
    ]);
    expect(icons[0].getAttribute("color")).toBe("rebeccapurple");
    expect(
      first.host.querySelector("[data-home] path")?.getAttribute("fill"),
    ).toBe("currentColor");
    const illustrations = [
      ...document.querySelectorAll<SVGSVGElement>("[data-illustration]"),
    ];
    expect(
      illustrations.map((illustration) => illustration.getAttribute("width")),
    ).toEqual(["200", "200"]);
    const ids = [...document.querySelectorAll<SVGElement>("[id]")].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const illustration of illustrations)
      for (const masked of illustration.querySelectorAll<SVGElement>(
        "[mask]",
      )) {
        const reference = masked
          .getAttribute("mask")
          ?.match(/^url\(#(.+)\)$/)?.[1];
        expect(reference).toBeTruthy();
        expect(illustration.querySelector(`#${reference}`)).not.toBeNull();
      }
  } finally {
    first.unmount();
    second.unmount();
  }
});

test("native width overrides a named size and removal restores the generated size", async () => {
  const incoming = shallowRef<{ width?: string }>({ width: "31px" });
  const fixture = mount(
    defineVaporComponent(() => (
      <IconHome data-dynamic-width size="large" {...incoming.value} />
    )),
  );
  try {
    const icon = fixture.host.querySelector<SVGSVGElement>(
      "[data-dynamic-width]",
    )!;
    expect(icon.getAttribute("width")).toBe("31px");
    incoming.value = {};
    await nextTick();
    expect(icon.getAttribute("width")).toBe("20px");
  } finally {
    fixture.unmount();
  }
});
