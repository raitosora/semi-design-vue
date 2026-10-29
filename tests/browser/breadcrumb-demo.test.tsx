import { expect, test } from "vitest";
import { nextTick } from "vue";
import Basic from "../../website/examples/breadcrumb/Basic.vapor";
import Collapse from "../../website/examples/breadcrumb/Collapse.vapor";
import Dynamic from "../../website/examples/breadcrumb/Dynamic.vapor";
import Theme from "../../website/examples/breadcrumb/Theme.vapor";
import { mountVapor } from "../support/mount-vapor";
async function click(host: HTMLElement, name: string) {
  const button = [...host.querySelectorAll("button")].find(
    (node) => node.textContent === name,
  );
  expect(button).toBeTruthy();
  button!.click();
  await nextTick();
}
test("Breadcrumb Basic demonstrates routes priority current page and native events", async () => {
  const app = mountVapor(Basic);
  try {
    await nextTick();
    const root = app.host.querySelector("[data-basic-breadcrumb]")!;
    expect(root.tagName).toBe("NAV");
    expect(app.host.querySelectorAll("[data-rendered-route]")).toHaveLength(2);
    expect(root.textContent).not.toContain("声明式路径");
    expect(root.querySelector("[aria-current=page]")?.textContent).toBe("详情");
    (root.querySelector(".semi-breadcrumb-item") as HTMLElement).click();
    await nextTick();
    expect(app.host.querySelector("[data-events]")?.textContent).toBe(
      "item,parent,bubble",
    );
    await click(app.host, "清空路由");
    expect(root.textContent).toContain("声明式路径");
    await click(app.host, "恢复路由");
    await click(app.host, "切换当前项");
    expect(root.querySelector("[aria-current=page]")?.textContent).toContain(
      "首页",
    );
    await click(app.host, "切换分隔符");
    expect(root.querySelector(".semi-breadcrumb-separator")?.textContent).toBe(
      ">",
    );
    await click(app.host, "切换尺寸");
    expect(root.classList).toContain("semi-breadcrumb-wrapper-loose");
  } finally {
    app.unmount();
  }
  expect(app.host.childNodes).toHaveLength(0);
});
test("Breadcrumb Collapse demonstrates count threshold permanent expansion and custom more", async () => {
  const app = mountVapor(Collapse);
  try {
    await nextTick();
    const root = app.host.querySelector("[data-collapse-breadcrumb]")!;
    expect(root.querySelectorAll(".semi-breadcrumb-collapse")).toHaveLength(1);
    expect(app.host.querySelector("[data-custom-more]")?.textContent).toBe(
      "3 个层级",
    );
    (root.querySelector("[role=button]") as HTMLElement).click();
    await nextTick();
    expect(root.querySelector(".semi-breadcrumb-collapse")).toBeNull();
    expect(root.textContent).toContain("二级");
    await click(app.host, "增加层级");
    expect(root.querySelector(".semi-breadcrumb-collapse")).toBeNull();
    await click(app.host, "重新挂载");
    expect(
      app.host.querySelector(
        "[data-collapse-breadcrumb] .semi-breadcrumb-collapse",
      ),
    ).not.toBeNull();
  } finally {
    app.unmount();
  }
});
test("Breadcrumb Dynamic preserves keyed native content and slot declaration", async () => {
  const app = mountVapor(Dynamic);
  try {
    await nextTick();
    const first = app.host.querySelector<HTMLInputElement>(
      'input[aria-label="路径甲"]',
    )!;
    first.value = "保留";
    first.focus();
    await click(app.host, "更新上下文");
    expect(document.activeElement).toBe(first);
    expect(app.host.querySelector("[data-inherited]")?.textContent).toBe(
      "上下文 2",
    );
    await click(app.host, "反转路径");
    expect(app.host.querySelector('input[aria-label="路径甲"]')).toBe(first);
    expect(first.value).toBe("保留");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("3");
    await click(app.host, "切换正文内容");
    expect(app.host.querySelector("[data-slot-breadcrumb]")?.textContent).toBe(
      "",
    );
    await click(app.host, "切换正文插槽");
    expect(app.host.querySelector("[data-slot-breadcrumb]")?.textContent).toBe(
      "属性路径",
    );
    await click(app.host, "卸载路径");
    expect(app.host.querySelector("[data-unmounts]")?.textContent).toBe("3");
    await click(app.host, "重挂路径");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("6");
  } finally {
    app.unmount();
  }
});
test("Breadcrumb Theme combines truncation native icons and local direction cleanup", async () => {
  const previous = document.body.getAttribute("dir");
  const app = mountVapor(Theme);
  try {
    await nextTick();
    expect(app.host.querySelectorAll(".semi-tag")).toHaveLength(1);
    expect(
      app.host.querySelector("[data-themed-breadcrumb] .semi-icon-home > svg"),
    ).not.toBeNull();
    expect(app.host.querySelector(".semi-breadcrumb-item-icon")?.tagName).toBe(
      "SPAN",
    );
    await click(app.host, "切换深色");
    expect(app.host.querySelector(".semi-always-dark")).not.toBeNull();
    await click(app.host, "切换 RTL");
    expect(
      app.host.querySelector(".semi-rtl [data-themed-breadcrumb]"),
    ).not.toBeNull();
    await click(app.host, "切换宽度");
    expect(
      (app.host.querySelector("[data-width-container]") as HTMLElement).style
        .width,
    ).toBe("240px");
    await click(app.host, "卸载主题示例");
    expect(app.host.querySelector("[data-themed-breadcrumb]")).toBeNull();
  } finally {
    app.unmount();
  }
  expect(document.body.getAttribute("dir")).toBe(previous);
  expect(app.host.childNodes).toHaveLength(0);
});
