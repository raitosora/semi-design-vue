import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  onScopeDispose,
  ref,
} from "vue";
import { Breadcrumb, ConfigProvider, provideAriaIdScope } from "semi-ui-vue";
import DefaultBreadcrumb, {
  Breadcrumb as NamedBreadcrumb,
} from "semi-ui-vue/breadcrumb";
import Item from "semi-ui-vue/breadcrumb/item";
import "semi-ui-vue/styles/components/breadcrumb.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkBreadcrumbConsumer() {
  assert(
    Breadcrumb === DefaultBreadcrumb &&
      Breadcrumb === NamedBreadcrumb &&
      Breadcrumb.Item === Item,
    "Breadcrumb public identity differs",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    alive = ref(true),
    useRoutes = ref(false),
    compact = ref(true);
  const direction = ref<"ltr" | "rtl">("ltr");
  let mounts = 0,
    disposals = 0,
    clicks = 0,
    bubbled = 0;
  const owned = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-breadcrumb-owned="" value={label.value} />;
  };
  const app = createVaporApp(
    defineVaporComponent(() => {
      provideAriaIdScope("packed-breadcrumb-consumer");
      return (
        <ConfigProvider direction={direction.value}>
          {() => (
            <section
              onClick={() => {
                bubbled++;
              }}
            >
              {alive.value && (
                <Breadcrumb
                  aria-label="Packed path"
                  compact={compact.value}
                  data-packed-breadcrumb=""
                  routes={useRoutes.value ? [{ name: "Route value" }] : []}
                  separator=">"
                >
                  {() => (
                    <>
                      <Breadcrumb.Item
                        onClick={() => {
                          clicks++;
                        }}
                      >
                        {owned}
                      </Breadcrumb.Item>
                      <Item href="#current">
                        {() => <span>{label.value}</span>}
                      </Item>
                    </>
                  )}
                </Breadcrumb>
              )}
              <Breadcrumb
                data-packed-breadcrumb-safe=""
                routes={[
                  { name: "<script>unsafe</script>", href: "#safe" },
                  { name: "Current" },
                ]}
              />
            </section>
          )}
        </ConfigProvider>
      );
    }),
  );
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const root = host.querySelector<HTMLElement>("[data-packed-breadcrumb]")!;
    const input = root.querySelector<HTMLInputElement>(
      "[data-breadcrumb-owned]",
    )!;
    assert(
      root.tagName === "NAV" &&
        root.querySelectorAll(".semi-breadcrumb-item-wrap").length === 2,
      "Breadcrumb structure differs",
    );
    assert(
      root.getAttribute("aria-label") === "Packed path" &&
        !root.hasAttribute("role") &&
        !root.hasAttribute("aria-live"),
      "Breadcrumb ARIA contract differs",
    );
    assert(
      root.querySelectorAll('[aria-current="page"]').length === 1 &&
        root.querySelector('[aria-current="page"] .semi-breadcrumb-item')
          ?.tagName === "SPAN",
      "Breadcrumb current item differs",
    );
    const safe = host.querySelector("[data-packed-breadcrumb-safe]")!;
    assert(
      safe.textContent?.includes("<script>unsafe</script>") &&
        !safe.querySelector("script") &&
        safe.querySelector("a")?.getAttribute("href") === "#safe",
      "Breadcrumb escaping/link failed",
    );
    input.focus();
    label.value = "Updated";
    direction.value = "rtl";
    compact.value = false;
    await nextTick();
    assert(
      root.querySelector("input") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Breadcrumb update replaced owned content",
    );
    assert(
      root.classList.contains("semi-breadcrumb-wrapper-loose") &&
        root.closest(".semi-rtl") &&
        root.textContent?.includes("Updated"),
      "Breadcrumb size/context/content update failed",
    );
    input.click();
    assert(clicks === 1 && bubbled === 1, "Breadcrumb event bubbling differs");
    useRoutes.value = true;
    await nextTick();
    assert(
      !root.querySelector("input") &&
        root.textContent === "Route value" &&
        Number(disposals) === 1,
      "Breadcrumb nonempty routes did not suppress declarations",
    );
    useRoutes.value = false;
    await nextTick();
    assert(
      root.querySelector("input") !== input && Number(mounts) === 2,
      "Breadcrumb empty routes did not restore declarations",
    );
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("[data-packed-breadcrumb]") &&
        Number(disposals) === 2,
      "Breadcrumb removal retained scope",
    );
    alive.value = true;
    await nextTick();
    assert(Number(mounts) === 3, "Breadcrumb remount failed");
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 3,
      "Breadcrumb unmount retained DOM/scope",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      host.childNodes.length === 0 && Number(mounts) === 3,
      "Breadcrumb disposed owner revived",
    );
    return "breadcrumb consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
