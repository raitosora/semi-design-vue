import { createVaporApp, nextTick, ref } from "vue";
import { ConfigProvider, Divider } from "semi-ui-vue";
import DividerFromSubpath, {
  Divider as NamedDivider,
} from "semi-ui-vue/divider";
import "semi-ui-vue/styles/components/divider.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

export async function checkDividerConsumer() {
  assert(
    Divider === DividerFromSubpath && Divider === NamedDivider,
    "Divider entry identities differ",
  );
  assert(
    !Object.hasOwn(Divider, "elementType") &&
      !Object.hasOwn(Divider, "defaultProps"),
    "Divider invented upstream static members",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const label = ref<string | number>("Section");
  const visible = ref(true);
  const mounted = ref(true);
  const layout = ref<"horizontal" | "vertical" | undefined>(undefined);
  const align = ref<"left" | "right" | "center" | undefined>(undefined);
  const margin = ref<string | number | undefined>(undefined);
  const dashed = ref<boolean | undefined>(undefined);
  const direction = ref<"ltr" | "rtl">("rtl");
  const app = createVaporApp(() => (
    <ConfigProvider
      direction={direction.value}
      v-slots={{
        default: () => (
          <>
            {mounted.value && (
              <Divider
                align={align.value}
                aria-label="Packed section"
                class="packed-native-divider"
                className="packed-divider"
                dashed={dashed.value}
                layout={layout.value}
                margin={margin.value}
                role="separator"
                v-slots={{
                  default: () => <>{visible.value && <>{label.value}</>}</>,
                }}
              />
            )}
            <Divider className="packed-empty-divider" />
            <Divider
              className="packed-element-divider"
              v-slots={{
                default: () => (
                  <input aria-label="Retained divider child" value="retained" />
                ),
              }}
            />
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
    const divider = () => host.querySelector<HTMLElement>(".packed-divider")!;
    assert(
      divider().classList.contains("semi-divider-horizontal") &&
        divider().classList.contains("semi-divider-with-text-center"),
      "Divider undefined defaults drifted",
    );
    assert(
      divider().classList.contains("packed-native-divider") &&
        divider().getAttribute("role") === "separator" &&
        divider().getAttribute("aria-label") === "Packed section",
      "Divider native class/ARIA forwarding failed",
    );
    assert(
      getComputedStyle(divider()).direction === "rtl" &&
        !divider().hasAttribute("dir"),
      "Divider did not inherit ConfigProvider RTL through its DOM wrapper",
    );
    assert(
      divider().querySelector(".semi-divider_inner-text")?.textContent ===
        "Section",
      "Divider text slot was not classified",
    );
    assert(
      !host
        .querySelector(".packed-empty-divider")!
        .classList.contains("semi-divider-with-text"),
      "Empty Divider acquired text styling",
    );
    const input = host.querySelector<HTMLInputElement>("input")!;
    input.value = "edited";
    assert(
      getComputedStyle(input.parentElement!).display === "contents",
      "Element Divider content wrapper affects layout",
    );
    align.value = "left";
    margin.value = 12;
    dashed.value = true;
    label.value = 0;
    await flush();
    assert(
      divider().textContent === "0" &&
        divider().classList.contains("semi-divider-with-text-left") &&
        divider().classList.contains("semi-divider-dashed"),
      "Divider dynamic alignment/dashed/zero slot failed",
    );
    assert(
      divider().style.marginTop === "12px" &&
        divider().style.marginBottom === "12px",
      "Divider numeric horizontal margin failed",
    );
    visible.value = false;
    await flush();
    assert(
      !divider().classList.contains("semi-divider-with-text"),
      "Empty conditional slot retained text styling",
    );
    visible.value = true;
    layout.value = "vertical";
    margin.value = "2rem";
    await flush();
    assert(
      !divider().textContent &&
        !divider().classList.contains("semi-divider-with-text") &&
        divider().classList.contains("semi-divider-vertical"),
      "Vertical Divider rendered its slot",
    );
    assert(
      divider().style.marginLeft === "2rem" &&
        divider().style.marginRight === "2rem" &&
        getComputedStyle(divider()).borderLeftStyle === "dashed",
      "Vertical Divider margin/border failed",
    );
    layout.value = undefined;
    align.value = undefined;
    dashed.value = undefined;
    margin.value = undefined;
    direction.value = "ltr";
    await flush();
    assert(
      divider().textContent === "0" &&
        divider().classList.contains("semi-divider-with-text-center") &&
        !divider().classList.contains("semi-divider-dashed"),
      "Divider defaults did not restore after explicit undefined",
    );
    assert(
      getComputedStyle(divider()).direction === "ltr",
      "Divider did not inherit updated ConfigProvider direction",
    );
    assert(
      host.querySelector("input") === input && input.value === "edited",
      "Unrelated Divider updates replaced native child identity",
    );
    mounted.value = false;
    await flush();
    assert(
      !host.querySelector(".packed-divider"),
      "Conditional Divider did not unmount",
    );
    mounted.value = true;
    await flush();
    assert(
      divider().textContent === "0",
      "Divider remount lost native content",
    );
    app.unmount();
    active = false;
    assert(
      !host.textContent && !host.querySelector("input"),
      "Divider consumer teardown left DOM",
    );
    return "divider consumer passed";
  } finally {
    if (active) app.unmount();
    host.remove();
  }
}
