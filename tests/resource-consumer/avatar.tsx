import { createVaporApp, nextTick, ref, type ShallowRef } from "vue";
import { For } from "vue-jsx/vapor";
import { Avatar, AvatarGroup } from "semi-ui-vue";
import DefaultAvatar, {
  Avatar as NamedAvatar,
  AvatarGroup as NamedGroup,
} from "semi-ui-vue/avatar";
import GroupSubpath from "semi-ui-vue/avatar/avatarGroup";
import "semi-ui-vue/styles/components/avatar.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function settle() {
  await nextTick();
  for (let n = 0; n < 5; n++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
  }
}
const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cpath fill='red' d='M0 0h10v10H0z'/%3E%3C/svg%3E";
export async function checkAvatarConsumer() {
  assert(
    Avatar === DefaultAvatar &&
      Avatar === NamedAvatar &&
      AvatarGroup === NamedGroup &&
      AvatarGroup === GroupSubpath,
    "Avatar public entry identity differs",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const source = ref(image),
    text = ref("WWWWWWWWWWWW"),
    limit = ref(2),
    ids = ref(["a", "b", "c"]),
    label = ref("Packed");
  let errors = 0,
    clicks = 0;
  const app = createVaporApp(() => (
    <section>
      <Avatar
        alt="Packed portrait"
        children="Fallback"
        className="packed-avatar-image"
        onError={() => {
          errors++;
        }}
        size="small"
        src={source.value}
      />
      <Avatar
        children={text.value}
        className="packed-avatar-text"
        gap={4}
        size="small"
      />
      <Avatar
        className="packed-avatar-owned"
        onClick={() => clicks++}
        v-slots={{
          default: () => (
            <button data-packed-avatar-button="">{label.value}</button>
          ),
        }}
      />
      <div data-packed-avatar-group="">
        <AvatarGroup maxCount={limit.value} size="small">
          {() => (
            <For getKey={(id: string) => id} in={ids.value}>
              {{
                default: (item: ShallowRef<unknown>) => (
                  <Avatar
                    children={`${label.value} ${String(item.value)}`}
                    className={`packed-avatar-${String(item.value)}`}
                  />
                ),
              }}
            </For>
          )}
        </AvatarGroup>
      </div>
    </section>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await settle();
    const img = host.querySelector<HTMLImageElement>(
      ".packed-avatar-image img",
    );
    assert(
      img?.complete && img.naturalWidth === 10 && img.alt === "Packed portrait",
      "Packed Avatar image loading/alt failed",
    );
    assert(
      Math.abs(img.getBoundingClientRect().width - 32) < 0.1,
      "Packed Avatar small image geometry changed",
    );
    const textRoot = host.querySelector<HTMLElement>(".packed-avatar-text")!;
    const glyph = textRoot.querySelector<HTMLElement>(".semi-avatar-label")!;
    assert(
      textRoot.getBoundingClientRect().width === 32 &&
        glyph.getBoundingClientRect().width <= 32 &&
        glyph.offsetWidth > 32,
      "Packed Avatar did not scale long text using real geometry",
    );
    const button = host.querySelector<HTMLButtonElement>(
      "[data-packed-avatar-button]",
    )!;
    button.focus();
    button.click();
    assert(
      document.activeElement === button && clicks === 1,
      "Packed Avatar owned interaction/focus duplicated",
    );
    const group = host.querySelector<HTMLElement>(
      "[data-packed-avatar-group]",
    )!;
    const nodeA = group.querySelector<HTMLElement>(".packed-avatar-a")!;
    const visible = () =>
      [
        ...group.querySelectorAll<HTMLElement>(
          ".packed-avatar-a,.packed-avatar-b,.packed-avatar-c,.packed-avatar-d",
        ),
      ].filter(
        (node) =>
          !node.closest("[hidden],[inert]") && node.getClientRects().length > 0,
      );
    assert(
      visible().length === 2 &&
        group
          .querySelector(".semi-avatar-item-more")
          ?.textContent?.includes("+1"),
      "Packed AvatarGroup initial collapse failed",
    );
    limit.value = 4;
    await settle();
    assert(
      visible().length === 3 &&
        group.querySelector(".packed-avatar-a") === nodeA,
      "Packed AvatarGroup expansion replaced an owned Avatar",
    );
    label.value = "Updated";
    ids.value = ["c", "a", "d"];
    text.value = "I";
    await settle();
    assert(
      visible()
        .map((node) => node.className.match(/packed-avatar-([a-d])/)?.[1])
        .join(",") === "c,a,d" &&
        group.querySelector(".packed-avatar-a") === nodeA &&
        nodeA.textContent?.includes("Updated a"),
      "Packed AvatarGroup keyed reorder/dynamic content failed",
    );
    assert(
      host.querySelector("[data-packed-avatar-button]") === button &&
        button.textContent === "Updated",
      "Packed Avatar slot owner or DOM identity changed",
    );
    assert(
      glyph.getBoundingClientRect().width <= 32,
      "Packed Avatar short text geometry failed",
    );
    source.value = "data:image/png;base64,broken";
    await settle();
    assert(
      errors === 1 &&
        !host.querySelector(".packed-avatar-image img") &&
        host
          .querySelector(".packed-avatar-image")
          ?.textContent?.includes("Fallback"),
      "Packed Avatar error fallback failed",
    );
    source.value = image;
    await settle();
    assert(
      host.querySelector<HTMLImageElement>(".packed-avatar-image img")
        ?.naturalWidth === 10,
      "Packed Avatar cached image recovery failed",
    );
    const before = errors;
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0,
      "Packed Avatar unmount retained owned DOM",
    );
    img.dispatchEvent(new Event("error"));
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert(
      errors === before && host.childNodes.length === 0,
      "Packed Avatar stale callbacks survived unmount",
    );
    return "avatar consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
