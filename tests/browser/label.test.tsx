import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test } from "vitest";
import Label from "../../packages/semi-ui-vue/src/internal/label/Label.js";
import type { LabelProps } from "../../packages/semi-ui-vue/src/internal/label/types.js";
import LocaleProvider from "../../packages/semi-ui-vue/src/components/locale/LocaleProvider.js";
import enUS from "../../packages/semi-ui-vue/src/locale/source/en_US.js";
import { mountVapor } from "../support/mount-vapor.js";

test("internal Label keeps exact text priority, native association and immutable styles", async () => {
  const style = Object.freeze({ color: "red", width: "30px" });
  const props = shallowRef<LabelProps>({
    text: "<script>escaped</script>",
    name: "field",
    id: "label-id",
    required: true,
    optional: true,
    disabled: true,
    width: 80,
    style,
    extra: "hint",
    align: "right",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        <Label {...props.value}>{() => <span>fallback</span>}</Label>
        <input id="field" />
      </>
    )),
  );
  try {
    await nextTick();
    const label = fixture.host.querySelector("label")!;
    expect(label.htmlFor).toBe("field");
    expect(label.control).toBe(fixture.host.querySelector("input"));
    label.click();
    expect(document.activeElement).toBe(fixture.host.querySelector("input"));
    expect(label.querySelector("script")).toBeNull();
    expect(label.textContent).toContain("<script>escaped</script>");
    expect(label.textContent).not.toContain("fallback");
    expect(label.style.width).toBe("80px");
    expect(style.width).toBe("30px");
    for (const part of ["required", "disabled", "right", "with-extra"])
      expect(label.classList.contains(`semi-form-field-label-${part}`)).toBe(
        true,
      );
    expect(
      label.querySelector(".semi-form-field-label-optional-text")?.textContent,
    ).toBe("（可选）");
    props.value = { text: null, children: "children", width: 0, style };
    await nextTick();
    expect(label.textContent).toBe("");
    expect(label.style.width).toBe("30px");
    props.value = { text: undefined, children: "children" };
    await nextTick();
    expect(label.textContent).toBe("fallback");
    props.value = { text: 0, extra: 0 };
    await nextTick();
    expect(label.textContent).toBe("0");
    expect(label.querySelector(".semi-form-field-label-extra")).toBeNull();
  } finally {
    fixture.unmount();
  }
});

test("internal Label optional text follows locale and extra remains native content", async () => {
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <LocaleProvider locale={enUS}>
        {() => (
          <Label
            extra={() => <button>details</button>}
            optional={true}
            text="Name"
          />
        )}
      </LocaleProvider>
    )),
  );
  try {
    await nextTick();
    expect(
      fixture.host.querySelector(".semi-form-field-label-optional-text")
        ?.textContent,
    ).toBe("(optional)");
    expect(fixture.host.querySelector("button")?.textContent).toBe("details");
  } finally {
    fixture.unmount();
  }
});

test("internal Label children fallback, string width and empty align preserve source semantics", async () => {
  const props = shallowRef<LabelProps>({
    children: "children",
    width: "50%",
    align: "",
    extra: "",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Label {...props.value} />),
  );
  try {
    await nextTick();
    const label = fixture.host.querySelector("label")!;
    expect(label.textContent).toBe("children");
    expect(label.style.width).toBe("50%");
    expect(label.classList.contains("semi-form-field-label-left")).toBe(false);
    props.value = { children: false, align: undefined };
    await nextTick();
    expect(label.textContent).toBe("");
    expect(label.classList.contains("semi-form-field-label-left")).toBe(true);
  } finally {
    fixture.unmount();
  }
});

test("internal Label optional updates from the live locale context without remounting", async () => {
  const locale = shallowRef(enUS);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <LocaleProvider locale={locale.value}>
        {() => <Label optional={true} text="Name" />}
      </LocaleProvider>
    )),
  );
  try {
    await nextTick();
    const label = fixture.host.querySelector("label")!;
    expect(label.textContent).toBe("Name(optional)");
    locale.value = {
      ...enUS,
      Form: { ...enUS.Form, optional: "custom optional" },
    };
    await nextTick();
    expect(fixture.host.querySelector("label")).toBe(label);
    expect(label.textContent).toBe("Namecustom optional");
  } finally {
    fixture.unmount();
  }
});
