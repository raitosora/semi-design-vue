import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import Title from "../../packages/semi-ui-vue/src/components/typography/title.js";
import Paragraph from "../../packages/semi-ui-vue/src/components/typography/paragraph.js";
import { mountVapor } from "../support/mount-vapor.js";
test("Typography semantic roots, decoration nesting and dynamic defaults", async () => {
  const disabled = shallowRef(false);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Title children="Heading" heading={3} />
        <Paragraph children="Paragraph" />
        <Text
          children="<safe>"
          code
          delete
          disabled={disabled.value}
          link={{ href: "#target" }}
          mark
          strong
          underline
        />
      </>
    )),
  );
  try {
    expect(fixture.host.querySelector("h3")?.textContent).toBe("Heading");
    expect(fixture.host.querySelector("p")?.className).toContain(
      "semi-typography-paragraph",
    );
    expect(
      fixture.host.querySelector("a > del > strong > code > mark")?.textContent,
    ).toBe("<safe>");
    expect(fixture.host.querySelector("safe")).toBeNull();
    disabled.value = true;
    await nextTick();
    expect(fixture.host.querySelector("a")).toBeNull();
  } finally {
    fixture.unmount();
  }
});
