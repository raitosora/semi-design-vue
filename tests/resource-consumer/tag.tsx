import { createVaporApp, nextTick, ref, shallowRef } from "vue";
import { Tag, TagGroup, SplitTagGroup } from "semi-ui-vue";
import DefaultTag, {
  Tag as NamedTag,
  TagGroup as IndexGroup,
  SplitTagGroup as IndexSplit,
} from "semi-ui-vue/tag";
import GroupSubpath from "semi-ui-vue/tag/group";
import SplitSubpath from "semi-ui-vue/tag/splitTagGroup";
import type { TagProps } from "semi-ui-vue/tag/interface";
import "semi-ui-vue/styles/components/tag.css";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function settle() {
  await nextTick();
  for (let index = 0; index < 5; index++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
  }
}
const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Cpath fill='red' d='M0 0h10v10H0z'/%3E%3C/svg%3E";
export async function checkTagConsumer() {
  assert(
    Tag === DefaultTag &&
      Tag === NamedTag &&
      TagGroup === GroupSubpath &&
      SplitTagGroup === SplitSubpath &&
      TagGroup === IndexGroup &&
      SplitTagGroup === IndexSplit &&
      Tag.__SemiComponentName__ === "Tag",
    "Tag public entry identity differs",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("Packed"),
    limit = ref(2),
    veto = ref(true);
  const list = shallowRef<TagProps[]>([
    {
      children: "Alpha",
      tagKey: "a",
      className: "packed-tag-a",
      closable: true,
    },
    {
      children: "Beta",
      tagKey: "b",
      className: "packed-tag-b",
      closable: true,
    },
    {
      children: "Gamma",
      tagKey: "c",
      className: "packed-tag-c",
      closable: true,
    },
  ]);
  const customContent = () => (
    <input data-packed-custom-tag="" value={label.value} />
  );
  const events: string[] = [];
  let closedValue: unknown, closedEvent: Event | undefined, closedKey: unknown;
  const app = createVaporApp(() => (
    <section onClick={() => events.push("parent")}>
      <Tag
        children={label.value}
        className="packed-tag-close"
        closable
        onClick={() => events.push("click")}
        onClose={(value, event, key) => {
          events.push("close");
          closedValue = value;
          closedEvent = event;
          closedKey = key;
          if (veto.value) event.preventDefault();
        }}
        tagKey="close"
      />
      <Tag
        avatarSrc={image}
        children="Portrait"
        className="packed-tag-image"
        size="large"
      />
      <Tag
        className="packed-tag-owned"
        v-slots={{
          default: () => (
            <button data-packed-tag-button="">{label.value}</button>
          ),
        }}
      />
      <TagGroup
        className="packed-custom-group"
        mode="custom"
        tagList={[customContent]}
      />
      <TagGroup
        className="packed-tag-group"
        maxTagCount={limit.value}
        onTagClose={(_value, event, key) => {
          events.push(`group:${String(key)}`);
          event.preventDefault();
        }}
        tagList={list.value}
      />
      <SplitTagGroup aria-label="Packed split" className="packed-tag-split">
        {() => (
          <>
            <Tag children={label.value} className="packed-tag-first" />
            <Tag children="Tail" className="packed-tag-last" />
          </>
        )}
      </SplitTagGroup>
    </section>
  ));
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await settle();
    const closeRoot = host.querySelector<HTMLElement>(".packed-tag-close")!;
    const close = closeRoot.querySelector<HTMLElement>(".semi-tag-close")!;
    assert(
      closeRoot.getAttribute("role") === "button" && closeRoot.tabIndex === 0,
      "Packed closable Tag keyboard contract missing",
    );
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    close.dispatchEvent(event);
    await settle();
    assert(
      events.join(",") === "close" &&
        closedValue === "Packed" &&
        closedKey === "close" &&
        closedEvent === event &&
        event.defaultPrevented &&
        !closeRoot.classList.contains("semi-tag-invisible"),
      "Packed Tag close veto/parameters/propagation failed",
    );
    veto.value = false;
    close.click();
    await settle();
    assert(
      events.join(",") === "close,close" &&
        closeRoot.classList.contains("semi-tag-invisible") &&
        host.contains(closeRoot),
      "Packed Tag close must hide the retained root without bubbling",
    );
    const imageNode = host.querySelector<HTMLImageElement>(
      ".packed-tag-image img",
    );
    assert(
      imageNode?.complete && imageNode.naturalWidth === 10,
      "Packed Tag Avatar image did not load",
    );
    const button = host.querySelector<HTMLButtonElement>(
      "[data-packed-tag-button]",
    )!;
    const custom = host.querySelector<HTMLInputElement>(
      "[data-packed-custom-tag]",
    )!;
    assert(
      custom.value === "Packed",
      "Packed custom TagGroup renderer did not mount",
    );
    button.focus();
    const group = host.querySelector<HTMLElement>(".packed-tag-group")!;
    const first = group.querySelector<HTMLElement>(".packed-tag-a")!;
    assert(
      group.textContent?.includes("+1") &&
        !group.querySelector(".packed-tag-c"),
      "Packed TagGroup initial count collapse failed",
    );
    label.value = "Updated";
    limit.value = 4;
    list.value = [
      list.value[1],
      { ...list.value[0], children: "Alpha updated" },
      {
        children: "Delta",
        tagKey: "d",
        className: "packed-tag-d",
        closable: true,
      },
    ];
    await settle();
    assert(
      host.querySelector("[data-packed-tag-button]") === button &&
        button.textContent === "Updated" &&
        document.activeElement === button,
      "Packed Tag slot update lost DOM/focus ownership",
    );
    assert(
      host.querySelector("[data-packed-custom-tag]") === custom &&
        String(custom.value) === "Updated",
      "Packed custom TagGroup renderer lost live content ownership",
    );
    assert(
      group.querySelector(".packed-tag-a") === first &&
        first.textContent?.includes("Alpha updated"),
      "Packed TagGroup stable key update replaced DOM",
    );
    assert(
      Array.from(
        group.querySelectorAll(".packed-tag-a,.packed-tag-b,.packed-tag-d"),
      )
        .map((node) => node.className.match(/packed-tag-([abd])/)?.[1])
        .join(",") === "b,a,d" && !group.textContent?.includes("+1"),
      "Packed TagGroup reorder/expansion failed",
    );
    first.querySelector<HTMLElement>(".semi-tag-close")!.click();
    await settle();
    assert(
      events.at(-1) === "group:a" &&
        !first.classList.contains("semi-tag-invisible"),
      "Packed TagGroup close callback veto failed",
    );
    const split = host.querySelector<HTMLElement>(".packed-tag-split")!;
    assert(
      split.getAttribute("role") === "group" &&
        split.getAttribute("aria-label") === "Packed split" &&
        split
          .querySelector(".packed-tag-first")
          ?.classList.contains("semi-tag-first") &&
        split
          .querySelector(".packed-tag-last")
          ?.classList.contains("semi-tag-last"),
      "Packed SplitTagGroup boundary decoration failed",
    );
    app.unmount();
    mounted = false;
    assert(
      host.childNodes.length === 0,
      "Packed Tag unmount retained owned DOM",
    );
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert(host.childNodes.length === 0, "Packed Tag stale work revived DOM");
    return "tag consumer passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
