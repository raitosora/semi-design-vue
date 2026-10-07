import { createVaporApp, nextTick, onScopeDispose, ref } from "vue";
import { Empty, Button, ConfigProvider, Typography } from "semi-ui-vue";
import DefaultEmpty, { Empty as NamedEmpty } from "semi-ui-vue/empty";
import IllustrationNoContent from "semi-illustrations-vue/IllustrationNoContent";
import IllustrationNoContentDark from "semi-illustrations-vue/IllustrationNoContentDark";
import "semi-ui-vue/styles/components/empty.css";
import "semi-ui-vue/styles/components/typography.css";
import "semi-ui-vue/styles/components/button.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export async function checkEmptyConsumer() {
  assert(
    Empty === DefaultEmpty && Empty === NamedEmpty,
    "Empty public entries differ",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const originalDir = document.body.getAttribute("dir");
  const originalTheme = document.body.getAttribute("theme-mode");
  document.body.removeAttribute("theme-mode");
  const label = ref("Packed"),
    alive = ref(true),
    horizontal = ref(false);
  const direction = ref<"ltr" | "rtl">("ltr");
  let mounts = 0,
    disposals = 0,
    clicks = 0;
  const description = () => {
    mounts++;
    onScopeDispose(() => {
      disposals++;
    });
    return (
      <>
        <input data-packed-empty-input="" value={label.value} />
        <Typography.Text>{() => <span>{label.value}</span>}</Typography.Text>
      </>
    );
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
            <Empty
              className="packed-empty"
              data-packed-empty="present"
              description={description}
              imageStyle={{ width: "120px", height: "80px" }}
              layout={horizontal.value ? "horizontal" : "vertical"}
              style={{ width: "300px" }}
              title={label.value}
            >
              {{
                image: () => (
                  <IllustrationNoContent data-packed-empty-light="" />
                ),
                darkModeImage: () => (
                  <IllustrationNoContentDark data-packed-empty-dark="" />
                ),
                default: () => (
                  <Button data-packed-empty-button="">
                    {() => <span>Retry</span>}
                  </Button>
                ),
              }}
            </Empty>
          )}
          <Empty className="packed-empty-default" title="No image" />
          <Empty
            children={0}
            className="packed-empty-zero"
            description={0}
            image={0}
            title={0}
          />
          <Empty
            children={false}
            className="packed-empty-false"
            description={false}
            title={false}
          />
          <Empty
            className="packed-empty-escaped"
            description="<img src=x>"
            title="<b>safe</b>"
          />
          <Empty className="packed-empty-declared">
            {{ image: () => <></>, title: () => <></>, default: () => <></> }}
          </Empty>
        </section>
      )}
    </ConfigProvider>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const root = host.querySelector<HTMLElement>(".packed-empty")!;
    const input = host.querySelector<HTMLInputElement>(
      "[data-packed-empty-input]",
    )!;
    const button = host.querySelector<HTMLButtonElement>(
      "[data-packed-empty-button]",
    )!;
    const image = root.querySelector<HTMLElement>(".semi-empty-image")!;
    assert(
      root.dataset.packedEmpty === "present" && root.style.width === "300px",
      "Packed Empty root data/style failed",
    );
    assert(
      !root.hasAttribute("role") && !root.hasAttribute("aria-live"),
      "Packed Empty invented announcement semantics",
    );
    assert(
      root.querySelector("h4")?.textContent === "Packed" &&
        host.querySelector(".packed-empty-default h6")?.textContent ===
          "No image",
      "Packed Empty heading selection failed",
    );
    assert(
      !host.querySelector(
        ".packed-empty-default .semi-empty-image img, .packed-empty-default .semi-empty-image svg",
      ),
      "Packed Empty invented default illustration",
    );
    assert(
      getComputedStyle(image).width === "120px" &&
        getComputedStyle(image).height === "80px",
      "Packed Empty illustration dimensions failed",
    );
    assert(
      root.querySelector("[data-packed-empty-light]") &&
        !root.querySelector("[data-packed-empty-dark]"),
      "Packed Empty initial light illustration failed",
    );
    assert(
      !host.querySelector(".packed-empty-zero .semi-empty-title") &&
        !host.querySelector(".packed-empty-zero .semi-empty-description") &&
        !host.querySelector(".packed-empty-zero .semi-empty-footer"),
      "Packed Empty zero truthiness changed",
    );
    assert(
      host.querySelector(".packed-empty-zero .semi-empty-image")
        ?.textContent === "0",
      "Packed Empty image zero should render while zero title/description/footer stay absent",
    );
    assert(
      !host.querySelector(".packed-empty-false .semi-empty-title") &&
        !host.querySelector(".packed-empty-false .semi-empty-description"),
      "Packed Empty false truthiness changed",
    );
    assert(
      host
        .querySelector(".packed-empty-escaped")
        ?.textContent?.includes("<b>safe</b>") &&
        !host.querySelector(".packed-empty-escaped b") &&
        !host.querySelector(".packed-empty-escaped img"),
      "Packed Empty text escaped incorrectly",
    );
    assert(
      host.querySelector(".packed-empty-declared .semi-empty-image") &&
        host.querySelector(".packed-empty-declared h4") &&
        host.querySelector(".packed-empty-declared .semi-empty-footer"),
      "Packed Empty empty declared slots lost structural presence",
    );
    input.focus();
    button.click();
    label.value = "Updated";
    horizontal.value = true;
    direction.value = "rtl";
    await nextTick();
    assert(
      host.querySelector("[data-packed-empty-input]") === input &&
        input.value === "Updated" &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0 &&
        clicks === 1,
      "Packed Empty renderer DOM/focus/lifecycle or bubbling failed",
    );
    assert(
      root.classList.contains("semi-empty-horizontal") &&
        root.closest(".semi-rtl") &&
        getComputedStyle(root).display === "flex",
      "Packed Empty horizontal/context/CSS failed",
    );
    document.body.setAttribute("theme-mode", "dark");
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await nextTick();
    assert(
      root.querySelector("[data-packed-empty-dark]") &&
        !root.querySelector("[data-packed-empty-light]"),
      "Packed Empty dark illustration failed",
    );
    assert(
      host.querySelector("[data-packed-empty-input]") === input &&
        document.activeElement === input &&
        mounts === 1 &&
        disposals === 0,
      "Packed Empty theme change replaced unrelated owned content",
    );
    document.body.removeAttribute("theme-mode");
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await nextTick();
    assert(
      root.querySelector("[data-packed-empty-light]") &&
        !root.querySelector("[data-packed-empty-dark]"),
      "Packed Empty theme removal failed",
    );
    alive.value = false;
    await nextTick();
    assert(
      !host.querySelector(".packed-empty") && Number(disposals) === 1,
      "Packed Empty conditional unmount retained content scope",
    );
    alive.value = true;
    await nextTick();
    assert(
      Number(mounts) === 2 &&
        host.querySelector("[data-packed-empty-input]") !== input,
      "Packed Empty remount reused disposed content",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0 && Number(disposals) === 2,
      "Packed Empty unmount retained DOM/scope",
    );
    label.value = "Unmounted";
    document.body.setAttribute("theme-mode", "dark");
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await nextTick();
    assert(
      host.childNodes.length === 0 && Number(mounts) === 2,
      "Packed Empty disposed updates revived content",
    );
    return "empty consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
    if (originalDir === null) document.body.removeAttribute("dir");
    else document.body.setAttribute("dir", originalDir);
    if (originalTheme === null) document.body.removeAttribute("theme-mode");
    else document.body.setAttribute("theme-mode", originalTheme);
  }
}
