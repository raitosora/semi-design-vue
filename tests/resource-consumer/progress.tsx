import { createVaporApp, nextTick, ref } from "vue";
import { Progress } from "semi-ui-vue";
import SubpathProgress, {
  Progress as NamedProgress,
  type ProgressProps,
} from "semi-ui-vue/progress";
import "semi-ui-vue/styles/components/progress.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkProgressConsumer() {
  assert(
    Progress === SubpathProgress && Progress === NamedProgress,
    "Progress entry identities differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const percent = ref<number | undefined>(25);
  const type = ref<ProgressProps["type"]>("line");
  const size = ref<ProgressProps["size"]>(undefined);
  const motion = ref(false);
  const indeterminate = ref(false);
  const visible = ref(true);
  const custom = ref(false);
  const app = createVaporApp(() => (
    <>
      {visible.value && (
        <Progress
          aria-label="Packed upload"
          className="packed-progress"
          data-consumer="progress"
          format={(value) => `<b>${value}</b>`}
          indeterminate={indeterminate.value}
          motion={motion.value}
          percent={percent.value}
          showInfo={true}
          size={size.value}
          style={{ width: "200px" }}
          type={type.value}
          v-slots={
            custom.value
              ? {
                  format: ({ percent: value }) => (
                    <>
                      <b data-percent="">{value.value}</b>
                      <i> complete</i>
                    </>
                  ),
                }
              : {}
          }
        />
      )}
    </>
  ));
  let attached = false;
  try {
    app.mount(host);
    attached = true;
    await nextTick();
    const root = () => host.querySelector<HTMLElement>(".packed-progress")!;
    assert(
      root().tagName === "DIV" &&
        root().getAttribute("role") === "progressbar" &&
        root().getAttribute("aria-valuenow") === "25",
      "Packed Progress root or ARIA failed",
    );
    assert(
      root().textContent === "<b>25</b>" && !root().querySelector("b"),
      "Progress scalar format became HTML",
    );
    assert(
      root().querySelector<HTMLElement>(".semi-progress-track-inner")?.style
        .width === "25%",
      "Progress line geometry failed",
    );
    for (const value of [-1, 0, 12.5, 100, 101, undefined]) {
      percent.value = value;
      await nextTick();
      const expected = Math.min(100, Math.max(0, value ?? 0));
      assert(
        root().getAttribute("aria-valuenow") === String(expected) &&
          root().textContent === `<b>${expected}</b>`,
        "Progress clamped or undefined update failed",
      );
    }
    type.value = "circle";
    percent.value = 50;
    custom.value = true;
    await nextTick();
    assert(
      root().querySelector("svg")?.getAttribute("width") === "72" &&
        root().querySelectorAll("circle").length === 2 &&
        root().querySelector("[data-percent]")?.textContent === "50",
      "Progress circle or owned format fragment failed",
    );
    assert(
      root().querySelector("svg")?.getAttribute("aria-hidden") === "true",
      "Progress SVG must remain decorative",
    );
    const arc = root().querySelector(".semi-progress-circle-ring-inner")!;
    assert(
      arc.getAttribute("r") === "34" &&
        arc.getAttribute("cx") === "36" &&
        arc.getAttribute("stroke-width") === "4" &&
        arc.getAttribute("stroke-linecap") === "round" &&
        Math.abs(Number(arc.getAttribute("stroke-dashoffset")) - 34 * Math.PI) <
          0.00001,
      "Packed Progress SVG radius, stroke or dash geometry failed",
    );
    size.value = "large";
    await nextTick();
    assert(
      root().querySelector("svg")?.getAttribute("width") === "24",
      "Progress large circle must use upstream 24px geometry",
    );
    size.value = "small";
    await nextTick();
    assert(
      !root().querySelector(".semi-progress-circle-text"),
      "Small circle unexpectedly renders text",
    );
    size.value = undefined;
    indeterminate.value = true;
    await nextTick();
    assert(
      !root().hasAttribute("aria-valuenow") &&
        root().querySelector(
          ".semi-progress-circle-ring-inner-indeterminate",
        ) &&
        !root().querySelector(".semi-progress-circle-text"),
      "Progress indeterminate circle contract failed",
    );
    type.value = "line";
    await nextTick();
    assert(
      root().querySelector(".semi-progress-track-inner-indeterminate") &&
        !root().querySelector("svg"),
      "Progress indeterminate type switch failed",
    );
    indeterminate.value = false;
    motion.value = true;
    percent.value = 90;
    await nextTick();
    percent.value = 42.5;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 350));
    assert(
      root().querySelector("[data-percent]")?.textContent === "42.5" &&
        root().getAttribute("aria-valuenow") === "42.5",
      "Progress rapid animated update did not settle",
    );
    percent.value = 80;
    await nextTick();
    visible.value = false;
    await nextTick();
    assert(
      !host.querySelector(".packed-progress"),
      "Progress conditional teardown left elements",
    );
    visible.value = true;
    motion.value = false;
    percent.value = 0;
    await nextTick();
    assert(
      root().getAttribute("aria-valuenow") === "0",
      "Progress remount failed",
    );
    app.unmount();
    attached = false;
    assert(host.childNodes.length === 0, "Packed Progress teardown left DOM");
    return "progress consumer passed";
  } finally {
    if (attached) app.unmount();
    host.remove();
  }
}
