import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { Badge, ConfigProvider } from "semi-ui-vue";
import DefaultBadge, { Badge as NamedBadge } from "semi-ui-vue/badge";
import "semi-ui-vue/styles/components/badge.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkBadgeConsumer() {
  assert(
    Badge === DefaultBadge && Badge === NamedBadge,
    "Badge public entries differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const count = ref(10),
    dot = ref(false),
    label = ref("Packed"),
    direction = ref<"ltr" | "rtl">("ltr");
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const custom = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-packed-badge-custom="" value={label.value} />;
  };
  const app = createVaporApp(() => (
    <ConfigProvider direction={direction.value}>
      {() => (
        <section
          onClick={() => {
            clicks++;
          }}
        >
          <Badge
            className="packed-badge-anchor"
            count={count.value}
            countClassName="packed-badge-count"
            countStyle={{ color: "red" }}
            overflowCount={9}
            style={{ color: "rgb(1, 2, 3)" }}
          >
            {() => <button data-packed-badge-anchor="">{label.value}</button>}
          </Badge>
          <Badge
            className="packed-badge-custom"
            count={custom}
            dot={dot.value}
          />
          <Badge className="packed-badge-zero" count={0} />
          <Badge
            className="packed-badge-negative"
            count={-0.5}
            overflowCount={0}
          />
          <Badge className="packed-badge-text" count="<b>safe</b>" />
          <Badge className="packed-badge-empty-slot" count={1}>
            {() => <></>}
          </Badge>
        </section>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const marker = host.querySelector<HTMLElement>(".packed-badge-count")!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-packed-badge-anchor]",
    )!;
    const input = host.querySelector<HTMLInputElement>(
      "[data-packed-badge-custom]",
    )!;
    assert(
      marker.textContent === "9+" &&
        marker.classList.contains("semi-badge-rightTop") &&
        marker.style.color === "rgb(1, 2, 3)",
      "Packed Badge threshold/default position/style priority failed",
    );
    assert(
      !marker.hasAttribute("role") && !marker.hasAttribute("aria-live"),
      "Packed Badge invented announcement semantics",
    );
    assert(
      host.querySelector(".packed-badge-zero .semi-badge-block")
        ?.textContent === "0",
      "Packed Badge zero/standalone failed",
    );
    assert(
      host.querySelector(".packed-badge-negative .semi-badge-block")
        ?.textContent === "-0.5",
      "Packed Badge zero threshold or decimal changed",
    );
    assert(
      host.querySelector(".packed-badge-text")?.textContent === "<b>safe</b>" &&
        !host.querySelector(".packed-badge-text b"),
      "Packed Badge escaped text failed",
    );
    assert(
      host.querySelector(".packed-badge-empty-slot .semi-badge-rightTop") &&
        !host.querySelector(".packed-badge-empty-slot .semi-badge-block"),
      "Packed Badge empty declared slot lost anchor ownership",
    );
    button.focus();
    button.click();
    count.value = 9;
    label.value = "Updated";
    direction.value = "rtl";
    await nextTick();
    assert(
      host.querySelector("[data-packed-badge-anchor]") === button &&
        button.textContent === "Updated" &&
        document.activeElement === button &&
        clicks === 1,
      "Packed Badge anchor update lost DOM/focus or bubbling",
    );
    assert(
      String(marker.textContent) === "9" &&
        marker.classList.contains("semi-badge-leftTop"),
      "Packed Badge exact threshold/context update failed",
    );
    assert(
      host.querySelector("[data-packed-badge-custom]") === input &&
        input.value === "Updated" &&
        mounts === 1 &&
        disposals === 0,
      "Packed Badge count renderer ownership failed",
    );
    input.focus();
    label.value = "Focused";
    await nextTick();
    assert(
      host.querySelector("[data-packed-badge-custom]") === input &&
        String(input.value) === "Focused" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Packed Badge renderer reactive update lost DOM/focus",
    );
    dot.value = true;
    await nextTick();
    assert(
      !host.querySelector("[data-packed-badge-custom]") &&
        Number(disposals) === 1 &&
        mounts === 1 &&
        host.querySelector(".packed-badge-custom .semi-badge-dot"),
      "Packed Badge dot did not dispose/suppress count renderer",
    );
    dot.value = false;
    await nextTick();
    assert(
      Number(mounts) === 2 && Number(disposals) === 1,
      "Packed Badge count renderer remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Packed Badge unmount retained DOM/scope",
    );
    label.value = "Unmounted";
    await nextTick();
    assert(
      host.childNodes.length === 0 && Number(mounts) === 2,
      "Packed Badge unmounted update revived DOM",
    );
    return "badge consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
