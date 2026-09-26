import { createVaporApp, defineVaporComponent, nextTick, ref } from "vue";
import { expect, test } from "vitest";
import Highlight from "../../packages/semi-ui-vue/src/components/highlight/index.js";

function mountWithErrors(component: Parameters<typeof createVaporApp>[0]) {
  let errors: unknown[] = [];
  let warnings: string[] = [];
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(component);
  app.config.errorHandler = (error) => {
    errors = [...errors, error];
  };
  app.config.warnHandler = (message) => {
    warnings = [...warnings, message];
  };
  app.mount(host);
  return {
    host,
    errors: () => errors,
    warnings: () => warnings,
    unmount() {
      app.unmount();
      host.remove();
    },
  };
}

for (const tag of ["script", "ScRiPt", "style", "STYLE"]) {
  test(`Highlight rejects ${tag} before source text can execute`, () => {
    const source =
      tag.toLowerCase() === "script"
        ? 'document.documentElement.setAttribute("data-highlight-script-probe", "executed")'
        : ".highlight-security-probe { color: rgb(1, 2, 3) !important; }";
    const fixture = mountWithErrors(
      defineVaporComponent(() => (
        <>
          <Highlight
            component={tag}
            searchWords={[source]}
            sourceString={source}
          />
          <span class="highlight-security-probe">probe</span>
        </>
      )),
    );
    try {
      expect(fixture.errors()).toHaveLength(1);
      expect(fixture.warnings()).toEqual([
        "Vapor component setup() returned non-block value, and has no render function.",
      ]);
      expect(fixture.errors()[0]).toBeInstanceOf(TypeError);
      expect((fixture.errors()[0] as Error).message).toBe(
        "Highlight component does not support script or style tags.",
      );
      expect(fixture.host.querySelector("script, style")).toBeNull();
      expect(
        document.documentElement.hasAttribute("data-highlight-script-probe"),
      ).toBe(false);
      expect(
        getComputedStyle(fixture.host.querySelector("span")!).color,
      ).not.toBe("rgb(1, 2, 3)");
    } finally {
      fixture.unmount();
      document.documentElement.removeAttribute("data-highlight-script-probe");
    }
    expect(fixture.host.childNodes).toHaveLength(0);
  });
}

test("Highlight rejects dynamically selected script/style tags and recovers on valid tags", async () => {
  const component = ref("mark");
  const source =
    'document.documentElement.setAttribute("data-highlight-script-probe", "executed")';
  const fixture = mountWithErrors(
    defineVaporComponent(() => (
      <Highlight
        component={component.value}
        searchWords={[source]}
        sourceString={source}
      />
    )),
  );
  try {
    expect(fixture.host.querySelector("mark")?.textContent).toBe(source);
    component.value = "script";
    await nextTick();
    expect(fixture.errors()).toHaveLength(1);
    expect(fixture.host.querySelector("script")).toBeNull();
    expect(
      document.documentElement.hasAttribute("data-highlight-script-probe"),
    ).toBe(false);
    component.value = "strong";
    await nextTick();
    expect(fixture.host.querySelector("strong")?.textContent).toBe(source);
    component.value = "style";
    await nextTick();
    expect(fixture.errors()).toHaveLength(2);
    expect(fixture.host.querySelector("style")).toBeNull();
    component.value = "";
    await nextTick();
    expect(fixture.host.querySelector("mark")?.textContent).toBe(source);
  } finally {
    fixture.unmount();
    document.documentElement.removeAttribute("data-highlight-script-probe");
  }
});

test("Highlight preserves native custom and void tag behavior without broadening tag restrictions", async () => {
  const component = ref("semi-highlight-probe");
  const fixture = mountWithErrors(
    defineVaporComponent(() => (
      <Highlight
        component={component.value}
        searchWords={["text"]}
        sourceString="text"
      />
    )),
  );
  try {
    const custom = fixture.host.querySelector("semi-highlight-probe")!;
    expect(custom.textContent).toBe("text");
    expect(custom.className).toBe("semi-highlight-tag");
    component.value = "input";
    await nextTick();
    const input = fixture.host.querySelector("input")!;
    expect(input.className).toBe("semi-highlight-tag");
    expect(input.textContent).toBe("text");
    expect(input.value).toBe("");
    expect(fixture.errors()).toHaveLength(0);
    component.value = "mark";
    await nextTick();
    expect(fixture.host.querySelector("mark")?.textContent).toBe("text");
  } finally {
    fixture.unmount();
  }
});

test("Highlight validates dangerous tags when a no-match source gains matches", async () => {
  const words = ref<string[]>([]);
  const source =
    'document.documentElement.setAttribute("data-highlight-script-probe", "executed")';
  const fixture = mountWithErrors(
    defineVaporComponent(() => (
      <Highlight
        component="ScRiPt"
        searchWords={words.value}
        sourceString={source}
      />
    )),
  );
  try {
    expect(fixture.host.textContent).toBe(source);
    expect(fixture.host.children).toHaveLength(0);
    expect(fixture.errors()).toEqual([]);
    expect(fixture.warnings()).toEqual([]);
    words.value = [source];
    await nextTick();
    expect(fixture.errors()).toHaveLength(1);
    expect(fixture.errors()[0]).toBeInstanceOf(TypeError);
    expect(fixture.warnings()).toEqual([
      "Vapor component setup() returned non-block value, and has no render function.",
    ]);
    expect(fixture.host.querySelector("script")).toBeNull();
    expect(
      document.documentElement.hasAttribute("data-highlight-script-probe"),
    ).toBe(false);
    words.value = [];
    await nextTick();
    expect(fixture.host.textContent).toBe(source);
    expect(fixture.host.children).toHaveLength(0);
    expect(fixture.errors()).toHaveLength(1);
  } finally {
    fixture.unmount();
    document.documentElement.removeAttribute("data-highlight-script-probe");
  }
});
