import { createVaporApp, nextTick, ref } from "vue";
import { Spin, ConfigProvider } from "semi-ui-vue";
import SpinFromSubpath, { Spin as NamedSpin } from "semi-ui-vue/spin";
import "semi-ui-vue/styles/components/spin.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function checkSpinConsumer() {
  assert(
    Spin === SpinFromSubpath && Spin === NamedSpin,
    "Spin entry identities differ",
  );
  assert(Spin.__SemiComponentName__ === "Spin", "Spin static marker missing");
  const host = document.createElement("div");
  document.body.append(host);
  const spinning = ref(false);
  const delay = ref(60);
  const tip = ref("Waiting");
  const size = ref<"small" | "large">("small");
  const visible = ref(true);
  const rtl = ref(false);
  const app = createVaporApp(() => (
    <ConfigProvider direction={rtl.value ? "rtl" : "ltr"}>
      {() => (
        <Spin
          v-if={visible.value}
          childStyle={{ minHeight: "80px" }}
          data-consumer-spin=""
          delay={delay.value}
          size={size.value}
          spinning={spinning.value}
          tip={tip.value}
          v-slots={{
            default: () => <input aria-label="Preserved content" />,
            indicator: () => <span data-custom-indicator="">*</span>,
          }}
          wrapperClassName="packed-spin"
        />
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    const root = () => host.querySelector<HTMLElement>(".packed-spin")!;
    const loading = () => !!host.querySelector(".semi-spin-wrapper");
    const field = host.querySelector("input")!;
    field.value = "retained";
    assert(
      !loading() && root().classList.contains("semi-spin-hidden"),
      "False Spin started loading",
    );
    spinning.value = true;
    await nextTick();
    assert(!loading(), "Rising Spin ignored delay");
    tip.value = "Updated";
    size.value = "large";
    rtl.value = true;
    await nextTick();
    await sleep(90);
    await nextTick();
    assert(
      loading() && root().textContent?.includes("Updated"),
      "Delayed Spin did not render updated tip",
    );
    assert(
      root().classList.contains("semi-spin-large") &&
        getComputedStyle(root()).direction === "rtl",
      "Spin size/context updates failed",
    );
    assert(
      host.querySelector("input") === field && field.value === "retained",
      "Spin replaced content",
    );
    assert(
      getComputedStyle(root(), "::after").content === '""',
      "Packed loading mask was not applied",
    );
    assert(
      host.querySelector(".semi-spin-animate [data-custom-indicator]"),
      "Custom Spin indicator missing",
    );
    spinning.value = false;
    await nextTick();
    assert(
      !loading() && getComputedStyle(root(), "::after").content === "none",
      "Spin failed to reveal content",
    );
    spinning.value = true;
    await nextTick();
    spinning.value = false;
    await nextTick();
    await sleep(90);
    await nextTick();
    assert(!loading(), "Cancelled Spin timer revived loading");
    spinning.value = true;
    await nextTick();
    visible.value = false;
    await nextTick();
    await sleep(90);
    await nextTick();
    assert(!host.querySelector(".semi-spin"), "Unmounted Spin returned");
    visible.value = true;
    await nextTick();
    assert(loading(), "Remounted Spin lost upstream initial loading semantics");
    app.unmount();
    mounted = false;
    await sleep(90);
    assert(!host.textContent, "Spin teardown left content");
    return "spin consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
