import { createVaporApp, nextTick, ref } from "vue";
import { Collapsible } from "semi-ui-vue";
import SubpathCollapsible, {
  Collapsible as NamedCollapsible,
} from "semi-ui-vue/collapsible";
import "semi-ui-vue/styles/components/collapsible.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkCollapsibleConsumer() {
  assert(
    Collapsible === SubpathCollapsible && Collapsible === NamedCollapsible,
    "Collapsible entry identities differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const open = ref(false);
  const text = ref("Packed content");
  const motion = ref(false);
  const keep = ref(false);
  let completed = 0;
  const app = createVaporApp(() => (
    <Collapsible
      className="packed-collapsible"
      duration={80}
      isOpen={open.value}
      keepDOM={keep.value}
      lazyRender={true}
      motion={motion.value}
      onMotionEnd={() => completed++}
      v-slots={{
        default: () => (
          <div data-packed-content="" style={{ height: "48px" }}>
            {text.value}
          </div>
        ),
      }}
    />
  ));
  let attached = false;
  try {
    app.mount(host);
    attached = true;
    await nextTick();
    const root = () => host.querySelector<HTMLElement>(".packed-collapsible")!;
    assert(
      !root().querySelector("[data-packed-content]"),
      "Closed lazy content rendered",
    );
    open.value = true;
    await nextTick();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    assert(
      root().querySelector("[data-packed-content]")?.textContent ===
        "Packed content" && parseFloat(root().style.height) === 48,
      "Packed open geometry failed",
    );
    text.value = "Updated content";
    keep.value = true;
    await nextTick();
    open.value = false;
    await nextTick();
    assert(
      root().querySelector("[data-packed-content]")?.textContent ===
        "Updated content" && root().style.height === "0px",
      "keepDOM update failed",
    );
    keep.value = false;
    await nextTick();
    assert(
      !root().querySelector("[data-packed-content]"),
      "Closed children retained without keepDOM",
    );
    motion.value = true;
    open.value = true;
    await nextTick();
    const detached = root();
    const before = completed;
    app.unmount();
    attached = false;
    assert(host.childNodes.length === 0, "Collapsible unmount left DOM");
    detached.dispatchEvent(
      new TransitionEvent("transitionend", {
        propertyName: "height",
        bubbles: true,
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 180));
    assert(
      completed === before && host.childNodes.length === 0,
      "Detached transition revived DOM or callback",
    );
    return "collapsible consumer passed";
  } finally {
    if (attached) app.unmount();
    host.remove();
  }
}
