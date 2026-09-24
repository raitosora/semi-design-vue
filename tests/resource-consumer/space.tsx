import { createVaporApp, nextTick, ref } from "vue";
import { ConfigProvider, Space } from "semi-ui-vue";
import SpaceFromSubpath, { Space as NamedSpace } from "semi-ui-vue/space";
import "semi-ui-vue/styles/components/space.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

export async function checkSpaceConsumer() {
  assert(
    Space === SpaceFromSubpath && Space === NamedSpace,
    "Space entry identities differ",
  );
  assert(
    !Object.hasOwn(Space, "elementType") &&
      !Object.hasOwn(Space, "defaultProps"),
    "Space invented upstream static members",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const vertical = ref<boolean | undefined>(undefined);
  const wrap = ref<boolean | undefined>(undefined);
  const align = ref<"start" | "center" | "end" | "baseline" | undefined>(
    undefined,
  );
  const spacing = ref<
    | number
    | "tight"
    | "medium"
    | "loose"
    | (number | "tight" | "medium" | "loose")[]
    | undefined
  >(undefined);
  const label = ref("first");
  const visible = ref(true);
  const mounted = ref(true);
  const direction = ref<"ltr" | "rtl">("rtl");
  const app = createVaporApp(() => (
    <ConfigProvider
      direction={direction.value}
      v-slots={{
        default: () => (
          <>
            {mounted.value && (
              <Space
                align={align.value}
                aria-label="Packed actions"
                class="packed-native-space"
                className="packed-space"
                role="group"
                spacing={spacing.value}
                v-slots={{
                  default: () => (
                    <>
                      {visible.value && (
                        <button data-action="first">{label.value}</button>
                      )}
                      <button data-action="second">second</button>
                    </>
                  ),
                }}
                vertical={vertical.value}
                wrap={wrap.value}
              />
            )}
            <Space className="packed-empty-space" />
          </>
        ),
      }}
    />
  ));
  let active = false;
  try {
    app.mount(host);
    active = true;
    await flush();
    const space = () => host.querySelector<HTMLElement>(".packed-space")!;
    assert(
      space().classList.contains("semi-space-horizontal") &&
        space().classList.contains("semi-space-align-center") &&
        space().classList.contains("semi-space-tight-horizontal") &&
        space().classList.contains("semi-space-tight-vertical"),
      "Space undefined defaults drifted",
    );
    assert(
      space().classList.contains("packed-native-space") &&
        space().getAttribute("role") === "group" &&
        space().getAttribute("aria-label") === "Packed actions" &&
        space().querySelectorAll(":scope > button").length === 2,
      "Space native attributes or fragment slot failed",
    );
    assert(
      getComputedStyle(space()).display === "inline-flex" &&
        getComputedStyle(space()).direction === "rtl" &&
        !space().hasAttribute("dir"),
      "Packed Space CSS or ConfigProvider RTL failed",
    );
    const second = space().querySelector<HTMLButtonElement>(
      '[data-action="second"]',
    )!;
    second.focus();
    vertical.value = true;
    wrap.value = true;
    align.value = "baseline";
    spacing.value = [12, "medium"];
    label.value = "updated";
    await flush();
    assert(
      space().classList.contains("semi-space-vertical") &&
        !space().classList.contains("semi-space-wrap") &&
        space().classList.contains("semi-space-align-baseline") &&
        space().style.columnGap === "12px" &&
        space().classList.contains("semi-space-medium-vertical"),
      "Packed Space vertical, alignment or axis spacing failed",
    );
    assert(
      space().querySelector('[data-action="first"]')?.textContent ===
        "updated" &&
        space().querySelector('[data-action="second"]') === second &&
        document.activeElement === second,
      "Space update replaced retained slot state or focus",
    );
    visible.value = false;
    vertical.value = undefined;
    wrap.value = true;
    align.value = undefined;
    spacing.value = 0;
    direction.value = "ltr";
    await flush();
    assert(
      space().classList.contains("semi-space-horizontal") &&
        space().classList.contains("semi-space-wrap") &&
        space().classList.contains("semi-space-align-center") &&
        space().style.columnGap === "0px" &&
        space().style.rowGap === "0px" &&
        space().querySelectorAll(":scope > button").length === 1 &&
        getComputedStyle(space()).direction === "ltr",
      "Space dynamic removal, wrap, zero spacing or RTL update failed",
    );
    mounted.value = false;
    await flush();
    assert(
      !host.querySelector(".packed-space"),
      "Conditional Space did not unmount",
    );
    mounted.value = true;
    await flush();
    assert(
      space().querySelectorAll(":scope > button").length === 1,
      "Space remount failed",
    );
    app.unmount();
    active = false;
    assert(!host.textContent, "Space consumer teardown left DOM");
    return "space consumer passed";
  } finally {
    if (active) app.unmount();
    host.remove();
  }
}
