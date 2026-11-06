import { defineVaporComponent, nextTick, ref } from "vue";
import { expect, test } from "vitest";
import Icon from "../../packages/semi-icons-vue/src/components/Icon.js";
import { mountVapor } from "../support/mount-vapor.js";

test("Icon preserves its native identity marker across prefix changes and caller attrs", async () => {
  const prefix = ref("custom");
  const label = ref<string | undefined>("Search");
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <Icon
        aria-label={label.value}
        data-semi-icon={null}
        prefixCls={prefix.value}
        spin
        type="search"
      >
        {() => <svg />}
      </Icon>
    )),
  );
  try {
    const span = mounted.host.querySelector("span")!;
    expect(span.getAttribute("data-semi-icon")).toBe("");
    expect(span.classList.contains("custom-icon")).toBe(true);
    expect(span.getAttribute("role")).toBe("img");
    expect(span.getAttribute("aria-hidden")).toBeNull();
    prefix.value = "semi";
    label.value = undefined;
    await nextTick();
    expect(mounted.host.querySelector("span")).toBe(span);
    expect(span.getAttribute("data-semi-icon")).toBe("");
    expect(span.classList.contains("semi-icon-spinning")).toBe(true);
    expect(span.getAttribute("aria-hidden")).toBe("true");
  } finally {
    mounted.unmount();
  }
});
