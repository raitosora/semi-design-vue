import { expect, test } from "vitest";
import { page } from "vitest/browser";
import Theme from "../../website/examples/theme/Theme.vapor";
import "../../packages/semi-ui-vue/dist/styles/index.css";
import "../../website/examples/theme/demo.css";
import { mountVapor } from "../support/mount-vapor";

test("theme fixture switches real tokens and RTL without changing the document", async () => {
  const initialTheme = document.body.getAttribute("theme-mode");
  const fixture = mountVapor(Theme);
  try {
    const panel = fixture.host.querySelector<HTMLElement>("[data-theme-demo]")!;
    const input = fixture.host.querySelector<HTMLInputElement>("input")!;
    const light = getComputedStyle(panel).backgroundColor;
    expect(light).toBe("rgb(255, 255, 255)");
    await page.getByRole("button", { name: "切换深色" }).click();
    expect(getComputedStyle(panel).backgroundColor).not.toBe(light);
    await page.getByRole("button", { name: "切换 RTL" }).click();
    expect(getComputedStyle(input).direction).toBe("rtl");
    await page.getByRole("button", { name: "启用紫色主题" }).click();
    expect(
      getComputedStyle(panel).getPropertyValue("--semi-color-primary").trim(),
    ).toBe("#7c3aed");
    await page
      .getByRole("textbox", { name: "主题输入样式夹具" })
      .fill("Vapor theme");
    await expect
      .element(page.getByText("Vapor theme", { exact: true }))
      .toBeVisible();
    expect(document.body.getAttribute("theme-mode")).toBe(initialTheme);
    await page.getByRole("button", { name: "切换浅色" }).click();
    await page.getByRole("button", { name: "切换 LTR" }).click();
    await page.getByRole("button", { name: "恢复默认主题" }).click();
    expect(getComputedStyle(panel).backgroundColor).toBe(light);
    expect(getComputedStyle(input).direction).toBe("ltr");
    expect(
      getComputedStyle(panel).getPropertyValue("--semi-color-primary").trim(),
    ).not.toBe("#7c3aed");
  } finally {
    fixture.unmount();
  }
  expect(document.body.getAttribute("theme-mode")).toBe(initialTheme);
});
