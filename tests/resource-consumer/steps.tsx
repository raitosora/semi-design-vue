import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { Steps, Step, ConfigProvider } from "semi-ui-vue";
import DefaultSteps, { Steps as NamedSteps } from "semi-ui-vue/steps";
import DirectStep from "semi-ui-vue/steps/step";
import "semi-ui-vue/styles/components/steps.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkStepsConsumer() {
  assert(
    Steps === DefaultSteps &&
      Steps === NamedSteps &&
      Step === DirectStep &&
      Steps.Step === Step,
    "Steps public identity differs",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const label = ref("Packed"),
    alive = ref(true),
    current = ref(1);
  const direction = ref<"ltr" | "rtl">("ltr");
  let changes: readonly number[] = [];
  let mounts = 0,
    disposals = 0,
    clicks = 0,
    keys = 0,
    bubbled = 0;
  const owned = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return <input data-steps-owned="" value={label.value} />;
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
            <Steps
              aria-label="Packed progress"
              current={current.value}
              data-packed-steps=""
              onChange={(value) => {
                changes = [...changes, value];
              }}
              type="basic"
            >
              {() => (
                <>
                  <Steps.Step description="First description" title="First" />
                  <Step
                    onClick={(event) => {
                      clicks++;
                      event.preventDefault();
                    }}
                    onKeyDown={() => {
                      keys++;
                    }}
                  >
                    {{ title: owned }}
                  </Step>
                  <DirectStep status="warning" title="Last" />
                </>
              )}
            </Steps>
          )}
          <Steps
            data-packed-fill=""
            initial={4}
            onChange={(value) => {
              changes = [...changes, value];
            }}
          >
            {() => (
              <>
                <Step description={0} title="<script>unsafe</script>" />
                <Step icon={null} title="Second" />
              </>
            )}
          </Steps>
          <Steps
            current={1}
            data-packed-nav=""
            initial={6}
            onChange={(value) => {
              changes = [...changes, value];
            }}
            size="small"
            type="nav"
          >
            {() => (
              <>
                <Step title="Nav first" />
                <Step description="Ignored" icon="Ignored" title="Nav last" />
              </>
            )}
          </Steps>
        </section>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    await Promise.resolve();
    await nextTick();
    const root = host.querySelector<HTMLElement>("[data-packed-steps]")!;
    const input = root.querySelector<HTMLInputElement>("[data-steps-owned]")!;
    const items = root.querySelectorAll<HTMLElement>(".semi-steps-item");
    assert(
      root.tagName === "DIV" && items.length === 3,
      "Steps basic structure differs",
    );
    assert(
      root.getAttribute("aria-label") === "Packed progress" &&
        !root.hasAttribute("role") &&
        !root.hasAttribute("aria-live"),
      "Steps root ARIA differs",
    );
    assert(
      items[0]!.classList.contains("semi-steps-item-finish") &&
        items[1]!.classList.contains("semi-steps-item-process") &&
        items[2]!.classList.contains("semi-steps-item-warning"),
      "Steps status precedence differs",
    );
    assert(
      Array.from(items).every(
        (item) =>
          item.tabIndex === 0 && item.getAttribute("aria-current") === "step",
      ),
      "Steps fixed focus/reader semantics differ",
    );
    input.focus();
    label.value = "Updated";
    direction.value = "rtl";
    current.value = 2;
    await nextTick();
    assert(
      root.querySelector("input") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Steps update replaced owned title",
    );
    assert(
      root.closest(".semi-rtl") &&
        items[1]!.classList.contains("semi-steps-item-finish") &&
        items[2]!.classList.contains("semi-steps-item-warning"),
      "Steps current/context update failed",
    );
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    items[1]!.dispatchEvent(click);
    assert(
      clicks === 1 &&
        click.defaultPrevented &&
        changes.join() === "1" &&
        bubbled === 1,
      "Steps click ordering/default/bubbling differs",
    );
    items[1]!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
    items[1]!.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        bubbles: true,
        cancelable: true,
      }),
    );
    assert(
      keys === 1 && changes.join() === "1,1",
      "Steps Enter/Space semantics differ",
    );
    const fill = host.querySelector<HTMLElement>("[data-packed-fill]")!;
    assert(
      fill.classList.contains("semi-steps") &&
        fill.querySelectorAll(".semi-row-flex > .semi-col").length === 2,
      "Steps default fill grid differs",
    );
    assert(
      fill.querySelector(".semi-col")?.getAttribute("style")?.includes("50%") &&
        fill.textContent?.includes("<script>unsafe</script>0") &&
        !fill.querySelector("script"),
      "Steps fill width/scalar escaping differs",
    );
    fill.querySelectorAll<HTMLElement>(".semi-steps-item")[1]!.click();
    assert(changes.at(-1) === 5, "Steps initial click callback differs");
    const nav = host.querySelector<HTMLElement>("[data-packed-nav]")!;
    assert(
      nav.classList.contains("semi-steps-nav") &&
        nav.classList.contains("semi-steps-small") &&
        nav.querySelectorAll(".semi-steps-item-icon").length === 1 &&
        !nav.textContent?.includes("Ignored"),
      "Steps nav content/last item differs",
    );
    nav.querySelectorAll<HTMLElement>(".semi-steps-item")[0]!.click();
    assert(changes.at(-1) === 6, "Steps nav initial callback differs");
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector("[data-packed-steps]") && Number(disposals) === 1,
      "Steps removal retained title scope",
    );
    alive.value = true;
    await nextTick();
    assert(
      host.querySelector("[data-steps-owned]") !== input &&
        Number(mounts) === 2,
      "Steps remount failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Steps unmount retained DOM/scope",
    );
    label.value = "Disposed";
    await nextTick();
    assert(host.childNodes.length === 0, "Steps disposed update revived DOM");
    return "steps consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
  }
}
