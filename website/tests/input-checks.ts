import {
  expect,
  test as base,
  type Page,
  type Locator,
} from "@playwright/test";
const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type()))
        errors.push(message.text());
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});
async function screenshot(area: Locator) {
  await area.evaluate((node) =>
    node.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  await expect
    .poll(() =>
      area.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const x = Math.max(1, Math.min(innerWidth - 1, box.x + box.width / 2));
        const y = Math.max(
          1,
          Math.min(innerHeight - 1, box.y + box.height / 2),
        );
        return node.contains(document.elementFromPoint(x, y));
      }),
    )
    .toBe(true);
  return area.screenshot();
}
export function inputChecks(mode: string, url: string) {
  test(`${mode}: Chromium IME protocol commits composition once`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const session = await page.context().newCDPSession(page);
    const area = page.locator("[data-input-composition]");
    try {
      for (const [label, prefix] of [
        ["组合输入", "input"],
        ["组合多行输入", "textarea"],
      ]) {
        await area.getByRole("button", { name: "清空组合事件" }).click();
        const field = area.getByRole("textbox", { name: label!, exact: true });
        await field.evaluate((node) => {
          const events: { type: string; trusted: boolean }[] = [];
          for (const type of ["compositionstart", "compositionend", "input"])
            node.addEventListener(type, (event) => {
              events.push({ type: event.type, trusted: event.isTrusted });
              node.setAttribute("data-ime-events", JSON.stringify(events));
            });
        });
        await field.focus();
        await session.send("Input.imeSetComposition", {
          text: "zhong",
          selectionStart: 5,
          selectionEnd: 5,
        });
        await expect(field).toHaveValue("zhong");
        await expect(
          area.locator("[data-composition-events]"),
        ).not.toContainText("change:");
        await session.send("Input.insertText", { text: "中文" });
        await expect(field).toHaveValue("中文");
        const events = (await area
          .locator("[data-composition-events]")
          .textContent())!.split(",");
        expect(
          events.filter((entry) => entry.startsWith(`${prefix}-change:`)),
        ).toEqual([`${prefix}-change:中文`]);
        expect(events.indexOf(`${prefix}-end`)).toBeLessThan(
          events.indexOf(`${prefix}-change:中文`),
        );
        const native = JSON.parse(
          (await field.getAttribute("data-ime-events"))!,
        ) as { type: string; trusted: boolean }[];
        expect(native.map((event) => event.type)).toContain("compositionend");
        expect(
          native.filter((event) => event.type === "compositionstart"),
        ).toEqual([{ type: "compositionstart", trusted: true }]);
        const inputEvents = native.filter((event) => event.type === "input");
        expect(inputEvents.length).toBeGreaterThan(0);
        expect(inputEvents.every((event) => event.trusted)).toBe(true);
      }
    } finally {
      await session.detach();
    }
  });
  test(`${mode}: Input native label controlled value and clear event order`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-input-basic]"),
      input = area.getByRole("textbox", { name: "用户名", exact: true });
    await expect(input).toHaveValue("初始内容");
    await area.locator("label[for=input-example-name]").click();
    await expect(input).toBeFocused();
    await area.getByRole("button", { name: "清空输入事件" }).click();
    await input.fill("新的内容");
    await expect(area.locator("[data-input-events]")).toHaveText(
      "input,update:新的内容,change:新的内容",
    );
    await expect(area.locator("[data-input-value]")).toHaveText("新的内容");
    await area
      .getByRole("button", { name: "清空输入事件" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await input
      .locator("..")
      .locator(".semi-input-clearbtn")
      .dispatchEvent("mousedown");
    await expect(input).toHaveValue("");
    await expect(area.locator("[data-input-events]")).toHaveText(
      "update:,change:,clear:mousedown",
    );
    await area.getByRole("button", { name: "程序化赋值" }).click();
    await expect(input).toHaveValue("程序更新");
    await area.getByRole("button", { name: "聚焦并选中" }).click();
    await expect(input).toBeFocused();
    expect(
      await input.evaluate((node: HTMLInputElement) => [
        node.selectionStart,
        node.selectionEnd,
      ]),
    ).toEqual([1, 3]);
    await expect(
      area.getByRole("textbox", { name: "错误状态" }),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(area.locator("img")).toHaveCount(0);
    await expect(area).toContainText("<b>文本</b>");
    await expect(
      area.getByRole("textbox", { name: "禁用内容" }),
    ).toBeDisabled();
    await expect(
      area.getByRole("textbox", { name: "只读内容" }),
    ).toHaveJSProperty("readOnly", true);
    const counted = area.getByRole("textbox", { name: "按码点计数" });
    await counted.fill("😀😀");
    await expect(counted).toHaveValue("😀😀");
    await expect(counted).not.toHaveAttribute("maxlength");
    const decorated = area
      .getByRole("textbox", { name: "图标前后缀" })
      .locator("..");
    await expect(decorated.locator(".semi-input-prefix")).toHaveClass(
      /semi-input-prefix-icon/,
    );
    await expect(decorated.locator(".semi-input-suffix")).toHaveClass(
      /semi-input-suffix-icon/,
    );
    await expect(decorated.locator(".semi-input-prepend")).toHaveClass(
      /semi-input-prepend-icon/,
    );
    await expect(decorated).toHaveClass(/semi-input-wrapper__with-suffix-icon/);
    for (const selector of [".semi-input-prefix", ".semi-input-suffix"]) {
      expect(
        await decorated.locator(selector).evaluate((node) => {
          const style = getComputedStyle(node);
          return [style.marginLeft, style.marginRight];
        }),
      ).toEqual(["8px", "8px"]);
    }
    expect(
      await decorated.locator(".semi-input-prepend").evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.paddingLeft, style.paddingRight];
      }),
    ).toEqual(["12px", "12px"]);
    await decorated.hover();
    await expect(decorated.locator(".semi-input-clearbtn")).toBeVisible();
    expect(
      await decorated.locator(".semi-input-clearbtn").evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.minWidth, style.justifyContent];
      }),
    ).toEqual(["24px", "flex-end"]);
    await info.attach("input-icon-adornments", {
      body: await screenshot(decorated),
      contentType: "image/png",
    });
    await info.attach("input-basic", {
      body: await screenshot(input.locator("..")),
      contentType: "image/png",
    });
    await info.attach("input-accessibility", {
      body: await input.ariaSnapshot(),
      contentType: "text/plain",
    });
  });
  test(`${mode}: Input password keyboard and native form default behavior`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-input-basic]"),
      password = area.locator('input[aria-label="密码"]');
    await expect(password).toHaveAttribute("type", "password");
    const show = area.getByRole("button", { name: "Show password" });
    await show.focus();
    await show.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toBeFocused();
    const hide = area.getByRole("button", { name: "Hidden password" });
    await hide.focus();
    await hide.press("Space");
    await expect(password).toHaveAttribute("type", "password");
    await area.getByRole("button", { name: "原生表单提交" }).click();
    await expect(area.locator("[data-input-submitted]")).toHaveText("0");
    const field = area.getByRole("textbox", { name: "原生提交字段" });
    await field.fill("query");
    await field.press("Enter");
    await expect(area.locator("[data-input-submitted]")).toHaveText("1");
  });
  test(`${mode}: Input and TextArea composition native sequence`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-input-composition]");
    for (const [label, prefix] of [
      ["组合输入", "input"],
      ["组合多行输入", "textarea"],
    ]) {
      await area.getByRole("button", { name: "清空组合事件" }).click();
      const field = area.getByRole("textbox", { name: label!, exact: true });
      await field.focus();
      await field.dispatchEvent("compositionstart", { data: "" });
      await field.evaluate((node: HTMLInputElement | HTMLTextAreaElement) => {
        node.value = "zhong";
        node.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            data: "zhong",
            isComposing: true,
          }),
        );
      });
      await expect(field).toHaveValue("zhong");
      await expect(area.locator("[data-composition-events]")).toHaveText(
        `${prefix}-start`,
      );
      await field.dispatchEvent("compositionupdate", { data: "中" });
      await field.evaluate((node: HTMLInputElement | HTMLTextAreaElement) => {
        node.value = "中";
      });
      await field.dispatchEvent("compositionend", { data: "中" });
      await expect(field).toHaveValue("中");
      await expect(area.locator("[data-composition-events]")).toHaveText(
        `${prefix}-start,${prefix}-update,${prefix}-end,${prefix}-change:中`,
      );
    }
  });
  test(`${mode}: TextArea autosize scroll hidden restore and remount`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(url);
    const area = page.locator("[data-input-textarea]"),
      field = area.getByRole("textbox", { name: "自动高度" });
    const initial = await field.evaluate(
      (node) => node.getBoundingClientRect().height,
    );
    expect(initial).toBeGreaterThan(0);
    await expect(field).toHaveCSS("resize", "none");
    await area.getByRole("button", { name: "增加多行内容" }).click();
    await expect
      .poll(() => field.evaluate((node) => node.getBoundingClientRect().height))
      .toBeGreaterThan(initial);
    expect(
      await field.evaluate((node) => node.getBoundingClientRect().height),
    ).toBeLessThan(initial * 3);
    expect(
      Number(await area.locator("[data-textarea-height]").textContent()),
    ).toBeGreaterThan(0);
    await field.evaluate((node) => {
      node.scrollTop = 40;
      node.dispatchEvent(new Event("scroll"));
    });
    await expect
      .poll(() =>
        area
          .locator(".semi-input-textarea-lineNumber")
          .evaluate((node) => node.scrollTop),
      )
      .toBeGreaterThan(0);
    await area.getByRole("button", { name: "隐藏文本区域" }).click();
    await expect(field).toBeHidden();
    await area.getByRole("button", { name: "显示文本区域" }).click();
    await expect(field).toBeVisible();
    await area.getByRole("button", { name: "切换文本宽度" }).click();
    await expect(area.locator("[data-autosize-container]")).toHaveCSS(
      "width",
      "200px",
    );
    await expect(field).toHaveValue("新增行\n".repeat(8) + "末行");
    await info.attach("input-textarea-lines", {
      body: await screenshot(area.locator("[data-autosize-container]")),
      contentType: "image/png",
    });
    const old = await field.elementHandle();
    await area.getByRole("button", { name: "卸载文本区域" }).click();
    expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
    await area.getByRole("button", { name: "重挂文本区域" }).click();
    await expect(field).toBeVisible();
    expect(await field.evaluate((node, prior) => node === prior, old)).toBe(
      false,
    );
    await old?.dispose();
  });
  test(`${mode}: TextArea counter clear native resize and Enter defaults`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-input-textarea]"),
      counter = area.getByRole("textbox", { name: "统计而不截断" });
    await expect(counter).toHaveValue("超过统计阈值仍然保留");
    await expect(
      counter.locator("..").locator(".semi-input-textarea-counter"),
    ).toHaveClass(/exceed/);
    const clear = area.getByRole("textbox", { name: "清空多行文本" });
    await clear.focus();
    await clear
      .locator("..")
      .locator(".semi-input-clearbtn")
      .dispatchEvent("click");
    await expect(area.locator("[data-textarea-events]")).toHaveText(
      "blur:click,change:,clear:click",
    );
    await expect(clear).toHaveValue("");
    const native = area.getByRole("textbox", { name: "可缩放文本" });
    await expect(native).toHaveCSS("resize", "both");
    const box = await native.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width - 3, box!.y + box!.height - 3);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width + 40, box!.y + box!.height + 30, {
      steps: 5,
    });
    await page.mouse.up();
    await expect
      .poll(() => native.evaluate((node) => node.getBoundingClientRect().width))
      .toBeGreaterThan(box!.width);
    await native.evaluate((node: HTMLTextAreaElement) => {
      node.style.width = "300px";
      node.style.height = "150px";
    });
    await expect
      .poll(async () =>
        Number(await area.locator("[data-textarea-width]").textContent()),
      )
      .toBeGreaterThan(250);
    const keyboard = area.getByRole("textbox", { name: "Shift Enter 换行" });
    await keyboard.fill("第一行");
    await keyboard.press("Enter");
    await expect(keyboard).toHaveValue("第一行");
    await keyboard.press("Shift+Enter");
    await expect(keyboard).toHaveValue("第一行\n");
  });
  test(`${mode}: InputGroup keyed ownership inherited settings and slots`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-input-group]"),
      field = area.getByRole("textbox", { name: "组成员甲" });
    await expect(field).toHaveClass(/semi-input-small/);
    await field.fill("保留编辑");
    await field.focus();
    const original = await field.elementHandle();
    await area
      .getByRole("button", { name: "更新输入上下文" })
      .evaluate((node: HTMLButtonElement) => node.click());
    await expect(field).toBeFocused();
    await expect(area.locator("[data-input-context]").first()).toHaveText("2");
    await area.getByRole("button", { name: "反转输入顺序" }).click();
    expect(
      await field.evaluate((node, prior) => node === prior, original),
    ).toBe(true);
    await expect(field).toHaveValue("保留编辑");
    await expect(area.locator("[data-input-mounts]")).toHaveText("3");
    await area.getByRole("button", { name: "添加输入" }).click();
    await expect(area.locator("[data-input-mounts]")).toHaveText("4");
    await area.getByRole("button", { name: "移除首输入" }).click();
    await expect(area.locator("[data-input-unmounts]")).toHaveText("1");
    await area.getByRole("button", { name: "切换组合禁用" }).click();
    await expect(field).toBeDisabled();
    await expect(
      area.getByRole("textbox", { name: "显式可用成员" }),
    ).toHaveJSProperty("disabled", false);
    await area.getByRole("textbox", { name: "显式可用成员" }).focus();
    await page.keyboard.press("End");
    await page.keyboard.type("!");
    await expect(
      area.getByRole("textbox", { name: "显式可用成员" }),
    ).toHaveValue("始终可用!");
    await area.getByRole("button", { name: "切换嵌套组合" }).click();
    await expect(
      area.getByRole("textbox", { name: "内层成员" }),
    ).toHaveJSProperty("disabled", false);
    await area.getByRole("button", { name: "切换组合尺寸" }).click();
    await expect(field).toHaveClass(/semi-input-large/);
    await area.getByRole("button", { name: "切换标签语言" }).click();
    await expect(area.locator(".semi-form-field-label")).toContainText(
      "optional",
    );
    const suffix = area
      .getByRole("textbox", { name: "后缀所有权" })
      .locator("..")
      .locator(".semi-input-suffix");
    await expect(suffix).toHaveText("插槽后缀");
    await area.getByRole("button", { name: "切换后缀内容" }).click();
    await expect(suffix).toHaveText("");
    await area.getByRole("button", { name: "切换后缀声明" }).click();
    await expect(suffix).toHaveText("属性后缀");
    await area.getByRole("button", { name: "卸载组合" }).click();
    await expect(area.locator("[data-input-unmounts]")).toHaveText("4");
    expect(await original!.evaluate((node) => node.isConnected)).toBe(false);
    await original?.dispose();
  });
  test(`${mode}: InputGroup repeated additions keep unique keyed members`, async ({
    checkedPage: page,
  }) => {
    await page.goto(url);
    const area = page.locator("[data-input-group]");
    await area.getByRole("button", { name: "添加输入" }).click();
    const retained = area.getByRole("textbox", {
      name: "组成员新3",
      exact: true,
    });
    await retained.fill("保留新增成员编辑");
    const original = await retained.elementHandle();
    await area.getByRole("button", { name: "移除首输入" }).click();
    await area.getByRole("button", { name: "添加输入" }).click();
    const members = area.getByRole("textbox", { name: /^组成员/ });
    await expect(members).toHaveCount(4);
    const names = await members.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    expect(new Set(names).size).toBe(names.length);
    await expect(retained).toHaveCount(1);
    await expect(retained).toHaveValue("保留新增成员编辑");
    expect(
      await retained.evaluate((node, prior) => node === prior, original),
    ).toBe(true);
    await expect(
      area.getByRole("textbox", { name: "组成员新4", exact: true }),
    ).toHaveValue("新4");
    await expect(area.locator("[data-input-mounts]")).toHaveText("5");
    await expect(area.locator("[data-input-unmounts]")).toHaveText("1");
    await original?.dispose();
  });
  test(`${mode}: Input light dark RTL narrow layout and cleanup`, async ({
    checkedPage: page,
  }, info) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto(url);
    const previousDir = await page.locator("body").getAttribute("dir"),
      area = page.locator("[data-input-theme]"),
      surface = area.locator("[data-input-surface]");
    const background = () =>
      surface.evaluate((node) => getComputedStyle(node).backgroundColor);
    const light = await background();
    expect(light).not.toBe("rgba(0, 0, 0, 0)");
    await info.attach("input-light", {
      body: await screenshot(surface),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "切换深色" }).click();
    expect(await background()).not.toBe(light);
    await area.getByRole("button", { name: "切换 RTL" }).click();
    await expect(area.locator(".semi-rtl")).toHaveCount(1);
    await area.getByRole("button", { name: "切换主题宽度" }).click();
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(surface).toHaveCSS("width", "240px");
    const input = area.getByRole("textbox", { name: "主题输入" });
    const positions = await input.locator("..").evaluate((node) => ({
      input: node.querySelector("input")!.getBoundingClientRect().x,
      prefix: node.querySelector(".semi-input-prefix")!.getBoundingClientRect()
        .x,
    }));
    expect(positions.prefix).toBeGreaterThan(positions.input);
    await expect(input).toHaveValue("LongUnbrokenContent0123456789长内容");
    await expect(area.getByRole("textbox", { name: "主题多行" })).toHaveValue(
      "长内容在窄容器里按原生 textarea 规则换行。LongUnbrokenContentForWrapping0123456789\n第二行",
    );
    expect(
      await area
        .getByRole("textbox", { name: "主题多行" })
        .evaluate((node) => node.getBoundingClientRect().height),
    ).toBeGreaterThan(30);
    await info.attach("input-dark-rtl-narrow", {
      body: await screenshot(surface),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载输入主题" }).click();
    await expect(surface).toHaveCount(0);
    expect(await page.locator("body").getAttribute("dir")).toBe(previousDir);
  });
}
