import { expect, test } from "vitest";
import { nextTick } from "vue";
import Basic from "../../website/examples/steps/Basic.vapor";
import Variants from "../../website/examples/steps/Variants.vapor";
import Dynamic from "../../website/examples/steps/Dynamic.vapor";
import Theme from "../../website/examples/steps/Theme.vapor";
import { mountVapor } from "../support/mount-vapor";
async function click(host: HTMLElement, name: string) {
  const button = [...host.querySelectorAll("button")].find(
    (node) => node.textContent === name,
  );
  expect(button).toBeTruthy();
  button!.click();
  await nextTick();
}
test("Steps Basic demonstrates controlled callbacks native events and initial arithmetic", async () => {
  const app = mountVapor(Basic);
  try {
    await nextTick();
    const root = app.host.querySelector("[data-basic-steps]")!;
    const items = root.querySelectorAll<HTMLElement>(".semi-steps-item");
    expect(items).toHaveLength(3);
    expect(root.getAttribute("aria-label")).toBe("办理进度");
    expect(items[1]!.classList).toContain("semi-steps-item-process");
    items[0]!.click();
    await nextTick();
    expect(app.host.querySelector("[data-events]")?.textContent).toBe(
      "click:0,change:0,bubble",
    );
    expect(items[0]!.classList).toContain("semi-steps-item-process");
    await click(app.host, "清空事件");
    items[1]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    await nextTick();
    expect(app.host.querySelector("[data-events]")?.textContent).toBe(
      "key:1,change:1,key-bubble",
    );
    expect(root.querySelector("b")).toBeNull();
    expect(root.textContent).toContain("<b>审核</b>");
    const offset = app.host.querySelector("[data-offset-steps]")!;
    expect(offset.querySelectorAll(".semi-steps-item")[1]!.classList).toContain(
      "semi-steps-item-process",
    );
    (offset.querySelectorAll(".semi-steps-item")[1] as HTMLElement).click();
    await nextTick();
    expect(app.host.querySelector("[data-offset-result]")?.textContent).toBe(
      "6",
    );
  } finally {
    app.unmount();
  }
  expect(app.host.childNodes).toHaveLength(0);
});
test("Steps Variants demonstrates actual sizes statuses directions and nav interaction", async () => {
  const app = mountVapor(Variants);
  try {
    await nextTick();
    const basic = app.host.querySelector("[data-variant-basic]")!;
    expect(basic.classList).toContain("semi-steps-small");
    expect(basic.querySelector(".semi-icon-alert_triangle")).not.toBeNull();
    expect(basic.querySelector(".semi-icon-home")).not.toBeNull();
    expect(basic.querySelector(".semi-steps-next-error")).not.toBeNull();
    expect(basic.querySelector(".explicit-class")).toBeNull();
    await click(app.host, "切换连线");
    expect(basic.classList).not.toContain("semi-steps-hasline");
    await click(app.host, "切换尺寸");
    expect(basic.classList).not.toContain("semi-steps-small");
    const fill = app.host.querySelector("[data-variant-fill]")!;
    expect(fill.classList).toContain("semi-steps-vertical");
    await click(app.host, "切换方向");
    expect(fill.classList).toContain("semi-steps-horizontal");
    const nav = app.host.querySelector("[data-variant-nav]")!;
    expect(nav.querySelectorAll(".semi-icon-chevron_right")).toHaveLength(2);
    expect(nav.textContent).not.toContain("不显示的描述");
    (nav.querySelectorAll(".semi-steps-item")[2] as HTMLElement).click();
    await nextTick();
    expect(app.host.querySelector("[data-nav-result]")?.textContent).toBe("2");
  } finally {
    app.unmount();
  }
});
test("Steps Dynamic preserves native keyed content context and slot declaration", async () => {
  const app = mountVapor(Dynamic);
  try {
    await nextTick();
    const first = app.host.querySelector<HTMLInputElement>(
      'input[aria-label="步骤甲"]',
    )!;
    first.value = "保留";
    first.focus();
    await click(app.host, "更新上下文");
    expect(document.activeElement).toBe(first);
    expect(app.host.querySelector("[data-inherited]")?.textContent).toBe(
      "上下文 2",
    );
    await click(app.host, "反转步骤");
    expect(app.host.querySelector('input[aria-label="步骤甲"]')).toBe(first);
    expect(first.value).toBe("保留");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("3");
    await click(app.host, "切换标题内容");
    expect(
      app.host.querySelector("[data-slot-steps] .semi-steps-item-title-text")
        ?.textContent,
    ).toBe("");
    await click(app.host, "切换标题插槽");
    expect(
      app.host.querySelector("[data-slot-steps] .semi-steps-item-title-text")
        ?.textContent,
    ).toBe("属性标题");
    await click(app.host, "卸载步骤");
    expect(app.host.querySelector("[data-unmounts]")?.textContent).toBe("3");
    await click(app.host, "重挂步骤");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("6");
  } finally {
    app.unmount();
  }
});
test("Steps Theme combines local direction theme width and layout without body mutation", async () => {
  const previous = document.body.getAttribute("dir");
  const app = mountVapor(Theme);
  try {
    await nextTick();
    expect(app.host.querySelector(".semi-icon-home")).not.toBeNull();
    await click(app.host, "切换深色");
    expect(app.host.querySelector(".semi-always-dark")).not.toBeNull();
    await click(app.host, "切换 RTL");
    expect(
      app.host.querySelector(".semi-rtl [data-themed-steps]"),
    ).not.toBeNull();
    await click(app.host, "切换宽度");
    expect(
      (app.host.querySelector("[data-width-container]") as HTMLElement).style
        .width,
    ).toBe("240px");
    await click(app.host, "切换纵向");
    expect(app.host.querySelector("[data-themed-steps]")?.classList).toContain(
      "semi-steps-vertical",
    );
    await click(app.host, "卸载主题示例");
    expect(app.host.querySelector("[data-themed-steps]")).toBeNull();
  } finally {
    app.unmount();
  }
  expect(document.body.getAttribute("dir")).toBe(previous);
  expect(app.host.childNodes).toHaveLength(0);
});
