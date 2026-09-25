import { createVaporApp, nextTick, ref } from "vue";
import { Row, Col } from "semi-ui-vue";
import { Row as SubpathRow, Col as SubpathCol } from "semi-ui-vue/grid";
import "semi-ui-vue/styles/components/grid.css";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

export async function checkGridConsumer() {
  assert(
    Row === SubpathRow && Col === SubpathCol,
    "Grid entry identities differ",
  );
  assert(
    !Object.hasOwn(Row, "Col") && !Object.hasOwn(Col, "Row"),
    "Grid invented static API",
  );
  const host = document.createElement("div");
  document.body.append(host);
  const span = ref(12);
  const gutter = ref(16);
  const visible = ref(true);
  const mounted = ref(true);
  const app = createVaporApp(() => (
    <>
      {mounted.value && (
        <Row
          className="packed-grid-row"
          gutter={gutter.value}
          style={{ width: "240px" }}
          type="flex"
          v-slots={{
            default: () => (
              <>
                <Col
                  className="packed-grid-col"
                  sm={6}
                  span={span.value}
                  v-slots={{
                    default: () => <button data-grid-button>Grid</button>,
                  }}
                />
                {visible.value && (
                  <Col
                    className="packed-grid-other"
                    span={12}
                    v-slots={{ default: () => <span>Other</span> }}
                  />
                )}
              </>
            ),
          }}
        />
      )}
    </>
  ));
  let active = false;
  try {
    app.mount(host);
    active = true;
    await nextTick();
    const row = () => host.querySelector<HTMLElement>(".packed-grid-row")!;
    const col = () => host.querySelector<HTMLElement>(".packed-grid-col")!;
    assert(
      row().classList.contains("semi-row-flex") &&
        col().classList.contains("semi-col-12"),
      "Packed Grid classes failed",
    );
    assert(
      row().style.marginLeft === "-8px" && col().style.paddingLeft === "8px",
      "Packed Grid gutter failed",
    );
    assert(
      Math.round(col().getBoundingClientRect().width) ===
        (matchMedia("(min-width: 576px)").matches ? 60 : 120),
      "Packed Grid breakpoint width failed",
    );
    const button = col().querySelector<HTMLButtonElement>("button")!;
    button.focus();
    span.value = 8;
    gutter.value = 0;
    visible.value = false;
    await nextTick();
    assert(
      col().classList.contains("semi-col-8") &&
        !col().classList.contains("semi-col-12") &&
        row().style.marginLeft === "" &&
        col().style.paddingLeft === "",
      "Packed Grid dynamic props failed",
    );
    assert(
      col().querySelector("button") === button &&
        document.activeElement === button &&
        !host.querySelector(".packed-grid-other"),
      "Packed Grid slot state or conditional content failed",
    );
    mounted.value = false;
    await nextTick();
    assert(
      !host.querySelector(".packed-grid-row"),
      "Packed Grid conditional unmount failed",
    );
    mounted.value = true;
    await nextTick();
    assert(!!col(), "Packed Grid remount failed");
    app.unmount();
    active = false;
    assert(!host.textContent, "Packed Grid teardown left DOM");
    return "grid consumer passed";
  } finally {
    if (active) app.unmount();
    host.remove();
  }
}
