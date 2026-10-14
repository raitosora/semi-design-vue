import { expect, test } from "vitest";
import { nextTick } from "vue";
import Basic from "../../website/examples/descriptions/Basic.vapor";
import Dynamic from "../../website/examples/descriptions/Dynamic.vapor";
import Layout from "../../website/examples/descriptions/Layout.vapor";
import Theme from "../../website/examples/descriptions/Theme.vapor";
import { mountVapor } from "../support/mount-vapor";

async function click(host: HTMLElement, name: string) {
  const button = [...host.querySelectorAll("button")].find(
    (node) => node.textContent === name,
  );
  expect(button).toBeTruthy();
  button!.click();
  await nextTick();
}

test("Descriptions Basic demonstrates data priority and native bubbling", async () => {
  const app = mountVapor(Basic);
  try {
    expect(
      app.host.querySelectorAll("[data-basic-descriptions] tr"),
    ).toHaveLength(5);
    expect(app.host.textContent).not.toContain("空数据时显示此内容");
    await click(app.host, "查看详情");
    expect(app.host.querySelector("[data-actions]")?.textContent).toBe("1");
    expect(app.host.querySelector("[data-bubbles]")?.textContent).toBe("1");
    await click(app.host, "清空数据");
    expect(
      app.host.querySelectorAll("[data-basic-descriptions] tr"),
    ).toHaveLength(1);
    expect(app.host.textContent).toContain("空数据时显示此内容");
    await click(app.host, "恢复数据");
    expect(
      app.host.querySelectorAll("[data-basic-descriptions] tr"),
    ).toHaveLength(5);
  } finally {
    app.unmount();
  }
  expect(app.host.textContent).toBe("");
});

test("Descriptions layout example updates horizontal grouping and hidden data", async () => {
  const app = mountVapor(Layout);
  try {
    const rows = () =>
      app.host.querySelectorAll("[data-layout-descriptions] tbody > tr");
    expect(rows()).toHaveLength(4);
    expect(app.host.querySelector("[data-layout-status]")?.textContent).toBe(
      "align=center / layout=vertical / column=3 / size=medium",
    );
    await click(app.host, "切换横向布局");
    expect(rows()).toHaveLength(2);
    await click(app.host, "切换列数");
    expect(rows()).toHaveLength(3);
    expect(app.host.querySelector("[data-layout-status]")?.textContent).toBe(
      "align=center / layout=horizontal / column=2 / size=medium",
    );
    await click(app.host, "切换隐藏字段");
    expect(rows()).toHaveLength(2);
    expect(
      app.host.querySelector("[data-layout-descriptions]")?.textContent,
    ).not.toContain("SemiDesign");
  } finally {
    app.unmount();
  }
});

test("Descriptions dynamic example keeps instances across data and context changes", async () => {
  const app = mountVapor(Dynamic);
  try {
    await nextTick();
    const first = app.host.querySelector<HTMLInputElement>(
      'input[aria-label="字段甲"]',
    )!;
    first.value = "保留";
    first.focus();
    await click(app.host, "更新上下文");
    expect(document.activeElement).toBe(first);
    expect(app.host.querySelector("[data-inherited]")?.textContent).toBe(
      "上下文 2",
    );
    await click(app.host, "反转字段");
    expect(app.host.querySelector('input[aria-label="字段甲"]')).toBe(first);
    expect(first.value).toBe("保留");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("3");
    await click(app.host, "切换字段名内容");
    expect(
      app.host.querySelector("[data-slot-descriptions] .semi-descriptions-key")
        ?.textContent,
    ).toBe("");
    await click(app.host, "切换字段名插槽");
    expect(
      app.host.querySelector("[data-slot-descriptions] .semi-descriptions-key")
        ?.textContent,
    ).toBe("属性字段名");
    await click(app.host, "卸载描述列表");
    expect(app.host.querySelector("[data-unmounts]")?.textContent).toBe("3");
    await click(app.host, "重挂描述列表");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("6");
    expect(app.host.querySelector('input[aria-label="字段甲"]')).not.toBe(
      first,
    );
  } finally {
    app.unmount();
  }
});

test("Descriptions horizontal example keeps native keyed content through span and column changes", async () => {
  const app = mountVapor(Dynamic);
  try {
    await click(app.host, "切换声明布局");
    const root = app.host.querySelector("[data-keyed-descriptions]")!;
    await expect.poll(() => root.querySelectorAll("tbody > tr").length).toBe(1);
    const first = root.querySelector<HTMLInputElement>(
      'input[aria-label="字段甲"]',
    )!;
    first.value = "横向保留";
    const mounts = app.host.querySelector("[data-mounts]")?.textContent;
    await click(app.host, "切换甲跨列");
    await expect.poll(() => root.querySelectorAll("tbody > tr").length).toBe(2);
    expect(root.querySelector('input[aria-label="字段甲"]')).toBe(first);
    await click(app.host, "切换声明列数");
    await click(app.host, "反转字段");
    await expect
      .poll(() =>
        [...root.querySelectorAll("th")].map((node) => node.textContent),
      )
      .toEqual(["丙", "乙", "甲"]);
    expect(root.querySelector('input[aria-label="字段甲"]')).toBe(first);
    expect(first.value).toBe("横向保留");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe(mounts);
  } finally {
    app.unmount();
  }
});

test("Descriptions Theme owns its ARIA scope without an application provider", async () => {
  const previousDir = document.body.getAttribute("dir");
  const app = mountVapor(Theme);
  try {
    expect(app.host.querySelector(".semi-card h6")?.textContent).toBe(
      "项目概览",
    );
    expect(
      app.host.querySelectorAll("[data-themed-descriptions] tbody > tr"),
    ).toHaveLength(3);
    expect(app.host.querySelector(".semi-always-light")).not.toBeNull();
    await click(app.host, "切换深色");
    expect(app.host.querySelector(".semi-always-dark")).not.toBeNull();
    await click(app.host, "切换 RTL");
    expect(
      app.host.querySelector(".semi-rtl [data-themed-descriptions]"),
    ).not.toBeNull();
    expect(document.body.getAttribute("dir")).toBe(previousDir);
    await click(app.host, "卸载主题示例");
    expect(app.host.querySelector(".semi-card")).toBeNull();
    await click(app.host, "重挂主题示例");
    expect(app.host.querySelector(".semi-card h6")?.textContent).toBe(
      "项目概览",
    );
    expect(
      app.host.querySelectorAll("[data-themed-descriptions] tbody > tr"),
    ).toHaveLength(3);
  } finally {
    app.unmount();
  }
  expect(app.host.childNodes).toHaveLength(0);
  expect(document.body.getAttribute("dir")).toBe(previousDir);
});
