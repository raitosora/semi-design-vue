import { createApp, h, nextTick, ref, vaporInteropPlugin } from "vue";
import { Avatar, AvatarGroup } from "semi-ui-vue";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function settle() {
  await nextTick();
  for (let n = 0; n < 4; n++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
  }
}
export async function checkAvatarInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const text = ref("Interop"),
    ids = ref(["a", "b", "c"]),
    limit = ref(2);
  let clicks = 0;
  const app = createApp({
    setup: () => () =>
      h("section", [
        h(
          Avatar,
          {
            className: "interop-avatar-owned",
            size: "small",
            onClick: () => clicks++,
          },
          {
            default: () =>
              h("button", { "data-avatar-interop-button": "" }, text.value),
          },
        ),
        h(
          AvatarGroup,
          { maxCount: limit.value, size: "small" },
          {
            default: () =>
              ids.value.map((id) =>
                h(Avatar, {
                  key: id,
                  className: `interop-avatar-${id}`,
                  children: `${text.value} ${id}`,
                }),
              ),
          },
        ),
      ]),
  });
  app.use(vaporInteropPlugin);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await settle();
    const button = host.querySelector<HTMLButtonElement>(
      "[data-avatar-interop-button]",
    )!;
    const first = host.querySelector<HTMLElement>(".interop-avatar-a")!;
    assert(
      first.getBoundingClientRect().width === 32 &&
        host
          .querySelector(".semi-avatar-item-more")
          ?.textContent?.includes("+1"),
      "Interop AvatarGroup real geometry/collapse failed",
    );
    button.focus();
    button.click();
    assert(
      clicks === 1 && document.activeElement === button,
      "Interop Avatar slot interaction/focus failed",
    );
    limit.value = 4;
    text.value = "Updated";
    ids.value = ["c", "a", "d"];
    await settle();
    assert(
      host.querySelector(".interop-avatar-a") === first &&
        first.textContent?.includes("Updated a"),
      "Interop AvatarGroup keyed ownership failed",
    );
    assert(
      host.querySelector("[data-avatar-interop-button]") === button &&
        button.textContent === "Updated",
      "Interop Avatar native slot owner replaced",
    );
    const ordered = Array.from(
      host.querySelectorAll(
        ".interop-avatar-a,.interop-avatar-c,.interop-avatar-d",
      ),
    ).map((node) => node.className.match(/interop-avatar-([acd])/)?.[1]);
    assert(
      ordered.join(",") === "c,a,d" &&
        !host.querySelector(".semi-avatar-item-more"),
      "Interop AvatarGroup reordered collapse failed",
    );
    app.unmount();
    mounted = false;
    assert(host.childNodes.length === 0, "Interop Avatar unmount retained DOM");
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert(
      host.childNodes.length === 0,
      "Interop Avatar async callback revived DOM",
    );
    return "avatar interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
