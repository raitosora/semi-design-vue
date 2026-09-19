import { expect, test } from "vitest";
import { nextTick } from "vue";
import ContextDemo from "../../website/examples/context/Context.vapor";
import { mountVapor } from "../support/mount-vapor";

test("context example keeps nested overrides local and resets on remount", async () => {
  const first = mountVapor(ContextDemo);
  const second = mountVapor(ContextDemo);
  const text = (host: HTMLElement, key: string) =>
    host.querySelector(`[data-context-${key}]`)?.textContent;
  const click = async (name: string) => {
    const button = [...first.host.querySelectorAll("button")].find(
      (node) => node.textContent === name,
    );
    expect(button).toBeTruthy();
    button!.click();
    await nextTick();
  };
  try {
    expect(text(first.host, "outer")).toBe("zh-CN|ltr|8");
    expect(text(first.host, "inner")).toBe("zh-CN|rtl|8");
    await click("切换语言与时区");
    expect(text(first.host, "outer")).toBe("en-US|ltr|0");
    expect(text(first.host, "inner")).toBe("en-US|rtl|0");
    expect(text(second.host, "outer")).toBe("zh-CN|ltr|8");
    await click("移除内层覆盖");
    expect(text(first.host, "inner")).toBe("en-US|ltr|0");
    await click("显式清空方向");
    expect(text(first.host, "inner")).toBe("en-US|undefined|0");
    await click("恢复内层 RTL");
    expect(text(first.host, "inner")).toBe("en-US|rtl|0");
    await click("读取静态上下文");
    expect(text(first.host, "static")).toBe("en-US|ltr|0");
  } finally {
    first.unmount();
    second.unmount();
  }
  const third = mountVapor(ContextDemo);
  try {
    expect(text(third.host, "outer")).toBe("zh-CN|ltr|8");
  } finally {
    third.unmount();
  }
});
