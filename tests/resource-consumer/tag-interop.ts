import {
  createApp,
  h,
  nextTick,
  onScopeDispose,
  ref,
  shallowRef,
  vaporInteropPlugin,
  watchEffect,
} from "vue";
import { Tag, TagGroup, SplitTagGroup } from "semi-ui-vue";
import type { TagProps } from "semi-ui-vue/tag/interface";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function settle() {
  await nextTick();
  for (let index = 0; index < 4; index++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    await nextTick();
  }
}
export async function checkTagInterop() {
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref("Interop"),
    count = ref(1),
    list = shallowRef<TagProps[]>([
      { children: "A", tagKey: "a", className: "interop-tag-a" },
      { children: "B", tagKey: "b", className: "interop-tag-b" },
    ]);
  let customMounts = 0,
    customDisposals = 0;
  const customContent = () => {
    customMounts++;
    onScopeDispose(() => {
      customDisposals++;
    });
    const input = document.createElement("input");
    input.dataset.tagInteropCustom = "";
    watchEffect(() => {
      input.value = label.value;
    });
    return input;
  };
  let closes = 0;
  const app = createApp({
    setup: () => () =>
      h("section", [
        h(Tag, {
          className: "interop-tag-close",
          children: label.value,
          closable: true,
          onClose: (_value: unknown, event: MouseEvent | KeyboardEvent) => {
            closes++;
            event.preventDefault();
          },
        }),
        h(
          Tag,
          { className: "interop-tag-owned" },
          {
            default: () =>
              h("button", { "data-tag-interop-button": "" }, label.value),
          },
        ),
        h(TagGroup, { mode: "custom", tagList: [customContent] }),
        h(TagGroup, {
          className: "interop-tag-group",
          maxTagCount: count.value,
          tagList: list.value,
        }),
        h(
          SplitTagGroup,
          { "aria-label": "Interop split", className: "interop-tag-split" },
          {
            default: () => [
              h(Tag, { children: label.value, key: "a" }),
              h(Tag, { children: "Tail", key: "b" }),
            ],
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
      "[data-tag-interop-button]",
    )!;
    const custom = host.querySelector<HTMLInputElement>(
      "[data-tag-interop-custom]",
    )!;
    assert(
      custom.value === "Interop" && customMounts === 1 && customDisposals === 0,
      "Interop custom TagGroup renderer did not mount",
    );
    button.focus();
    const first = host.querySelector(".interop-tag-a");
    assert(
      first &&
        host.querySelector(".interop-tag-group")?.textContent?.includes("+1"),
      "Interop TagGroup initial collapse failed",
    );
    host
      .querySelector<HTMLElement>(".interop-tag-close .semi-tag-close")!
      .click();
    await settle();
    assert(
      closes === 1 &&
        !host
          .querySelector(".interop-tag-close")
          ?.classList.contains("semi-tag-invisible"),
      "Interop Tag close veto failed",
    );
    count.value = 3;
    label.value = "Updated";
    list.value = [list.value[1], { ...list.value[0], children: "Updated A" }];
    await settle();
    assert(
      host.querySelector("[data-tag-interop-custom]") === custom &&
        String(custom.value) === "Updated" &&
        customMounts === 1 &&
        customDisposals === 0,
      "Interop custom TagGroup renderer lost live ownership",
    );
    assert(
      host.querySelector(".interop-tag-a") === first &&
        first.textContent?.includes("Updated A"),
      "Interop TagGroup key ownership failed",
    );
    assert(
      host.querySelector("[data-tag-interop-button]") === button &&
        button.textContent === "Updated" &&
        document.activeElement === button,
      "Interop Tag slot update lost focus or DOM",
    );
    custom.focus();
    label.value = "Focused";
    await settle();
    assert(
      host.querySelector("[data-tag-interop-custom]") === custom &&
        String(custom.value) === "Focused" &&
        document.activeElement === custom,
      "Interop native renderer update lost its input DOM or focus",
    );
    assert(
      host.querySelectorAll(".interop-tag-split .semi-tag-first").length ===
        1 &&
        host.querySelectorAll(".interop-tag-split .semi-tag-last").length === 1,
      "Interop SplitTagGroup decoration failed",
    );
    app.unmount();
    mounted = false;
    assert(host.childNodes.length === 0, "Interop Tag unmount retained DOM");
    assert(
      Number(customDisposals) === 1 && !custom.isConnected,
      "Interop custom renderer scope did not dispose exactly once",
    );
    label.value = "After unmount";
    window.dispatchEvent(new Event("resize"));
    await settle();
    assert(
      host.childNodes.length === 0 &&
        String(custom.value) === "Focused" &&
        Number(customDisposals) === 1,
      "Interop Tag stale work revived DOM or retained renderer effects",
    );
    return "tag interop passed";
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
}
