import { createVaporApp, nextTick, ref } from "vue";
import { Layout } from "semi-ui-vue";
import SubpathLayout, {
  Layout as NamedSubpathLayout,
} from "semi-ui-vue/layout";
import "semi-ui-vue/styles/components/layout.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkLayoutConsumer() {
  assert(
    Layout === SubpathLayout && Layout === NamedSubpathLayout,
    "Layout root and subpath identities differ",
  );
  for (const name of ["Header", "Footer", "Content", "Sider"])
    assert(
      Layout[name as keyof typeof Layout] != null,
      `Layout.${name} static member is missing`,
    );
  const host = document.createElement("div");
  document.body.append(host);
  const showFirst = ref(true);
  const showSecond = ref(true);
  const mounted = ref(true);
  const label = ref("Initial");
  const app = createVaporApp(() => (
    <>
      {mounted.value && (
        <Layout
          className="packed-layout"
          data-layout-consumer=""
          style={{ height: "120px", width: "240px" }}
          v-slots={{
            default: () => (
              <>
                <Layout.Header
                  v-slots={{ default: () => <span>Header</span> }}
                />
                {showFirst.value && (
                  <Layout.Sider
                    aria-label="Primary navigation"
                    className="packed-layout-sider-first"
                    data-consumer-sider="first"
                    role="navigation"
                    style={{ flex: "0 0 40px", width: "40px" }}
                    v-slots={{
                      default: () => <button data-layout-focus>Focus</button>,
                    }}
                  />
                )}
                {showSecond.value && (
                  <Layout.Sider
                    aria-label="Secondary navigation"
                    className="packed-layout-sider-second"
                    style={{ flex: "0 0 40px", width: "40px" }}
                    v-slots={{ default: () => <span>Secondary</span> }}
                  />
                )}
                <Layout.Content
                  v-slots={{
                    default: () => (
                      <output data-layout-output>{label.value}</output>
                    ),
                  }}
                />
                <Layout.Footer
                  v-slots={{ default: () => <span>Footer</span> }}
                />
                <Layout
                  className="packed-nested-layout"
                  hasSider={false}
                  v-slots={{
                    default: () => (
                      <Layout.Content
                        v-slots={{ default: () => <span>Nested</span> }}
                      />
                    ),
                  }}
                />
              </>
            ),
          }}
        />
      )}
    </>
  ));
  let active = false;
  try {
    app.mount(host);
    active = true;
    await nextTick();
    const outer = () => host.querySelector<HTMLElement>(".packed-layout")!;
    assert(
      outer()?.tagName === "SECTION" &&
        outer().classList.contains("semi-layout-has-sider") &&
        getComputedStyle(outer()).flexDirection === "row",
      "Packed Layout root, Sider registry, or stylesheet failed",
    );
    assert(
      host.querySelector("header.semi-layout-header") &&
        host.querySelector("main.semi-layout-content") &&
        host.querySelector("footer.semi-layout-footer") &&
        host.querySelectorAll("aside.semi-layout-sider").length === 2,
      "Packed Layout static children or semantic roots failed",
    );
    const firstSider = host.querySelector<HTMLElement>(
      ".packed-layout-sider-first",
    )!;
    assert(
      firstSider.getAttribute("aria-label") === "Primary navigation" &&
        firstSider.getAttribute("data-consumer-sider") === "first" &&
        !firstSider.hasAttribute("role"),
      "Packed Sider attribute filtering differs from fixed upstream behavior",
    );
    assert(
      !host
        .querySelector(".packed-nested-layout")
        ?.classList.contains("semi-layout-has-sider"),
      "Nested Layout inherited parent Sider state",
    );
    const button = host.querySelector<HTMLButtonElement>(
      "[data-layout-focus]",
    )!;
    button.focus();
    label.value = "Updated";
    showSecond.value = false;
    await nextTick();
    assert(
      outer().classList.contains("semi-layout-has-sider") &&
        !host.querySelector(".packed-layout-sider-second") &&
        host.querySelector("[data-layout-output]")?.textContent === "Updated" &&
        document.activeElement === button,
      "Packed Layout updates removed another Sider or disturbed slot focus",
    );
    showFirst.value = false;
    await nextTick();
    assert(
      !outer().classList.contains("semi-layout-has-sider") &&
        getComputedStyle(outer()).flexDirection === "column",
      "Packed Layout failed to unregister the final Sider",
    );
    showFirst.value = true;
    await nextTick();
    assert(
      outer().classList.contains("semi-layout-has-sider") &&
        !!host.querySelector(".packed-layout-sider-first"),
      "Packed Layout failed to register a remounted Sider",
    );
    mounted.value = false;
    await nextTick();
    assert(
      !host.querySelector(".packed-layout"),
      "Packed Layout conditional unmount failed",
    );
    app.unmount();
    active = false;
    assert(!host.textContent, "Packed Layout teardown left DOM");
    return "layout consumer passed";
  } finally {
    if (active) app.unmount();
    host.remove();
  }
}
