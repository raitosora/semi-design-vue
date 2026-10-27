import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { Timeline, ConfigProvider } from "semi-ui-vue";
import DefaultTimeline, {
  Timeline as NamedTimeline,
} from "semi-ui-vue/timeline";
import Item from "semi-ui-vue/timeline/item";
import "semi-ui-vue/styles/components/timeline.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkTimelineConsumer() {
  assert(
    Timeline === DefaultTimeline &&
      Timeline === NamedTimeline &&
      Timeline.Item === Item,
    "Timeline public identity differs",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    alive = ref(true),
    useData = ref(false);
  const direction = ref<"ltr" | "rtl">("ltr");
  const mode = ref<"alternate" | "right">("alternate");
  let mounts = 0,
    disposals = 0,
    clicks = 0,
    bubbled = 0;
  const owned = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-timeline-owned="" value={label.value} />;
  };
  const app = createVaporApp(() => (
    <ConfigProvider direction={direction.value}>
      {() => (
        <section
          onClick={() => {
            bubbled++;
          }}
        >
          {alive.value && (
            <Timeline
              aria-label="Packed events"
              data-packed-timeline=""
              dataSource={
                useData.value ? [{ content: "Data value", time: "Today" }] : []
              }
              mode={mode.value}
            >
              {() => (
                <>
                  <Timeline.Item
                    dot={() => <b>{label.value}</b>}
                    extra="Extra"
                    onClick={() => {
                      clicks++;
                    }}
                    time={label.value}
                    type="ongoing"
                  >
                    {owned}
                  </Timeline.Item>
                  <Item position="right" type="success">
                    {() => <span>Second</span>}
                  </Item>
                </>
              )}
            </Timeline>
          )}
          <Timeline
            data-packed-timeline-safe=""
            dataSource={[
              {
                content: "<script>unsafe</script>",
                time: 0,
                extra: false,
                dot: null,
              },
            ]}
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
    const root = host.querySelector<HTMLElement>("[data-packed-timeline]")!;
    const input = root.querySelector<HTMLInputElement>(
      "[data-timeline-owned]",
    )!;
    assert(
      root.tagName === "UL" &&
        root.querySelectorAll(":scope > li").length === 2,
      "Timeline list structure differs",
    );
    assert(
      root.getAttribute("aria-label") === "Packed events" &&
        !root.hasAttribute("role") &&
        !root.hasAttribute("aria-live"),
      "Timeline ARIA contract differs",
    );
    assert(
      root
        .querySelector(".semi-timeline-item-head")
        ?.getAttribute("aria-hidden") === "true" &&
        root
          .querySelector(".semi-timeline-item-tail")
          ?.getAttribute("aria-hidden") === "true",
      "Timeline decorative nodes are exposed to readers",
    );
    const safe = host.querySelector("[data-packed-timeline-safe]")!;
    assert(
      safe.textContent === "<script>unsafe</script>0" &&
        !safe.querySelector("script"),
      "Timeline scalar content escaping failed",
    );
    input.focus();
    label.value = "Updated";
    direction.value = "rtl";
    mode.value = "right";
    await nextTick();
    assert(
      root.querySelector("[data-timeline-owned]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Timeline field update replaced owned content",
    );
    assert(
      root.classList.contains("semi-timeline-right") &&
        root.closest(".semi-rtl") &&
        root.querySelector(".semi-timeline-item-content-time")?.textContent ===
          "Updated",
      "Timeline mode/time/context update failed",
    );
    input.click();
    assert(
      clicks === 1 && bubbled === 1,
      "Timeline item/native bubbling differs",
    );
    useData.value = true;
    await nextTick();
    assert(
      !root.querySelector("input") &&
        root.textContent === "Data valueToday" &&
        Number(disposals) === 1,
      "Timeline dataSource did not suppress declared content",
    );
    useData.value = false;
    await nextTick();
    assert(
      root.querySelector("input") !== input && Number(mounts) === 2,
      "Timeline empty data did not restore declared content",
    );
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("[data-packed-timeline]") && Number(disposals) === 2,
      "Timeline removal retained scope",
    );
    alive.value = true;
    await nextTick();
    assert(Number(mounts) === 3, "Timeline remount failed");
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 3,
      "Timeline unmount retained DOM/scope",
    );
    label.value = "Disposed";
    await nextTick();
    assert(
      host.childNodes.length === 0,
      "Timeline disposed update revived DOM",
    );
    return "timeline consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
