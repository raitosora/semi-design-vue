import { expect, test } from "vitest";
import { nextTick } from "vue";
import Basic from "../../website/examples/timeline/Basic.vapor";
import Layout from "../../website/examples/timeline/Layout.vapor";
import Dynamic from "../../website/examples/timeline/Dynamic.vapor";
import Theme from "../../website/examples/timeline/Theme.vapor";
import { mountVapor } from "../support/mount-vapor";
async function click(host: HTMLElement, name: string) {
  const button = [...host.querySelectorAll("button")].find(
    (node) => node.textContent === name,
  );
  expect(button).toBeTruthy();
  button!.click();
  await nextTick();
}
test("Timeline Basic demonstrates data priority and native events", async () => {
  const app = mountVapor(Basic);
  try {
    expect(
      app.host.querySelectorAll("[data-basic-timeline] > li"),
    ).toHaveLength(4);
    await click(app.host, "查看详情");
    expect(app.host.querySelector("[data-actions]")?.textContent).toBe("1");
    expect(app.host.querySelector("[data-bubbles]")?.textContent).toBe("1");
    await click(app.host, "清空数据");
    expect(
      app.host.querySelectorAll("[data-basic-timeline] > li"),
    ).toHaveLength(1);
    expect(app.host.textContent).toContain("声明式节点");
  } finally {
    app.unmount();
  }
  expect(app.host.childNodes).toHaveLength(0);
});
test("Timeline Layout updates modes dots and fields", async () => {
  const app = mountVapor(Layout);
  try {
    for (const mode of ["right", "center", "alternate"]) {
      await click(app.host, "切换排列");
      expect(
        app.host
          .querySelector("[data-layout-timeline]")
          ?.classList.contains(`semi-timeline-${mode}`),
      ).toBe(true);
    }
    await click(app.host, "切换自定义圆点");
    expect(
      app.host.querySelectorAll(".semi-timeline-item-head-custom svg"),
    ).toHaveLength(2);
    await click(app.host, "更新节点字段");
    expect(app.host.textContent).toContain("更新后的辅助信息");
  } finally {
    app.unmount();
  }
});
test("Timeline Dynamic preserves keyed input identity and slot presence", async () => {
  const app = mountVapor(Dynamic);
  try {
    await nextTick();
    const first = app.host.querySelector<HTMLInputElement>(
      'input[aria-label="节点甲"]',
    )!;
    first.value = "保留";
    first.focus();
    await click(app.host, "更新上下文");
    expect(document.activeElement).toBe(first);
    await click(app.host, "反转节点");
    expect(app.host.querySelector('input[aria-label="节点甲"]')).toBe(first);
    expect(first.value).toBe("保留");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("3");
    await click(app.host, "切换时间内容");
    expect(
      app.host.querySelector(
        "[data-slot-timeline] .semi-timeline-item-content-time",
      )?.textContent,
    ).toBe("");
    await click(app.host, "切换时间插槽");
    expect(
      app.host.querySelector(
        "[data-slot-timeline] .semi-timeline-item-content-time",
      )?.textContent,
    ).toBe("属性时间");
    await click(app.host, "卸载时间轴");
    expect(app.host.querySelector("[data-unmounts]")?.textContent).toBe("3");
    await click(app.host, "重挂时间轴");
    expect(app.host.querySelector("[data-mounts]")?.textContent).toBe("6");
  } finally {
    app.unmount();
  }
});
test("Timeline Theme composes existing components and restores local context", async () => {
  const previousDir = document.body.getAttribute("dir"),
    app = mountVapor(Theme);
  try {
    expect(app.host.querySelectorAll(".semi-tag")).toHaveLength(2);
    await click(app.host, "切换深色");
    expect(app.host.querySelector(".semi-always-dark")).not.toBeNull();
    await click(app.host, "切换 RTL");
    expect(
      app.host.querySelector(".semi-rtl [data-themed-timeline]"),
    ).not.toBeNull();
    await click(app.host, "卸载主题示例");
    expect(app.host.querySelector("[data-themed-timeline]")).toBeNull();
  } finally {
    app.unmount();
  }
  expect(document.body.getAttribute("dir")).toBe(previousDir);
  expect(app.host.childNodes).toHaveLength(0);
});
