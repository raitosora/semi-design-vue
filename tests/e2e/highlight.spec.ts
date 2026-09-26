import { expect, test } from "@playwright/test";

for (const mode of ["dev", "production"] as const) {
  const url = `http://127.0.0.1:${mode === "dev" ? 4175 : 4176}/?highlight`;

  test(`${mode}: Highlight preserves source order, merges matches and safely displays HTML-like text`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const basic = page.locator("[data-highlight-basic]");
    const sentence = basic.locator("[data-highlight-sentence]");
    await expect(sentence).toHaveText(
      "从 Semi Design 到 Any Design，快速定义你的设计系统。",
    );
    await expect(sentence.locator(":scope > mark")).toHaveText([
      "Semi Design",
      "设计系统",
    ]);
    expect(
      await sentence.evaluate((node) =>
        [...node.childNodes]
          .filter(
            (child) =>
              child.nodeType !== Node.COMMENT_NODE &&
              !(child.nodeType === Node.TEXT_NODE && child.textContent === ""),
          )
          .map((child) => ({
            type: child.nodeType,
            name: child.nodeName,
            text: child.textContent,
          })),
      ),
    ).toEqual([
      { type: 3, name: "#text", text: "从 " },
      { type: 1, name: "MARK", text: "Semi Design" },
      { type: 3, name: "#text", text: " 到 Any Design，快速定义你的" },
      { type: 1, name: "MARK", text: "设计系统" },
      { type: 3, name: "#text", text: "。" },
    ]);
    await expect(basic.locator("[data-highlight-overlap] mark")).toHaveText([
      "ababa",
      "Semi",
      "SEMI",
      "semi",
    ]);
    const safe = basic.locator("[data-highlight-safe]");
    await expect(safe).toHaveText(
      '<script>alert("x")</script> &amp; <style>body{color:red}</style> [a+b] 😀 中文',
    );
    await expect(safe.locator("script, style, img")).toHaveCount(0);
    await expect(safe.locator("mark")).toHaveText([
      "<script>",
      "&amp;",
      "[a+b]",
      "😀",
      "中文",
    ]);
    await info.attach("highlight-basic", {
      body: await basic.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });

  test(`${mode}: Highlight custom tags, classes, per-keyword style precedence and regular expressions`, async ({
    page,
  }, info) => {
    await page.goto(url);
    const custom = page.locator("[data-highlight-custom]");
    const tags = custom.locator("[data-highlight-styled] > strong");
    await expect(tags).toHaveText(["Semi", "Design", "Design"]);
    await expect(tags.nth(0)).toHaveClass(
      "semi-highlight-tag example-highlight keyword-semi",
    );
    await expect(tags.nth(0)).toHaveCSS("color", "rgb(0, 96, 96)");
    await expect(tags.nth(0)).toHaveCSS("border-radius", "4px");
    await expect(tags.nth(1)).toHaveCSS(
      "background-color",
      "rgb(232, 220, 255)",
    );
    await expect(tags.nth(1)).toHaveCSS("color", "rgb(32, 32, 32)");
    await expect(custom.locator("[data-highlight-regex] mark")).toHaveText([
      "v2",
      "v103",
    ]);
    await info.attach("highlight-custom", {
      body: await custom.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  });

  test(`${mode}: Highlight updates text, words and removed defaults and remounts without stale DOM`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    const area = page.locator("[data-highlight-dynamic]");
    const live = area.locator("[data-highlight-live]");
    await expect(live.locator("mark")).toHaveText(["Semi", "SEMI", "semi"]);
    await area
      .getByRole("button", { name: "使用 strong 和大小写敏感" })
      .click();
    await expect(live.locator("strong")).toHaveText(["semi"]);
    await expect(live.locator("mark")).toHaveCount(0);
    await area.getByRole("button", { name: "设为 undefined" }).click();
    await expect(live.locator("mark")).toHaveText(["Semi", "SEMI", "semi"]);
    await area
      .getByRole("button", { name: "使用 strong 和大小写敏感" })
      .click();
    await area.getByRole("button", { name: "移除可选属性" }).click();
    await expect(live.locator("mark")).toHaveText(["Semi", "SEMI", "semi"]);
    await expect(live.locator("strong")).toHaveCount(0);
    await area
      .getByRole("textbox", { name: "高亮源文本" })
      .fill("Design [x+y] 😀");
    await area.getByRole("textbox", { name: "高亮关键词" }).fill("[x+y],😀");
    await expect(live.locator("mark")).toHaveText(["[x+y]", "😀"]);
    await area.getByRole("textbox", { name: "高亮关键词" }).fill("");
    await expect(live.locator("mark")).toHaveCount(0);
    await expect(live).toHaveText("Design [x+y] 😀");
    await area.getByRole("textbox", { name: "高亮源文本" }).fill("");
    await expect(live).toBeEmpty();
    await area.getByRole("button", { name: "快速更新" }).click();
    await expect(live).toHaveText("最终文本 😀");
    await expect(live.locator("mark")).toHaveText(["最终", "😀"]);
    await info.attach("highlight-dynamic", {
      body: await area.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await area.getByRole("button", { name: "卸载 Highlight" }).click();
    await expect(live).toBeEmpty();
    expect(
      await live.evaluate((node) => node.querySelectorAll("*").length),
    ).toBe(0);
    await area.getByRole("button", { name: "挂载 Highlight" }).click();
    await expect(live).toHaveText("最终文本 😀");
    await expect(live.locator("mark")).toHaveText(["最终", "😀"]);
    expect(errors).toEqual([]);
  });

  test(`${mode}: Highlight keeps mark semantics, line breaks and order across dark RTL narrow layouts`, async ({
    page,
  }, info) => {
    await page.goto(url);
    const theme = page.locator("[data-highlight-theme]");
    const paragraph = theme.locator("[data-highlight-theme-text]");
    const marks = paragraph.locator("mark");
    await expect(marks).toHaveText(["Semi", "设计系统", "😀", "مرحبا", "Semi"]);
    await expect(paragraph).toHaveCSS("white-space", "pre-wrap");
    expect(await paragraph.textContent()).toContain("\n第二行");
    const light = await marks
      .first()
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    await info.attach("highlight-light", {
      body: await theme.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await theme.getByRole("button", { name: "切换深色" }).click();
    await expect(marks.first()).not.toHaveCSS("background-color", light);
    await theme.getByRole("button", { name: "切换 RTL" }).click();
    await expect(paragraph).toHaveCSS("direction", "rtl");
    await page.setViewportSize({ width: 375, height: 812 });
    expect(
      await theme.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
    ).toBe(true);
    await expect(marks).toHaveText(["Semi", "设计系统", "😀", "مرحبا", "Semi"]);
    expect(
      await marks.evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            !node.hasAttribute("tabindex") && !node.hasAttribute("aria-hidden"),
        ),
      ),
    ).toBe(true);
    await info.attach("highlight-dark-rtl-narrow", {
      body: await theme.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await theme.getByRole("button", { name: "切换 LTR" }).click();
    await expect(paragraph).toHaveCSS("direction", "ltr");
    await page.evaluate(() => window.unmountFixture());
    await expect(page.locator("#app")).toBeEmpty();
  });
}
