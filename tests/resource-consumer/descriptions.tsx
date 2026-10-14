import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { Descriptions, ConfigProvider } from "semi-ui-vue";
import DefaultDescriptions, {
  Descriptions as NamedDescriptions,
} from "semi-ui-vue/descriptions";
import Item from "semi-ui-vue/descriptions/item";
import "semi-ui-vue/styles/components/descriptions.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkDescriptionsConsumer() {
  assert(
    Descriptions === DefaultDescriptions &&
      Descriptions === NamedDescriptions &&
      Descriptions.Item === Item,
    "Descriptions public identity differs",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    alive = ref(true),
    useData = ref(false);
  const direction = ref<"ltr" | "rtl">("ltr");
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const owned = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-descriptions-owned="" value={label.value} />;
  };
  const app = createVaporApp(() => (
    <ConfigProvider direction={direction.value}>
      {() => (
        <section
          onClick={() => {
            clicks++;
          }}
        >
          {alive.value && (
            <Descriptions
              data={
                useData.value ? [{ key: "Data key", value: "Data value" }] : []
              }
              data-packed-descriptions=""
            >
              {() => (
                <Descriptions.Item
                  itemKey={() => <b>{label.value}</b>}
                  keyStyle={{ color: "rgb(1, 2, 3)" }}
                >
                  {owned}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
          <Descriptions
            column={3}
            data={[
              { key: "Wide", value: "Across", span: 2 },
              { key: "Last", value: 0 },
            ]}
            data-packed-descriptions-horizontal=""
            layout="horizontal"
          />
          <Descriptions
            data={[{ key: "<img src=x>", value: "<script>unsafe</script>" }]}
            data-packed-descriptions-safe=""
          />
        </section>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const root = host.querySelector<HTMLElement>("[data-packed-descriptions]")!;
    const input = root.querySelector<HTMLInputElement>(
      "[data-descriptions-owned]",
    )!;
    assert(
      root.querySelectorAll("tbody > tr").length === 1 &&
        root.querySelectorAll("th").length === 1,
      "Descriptions vertical table structure differs",
    );
    assert(
      !root.hasAttribute("role") && !root.hasAttribute("aria-live"),
      "Descriptions invented ARIA protocol",
    );
    assert(
      root.querySelector<HTMLElement>(".semi-descriptions-key")?.style.color ===
        "rgb(1, 2, 3)",
      "Descriptions keyStyle missing",
    );
    const horizontal = host.querySelector(
      "[data-packed-descriptions-horizontal]",
    )!;
    assert(
      horizontal.querySelectorAll("tbody > tr").length === 1 &&
        horizontal.querySelector("td")?.getAttribute("colspan") === "3",
      "Descriptions horizontal span grouping differs",
    );
    assert(
      horizontal.textContent?.includes("Last0"),
      "Descriptions zero value missing",
    );
    const safe = host.querySelector("[data-packed-descriptions-safe]")!;
    assert(
      safe.textContent === "<img src=x><script>unsafe</script>" &&
        !safe.querySelector("img,script"),
      "Descriptions text escaping failed",
    );
    input.focus();
    label.value = "Updated";
    direction.value = "rtl";
    await nextTick();
    assert(
      root.querySelector("[data-descriptions-owned]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Descriptions update replaced owned content",
    );
    assert(
      root.textContent?.includes("Updated") && root.closest(".semi-rtl"),
      "Descriptions key/context update failed",
    );
    input.click();
    assert(clicks === 1, "Descriptions swallowed native event bubbling");
    useData.value = true;
    await nextTick();
    assert(
      !root.querySelector("input") &&
        root.textContent === "Data keyData value" &&
        Number(disposals) === 1,
      "Descriptions nonempty data must suppress declared content",
    );
    useData.value = false;
    await nextTick();
    assert(
      root.querySelector("input") !== input && Number(mounts) === 2,
      "Descriptions empty data did not restore declared content",
    );
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("[data-packed-descriptions]") &&
        Number(disposals) === 2,
      "Descriptions removal retained owned scope",
    );
    alive.value = true;
    await nextTick();
    assert(Number(mounts) === 3, "Descriptions remount did not mount content");
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 3,
      "Descriptions unmount retained DOM/scope",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      host.childNodes.length === 0,
      "Descriptions disposed update revived DOM",
    );
    return "descriptions consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
