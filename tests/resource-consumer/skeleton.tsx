import { createVaporApp, nextTick, ref } from "vue";
import { Skeleton } from "semi-ui-vue";
import SubpathSkeleton, {
  Skeleton as NamedSubpathSkeleton,
} from "semi-ui-vue/skeleton";
import "semi-ui-vue/styles/components/skeleton.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkSkeletonConsumer() {
  assert(
    Skeleton === SubpathSkeleton && Skeleton === NamedSubpathSkeleton,
    "Skeleton root and subpath identities differ",
  );
  for (const name of ["Avatar", "Title", "Button", "Paragraph", "Image"])
    assert(
      Skeleton[name as keyof typeof Skeleton] != null,
      `Skeleton.${name} static member is missing`,
    );
  const host = document.createElement("div");
  document.body.append(host);
  const loading = ref(true);
  const active = ref(true);
  const mounted = ref(true);
  const label = ref("Initial");
  const rows = ref(3);
  const app = createVaporApp(() => (
    <>
      {mounted.value && (
        <Skeleton
          active={active.value}
          className="packed-skeleton"
          data-packed-skeleton=""
          loading={loading.value}
          role="status"
          style={{ width: "240px" }}
          v-slots={{
            placeholder: () => (
              <>
                <Skeleton.Avatar shape="circle" size="small" />
                <Skeleton.Title />
                <Skeleton.Button />
                <Skeleton.Paragraph rows={rows.value} />
                <Skeleton.Image style={{ width: "40px", height: "30px" }} />
              </>
            ),
            default: () => (
              <section data-packed-content="">
                <button data-packed-focus="">{label.value}</button>
              </section>
            ),
          }}
        />
      )}
      <Skeleton.Avatar className="standalone-skeleton-avatar" size="large" />
    </>
  ));
  let attached = false;
  try {
    app.mount(host);
    attached = true;
    await nextTick();
    const root = () => host.querySelector<HTMLElement>(".packed-skeleton");
    assert(
      root()?.classList.contains("semi-skeleton") &&
        root()?.classList.contains("semi-skeleton-active") &&
        root()?.getAttribute("role") === "status" &&
        root()?.hasAttribute("data-packed-skeleton"),
      "Packed Skeleton loading root or forwarded attributes failed",
    );
    assert(
      host.querySelectorAll(".packed-skeleton .semi-skeleton-paragraph li")
        .length === 3 &&
        !!host.querySelector(".packed-skeleton .semi-skeleton-avatar-small") &&
        !!host.querySelector(".packed-skeleton .semi-skeleton-title") &&
        !!host.querySelector(".packed-skeleton .semi-skeleton-button") &&
        !!host.querySelector(".packed-skeleton .semi-skeleton-image") &&
        !host.querySelector("[data-packed-content]"),
      "Packed Skeleton placeholder structure or content switch failed",
    );
    assert(
      getComputedStyle(host.querySelector(".semi-skeleton-title")!)
        .animationName === "skeleton-loading" &&
        getComputedStyle(host.querySelector(".standalone-skeleton-avatar")!)
          .width === "72px",
      "Packed Skeleton stylesheet or standalone item failed",
    );
    rows.value = 0;
    active.value = false;
    await nextTick();
    assert(
      root() &&
        !root()!.classList.contains("semi-skeleton-active") &&
        host.querySelectorAll(".packed-skeleton .semi-skeleton-paragraph li")
          .length === 0,
      "Packed Skeleton dynamic active or zero-row update failed",
    );
    loading.value = false;
    await nextTick();
    const button = host.querySelector<HTMLButtonElement>("[data-packed-focus]");
    assert(button && !root(), "Packed Skeleton did not reveal content");
    button.focus();
    label.value = "Updated";
    await nextTick();
    assert(
      button.textContent === "Updated" && document.activeElement === button,
      "Packed Skeleton replaced stable content during a slot update",
    );
    loading.value = true;
    await nextTick();
    assert(
      root() && !host.querySelector("[data-packed-content]"),
      "Packed Skeleton failed to remount placeholder",
    );
    mounted.value = false;
    await nextTick();
    assert(!root(), "Packed Skeleton conditional unmount failed");
    assert(
      host.querySelector(".standalone-skeleton-avatar"),
      "Packed Skeleton standalone item disappeared before app teardown",
    );
    app.unmount();
    attached = false;
    assert(host.childNodes.length === 0, "Packed Skeleton teardown left DOM");
    return "skeleton consumer passed";
  } finally {
    if (attached) app.unmount();
    host.remove();
  }
}
