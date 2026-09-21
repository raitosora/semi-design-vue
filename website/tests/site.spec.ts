import { expect, test as base, type Page } from "@playwright/test";
const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (["warning", "error"].includes(msg.type())) errors.push(msg.text());
    });
    await use(page);
    expect(errors).toEqual([]);
  },
});
for (const port of [4180, 4181]) {
  test(`${port}: independent Vapor apps, interop and route disposal`, async ({
    checkedPage: page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/runtime.html`);
    const demo = page.getByRole("region", { name: "独立 Vapor 示例" });
    await expect(demo.getByRole("button", { name: "计数：0" })).toHaveCount(2);
    await demo.getByRole("button", { name: "计数：0" }).first().click();
    await expect(demo.getByRole("button", { name: "计数：1" })).toHaveCount(1);
    await expect(demo.getByRole("button", { name: "计数：0" })).toHaveCount(1);
    const interop = page.getByRole("region", { name: "Shell interop 验证" });
    await interop.getByRole("button", { name: "计数：0" }).click();
    await expect(
      interop.getByRole("button", { name: "计数：1" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "更新 interop 标题" }).click();
    await expect(
      interop.getByRole("heading", { name: "Interop 已更新" }),
    ).toBeVisible();
    for (let i = 0; i < 3; i++) {
      await demo.first().getByRole("button", { name: "卸载示例" }).click();
      await expect(demo.first().locator("[data-vapor-host]")).toBeEmpty();
      await demo.first().getByRole("button", { name: "挂载示例" }).click();
      await expect(
        demo.first().getByRole("button", { name: "计数：0" }),
      ).toBeVisible();
    }
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByText("查看 TSX 源码", { exact: true }).first().click();
    await expect(page.locator("pre").first()).toContainText(
      "defineVaporComponent",
    );
    await page.getByRole("link", { name: "阅读兼容边界", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /^兼容边界/, level: 1 }),
    ).toBeVisible();
    await expect(page.locator("[data-fixture]")).toHaveCount(0);
    await page.goBack();
    await expect(demo.getByRole("button", { name: "计数：0" })).toHaveCount(2);
  });
}
test("production: search, theme persistence, mobile navigation and screenshots", async ({
  checkedPage: page,
}, info) => {
  await page.goto("http://127.0.0.1:4181/");
  await expect(
    page.getByText("Semi Design Vue", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "搜索文档" }).click();
  await page.getByRole("searchbox").fill("兼容");
  await expect(page.locator(".VPLocalSearchBox .result").first()).toContainText(
    "兼容",
  );
  await page.getByRole("searchbox").fill("Vapor");
  await expect(
    page.locator(".VPDocSearch .result, .VPLocalSearchBox .result").first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("switch").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.screenshot({ path: info.outputPath("dark.png"), fullPage: true });
  await page.getByRole("switch").click();
  await page.screenshot({ path: info.outputPath("light.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "打开导航" }).click();
  await page
    .getByRole("link", { name: "运行示例", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: /^真实 Vapor 示例/, level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".VPNavScreen")).toBeHidden();
  await expect(page.getByRole("button", { name: "打开导航" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
});
test("production: pure Vapor bundle interaction and unmount", async ({
  checkedPage: page,
}) => {
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.goto("http://127.0.0.1:4181/pure/");
  await page.getByRole("button", { name: "计数：0" }).click();
  await expect(page.getByRole("button", { name: "计数：1" })).toBeVisible();
  await page.getByRole("button", { name: "卸载纯 Vapor" }).click();
  await expect(page.locator("#app")).toBeEmpty();
  const coverage = await page.coverage.stopJSCoverage();
  const functions = coverage.flatMap((entry) => entry.functions);
  for (const name of ["createVaporApp", "template"]) {
    expect(
      functions.some(
        (fn) =>
          fn.functionName === name &&
          fn.ranges.some((range) => range.count > 0),
      ),
      name,
    ).toBe(true);
  }
  expect(
    functions
      .filter((fn) =>
        /^(?:baseCreateRenderer|createRenderer|vaporInteropPlugin|_?createVNode|createComponentWithFallback)$/.test(
          fn.functionName,
        ),
      )
      .some((fn) => fn.ranges.some((range) => range.count > 0)),
  ).toBe(false);
});

test("production: prerendered pages, all internal links and anchors", async ({
  checkedPage: page,
  request,
}) => {
  const { glob, readFile } = await import("node:fs/promises");
  const files: string[] = [];
  for await (const file of glob("website/.vitepress/dist/**/*.html"))
    files.push(file);
  expect(files.length).toBeGreaterThanOrEqual(6);
  let checkedLinks = 0;
  for (const file of files.filter((file) => !file.endsWith("/404.html"))) {
    const path = file.replace("website/.vitepress/dist", "");
    const html = await readFile(file, "utf8");
    if (path.endsWith("runtime.html")) {
      expect(html).toContain("真实 Vapor 示例");
      expect(html).not.toContain("data-fixture=");
      expect(html).not.toContain("data-vapor-host");
    }
    const response = await page.goto("http://127.0.0.1:4181" + path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await page.waitForLoadState("networkidle");
    const demos = page.getByRole("region", { name: "独立 Vapor 示例" });
    for (let i = 0; i < (await demos.count()); i++) {
      await expect(
        demos.nth(i).getByRole("button", { name: "卸载示例" }),
      ).toBeVisible();
      await expect(demos.nth(i).locator("[data-vapor-host]")).not.toBeEmpty();
    }
    const links = await page
      .locator("a[href]")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLAnchorElement).href),
      );
    for (const link of new Set(links)) {
      const url = new URL(link);
      if (url.origin !== "http://127.0.0.1:4181") continue;
      const linked = await request.get(url.href.split("#")[0]);
      expect(linked.status(), link).toBe(200);
      if (url.hash) {
        expect(
          await page.evaluate(
            ({ markup, id }) =>
              new DOMParser()
                .parseFromString(markup, "text/html")
                .getElementById(id) !== null,
            {
              markup: await linked.text(),
              id: decodeURIComponent(url.hash.slice(1)),
            },
          ),
          link,
        ).toBe(true);
      }
      checkedLinks += 1;
    }
  }
  expect(checkedLinks).toBeGreaterThan(20);
});

test("source display matches the actual TSX input byte for byte", async ({
  checkedPage: page,
}) => {
  const { readFile } = await import("node:fs/promises");
  await page.goto("http://127.0.0.1:4181/zh-CN/guide/runtime.html");
  await page.getByText("查看 TSX 源码", { exact: true }).first().click();
  expect(await page.locator(".vapor-demo pre code").first().textContent()).toBe(
    await readFile("website/examples/fixture/Counter.vapor.tsx", "utf8"),
  );
});

test("route disposal stops fixture timers and listeners without duplicate remounts", async ({
  checkedPage: page,
}) => {
  const phases: string[] = [];
  await page.exposeFunction("recordFixture", (phase: string) =>
    phases.push(phase),
  );
  await page.addInitScript(() => {
    window.addEventListener("docs-fixture", (event) => {
      void (
        window as unknown as { recordFixture: (phase: string) => Promise<void> }
      ).recordFixture((event as CustomEvent<string>).detail);
    });
  });
  await page.goto("http://127.0.0.1:4181/zh-CN/guide/runtime.html");
  await expect
    .poll(() => phases.filter((phase) => phase === "mounted").length)
    .toBe(3);
  await expect
    .poll(() => phases.filter((phase) => phase === "tick").length)
    .toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new Event("docs-pulse")));
  await expect
    .poll(() => phases.filter((phase) => phase === "pulse").length)
    .toBe(3);
  await page.getByRole("link", { name: "阅读兼容边界", exact: true }).click();
  await expect
    .poll(() => phases.filter((phase) => phase === "unmounted").length)
    .toBe(3);
  const stopped = phases.length;
  await page.evaluate(() => window.dispatchEvent(new Event("docs-pulse")));
  await page.waitForTimeout(350); // More than three fixture timer intervals.
  expect(phases).toHaveLength(stopped);
  await page.goBack();
  await expect
    .poll(() => phases.filter((phase) => phase === "mounted").length)
    .toBe(6);
  await page.evaluate(() => window.dispatchEvent(new Event("docs-pulse")));
  await expect
    .poll(() => phases.filter((phase) => phase === "pulse").length)
    .toBe(6);
});

test("navigating away while the precompiled example loads cancels late mounts", async ({
  checkedPage: page,
}) => {
  let release!: () => void;
  let entered!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    entered = resolve;
  });
  await page.route("**/*Counter.vapor*", async (route) => {
    entered();
    await pending;
    await route.continue();
  });
  try {
    await page.goto("http://127.0.0.1:4180/zh-CN/guide/runtime.html", {
      waitUntil: "domcontentloaded",
    });
    await requested;
    await page.getByRole("link", { name: "阅读兼容边界", exact: true }).click();
    release();
    await expect(
      page.getByRole("heading", { name: /^兼容边界/, level: 1 }),
    ).toBeVisible();
    await expect(page.locator("[data-fixture]")).toHaveCount(0);
    await page.goBack();
    await expect(page.locator("[data-fixture]")).toHaveCount(3);
  } finally {
    release();
  }
});

test("shell hydration reuses prerendered nodes while demos mount only on client", async ({
  checkedPage: page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/app*.js", async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto("http://127.0.0.1:4181/zh-CN/guide/runtime.html", {
      waitUntil: "commit",
    });
    const heading = page.locator("h1");
    await expect(heading).toContainText("真实 Vapor 示例");
    const prerenderedHeading = await heading.elementHandle();
    expect(prerenderedHeading).not.toBeNull();
    await expect(page.locator("[data-fixture]")).toHaveCount(0);
    release();
    await expect(page.locator("[data-fixture]")).toHaveCount(3);
    expect(
      await prerenderedHeading!.evaluate(
        (node) => node === document.querySelector("h1"),
      ),
    ).toBe(true);
  } finally {
    release();
  }
});

for (const port of [4180, 4181]) {
  test(`${port}: API contracts use compiled presence, slots, named model and generics`, async ({
    checkedPage: page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/api-contracts.html`);
    const fixture = page.locator("[data-contract-demo]");
    const state = fixture.locator("[data-protocol-state]").first();
    await expect(state).toHaveText("非受控:初始值");
    await fixture.getByRole("textbox").first().fill("本地值");
    await expect(state).toHaveText("非受控:本地值");
    for (const [name, value] of [
      ["显式 undefined", "undefined"],
      ["传入 false", "false"],
      ["传入 0", "0"],
      ["传入空字符串", ""],
    ]) {
      await fixture.getByRole("button", { name, exact: true }).click();
      await expect(state).toHaveText(`受控:${value}`);
      await expect(
        fixture.getByText("由父级决定", { exact: true }),
      ).toBeVisible();
    }
    await fixture.getByRole("button", { name: "移除 value" }).click();
    await expect(state).toHaveText("非受控:本地值");
    await expect(
      fixture.getByText("由本地保存", { exact: true }),
    ).toBeVisible();
    await fixture.getByRole("textbox").nth(1).fill("父级新值");
    await expect(fixture.locator("[data-model-value]")).toHaveText("父级新值");
    await page.getByRole("button", { name: "2:2", exact: true }).click();
    await expect(page.getByText("选择：2", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "卸载示例", exact: true })
      .first()
      .click();
    await expect(fixture).toHaveCount(0);
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: compiled Foundation examples update and release their popup`, async ({
    checkedPage: page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/foundation.html`);
    for (const file of [
      "semi-foundation-2.103.0-MIT.txt",
      "es-toolkit-1.39.10-MIT.txt",
    ]) {
      const license = await page.request.get(
        `http://127.0.0.1:${port}/licenses/${file}`,
      );
      expect(license.ok()).toBe(true);
      expect(await license.text()).toContain("Permission is hereby granted");
    }
    await page
      .getByRole("textbox", { name: "Foundation input" })
      .fill("docs foundation");
    await expect(
      page.getByRole("textbox", { name: "Foundation input" }),
    ).toHaveValue("docs foundation");
    await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    const demo = page.getByRole("region", { name: "独立 Vapor 示例" }).nth(1);
    await demo.getByRole("button", { name: "卸载示例" }).click();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await demo.getByRole("button", { name: "挂载示例" }).click();
    await page
      .getByRole("button", { name: "Foundation tooltip trigger" })
      .hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page
      .getByRole("link", { name: "兼容边界", exact: true })
      .first()
      .click();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: theme tokens, dark, RTL and local customization`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/theme.html`);
    const demo = page.locator("[data-theme-demo]");
    await expect(demo).toBeVisible();
    await expect(demo).toHaveCSS("background-color", "rgb(255, 255, 255)");
    if (port === 4181)
      await demo.screenshot({ path: info.outputPath("theme-light.png") });
    await demo.getByRole("button", { name: "切换深色" }).click();
    await expect(demo).not.toHaveCSS("background-color", "rgb(255, 255, 255)");
    if (port === 4181)
      await demo.screenshot({ path: info.outputPath("theme-dark.png") });
    await demo.getByRole("button", { name: "切换 RTL" }).click();
    await expect(demo.getByRole("textbox")).toHaveCSS("direction", "rtl");
    const prefix = await demo.locator(".semi-input-prefix").boundingBox();
    const input = await demo.getByRole("textbox").boundingBox();
    expect(prefix!.x).toBeGreaterThan(input!.x);
    if (port === 4181)
      await demo.screenshot({ path: info.outputPath("theme-rtl.png") });
    await demo.getByRole("button", { name: "启用紫色主题" }).click();
    await expect(demo.locator(".theme-demo-primary")).toHaveCSS(
      "background-color",
      "rgb(124, 58, 237)",
    );
    await demo.getByRole("textbox").fill("动态主题输入");
    await expect(demo.locator(".theme-demo-value")).toHaveText("动态主题输入");
    await page.setViewportSize({ width: 375, height: 812 });
    // The desktop sidebar slides away after a responsive breakpoint change.
    await expect
      .poll(async () => {
        const sidebar = await page.locator(".VPSidebar").boundingBox();
        return sidebar ? sidebar.x + sidebar.width : 0;
      })
      .toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (port === 4181)
      await demo.screenshot({
        path: info.outputPath("theme-custom-narrow.png"),
      });
    await page.getByRole("button", { name: "卸载示例", exact: true }).click();
    await expect(demo).toHaveCount(0);
    await page.getByRole("button", { name: "挂载示例", exact: true }).click();
    await expect(demo).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator("body")).not.toHaveAttribute(
      "theme-mode",
      "dark",
    );
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: Icon product examples keep SVG scope, semantics and lazy catalog previews`, async ({
    checkedPage: page,
  }) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/components/icons.html`);
    const basic = page.locator("[data-icon-basic]");
    await expect(basic.locator("[data-icon-labelled]")).toHaveAttribute(
      "role",
      "img",
    );
    await expect(basic.locator("[data-icon-decorative]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(basic.locator("[data-icon-factory]")).toHaveAttribute(
      "aria-label",
      "工厂创建的星形图标",
    );

    const custom = page.locator("[data-icon-custom]");
    const gradient = custom.locator("[data-icon-gradient]");
    const svg = gradient.locator("svg");
    const originalSvg = await svg.elementHandle();
    const originalId = await gradient
      .locator("linearGradient")
      .getAttribute("id");
    await custom.getByRole("button", { name: "切换渐变颜色" }).click();
    await expect(gradient.locator("stop").first()).toHaveAttribute(
      "stop-color",
      "#2563eb",
    );
    expect(
      await svg.evaluate((node, previous) => node === previous, originalSvg),
    ).toBe(true);
    await expect(gradient.locator("linearGradient")).toHaveAttribute(
      "id",
      originalId ?? "",
    );
    await expect(gradient.locator("path")).toHaveAttribute(
      "fill",
      `url(#${originalId})`,
    );

    const states = page.locator("[data-icon-states]");
    await expect(
      states.locator("[data-icon-button] > .semi-icon[aria-hidden='true']"),
    ).toBeVisible();
    await states.getByRole("button", { name: "开始旋转" }).click();
    await expect(states.locator("[data-icon-spinner]")).toHaveClass(/spinning/);

    const catalog = page.locator("[data-icon-catalog]");
    await expect(catalog.locator("[data-icon-catalog-count]")).toContainText(
      "623",
    );
    await catalog
      .getByRole("textbox", { name: "搜索资源名称" })
      .fill("IconHome");
    await expect(catalog.locator("[data-icon-result-count]")).toHaveText(
      "找到 2 项",
    );
    await catalog
      .getByRole("button", { name: "IconHome", exact: true })
      .click();
    await expect(catalog.locator("[data-icon-preview-host] svg")).toBeVisible();
    await expect(catalog.locator("[data-icon-preview]")).toContainText(
      "semi-icons-vue/IconHome",
    );
    await catalog
      .getByRole("combobox", { name: "资源包" })
      .selectOption("semi-illustrations-vue");
    await expect(catalog.locator("[data-icon-result-count]")).toHaveText(
      "找到 0 项",
    );
    await catalog
      .getByRole("textbox", { name: "搜索资源名称" })
      .fill("IllustrationNoContent");
    await expect(catalog.locator("[data-icon-result-count]")).toHaveText(
      "找到 2 项",
    );
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: generated resources and locale data`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/resources.html`);
    const demo = page.locator("[data-resource-demo]");
    await expect(demo).toBeVisible();
    const icon = demo.locator("[data-resource-home]");
    await expect(icon).toHaveAttribute("width", "16");
    await expect(icon).toHaveCSS("color", "rgb(17, 105, 170)");
    await demo.getByRole("button", { name: "放大并改色" }).click();
    await expect(icon).toHaveAttribute("width", "32");
    await expect(icon).toHaveCSS("color", "rgb(124, 58, 237)");
    await expect(demo.locator("[data-resource-locale]")).toContainText("确定");
    await demo.getByRole("button", { name: "切换语言数据" }).click();
    await expect(demo.locator("[data-resource-locale]")).toContainText(
      "Confirm",
    );
    await expect(demo.locator("svg")).toHaveCount(4);
    const references = await demo.evaluate((root) => {
      const svgs = [...root.querySelectorAll("svg")];
      const ids = svgs.flatMap((svg) =>
        [...svg.querySelectorAll("[id]")].map((node) => node.id),
      );
      const refs = svgs.flatMap((svg) =>
        [...svg.querySelectorAll("*")].flatMap((node) =>
          [...node.attributes].flatMap((attr) =>
            [...attr.value.matchAll(/url\(#([^)]+)\)/g)].map((match) => ({
              id: match[1],
              local: !!svg.querySelector(`[id="${match[1]}"]`),
            })),
          ),
        ),
      );
      return { unique: new Set(ids).size === ids.length, refs };
    });
    expect(references.unique).toBe(true);
    expect(references.refs.length).toBeGreaterThan(0);
    expect(references.refs.every((ref) => ref.local)).toBe(true);
    if (port === 4181)
      await demo.screenshot({ path: info.outputPath("resources.png") });
    await page.getByRole("button", { name: "卸载示例", exact: true }).click();
    await expect(demo).toHaveCount(0);
    await page.getByRole("button", { name: "挂载示例", exact: true }).click();
    await expect(demo.locator("[data-resource-home]")).toHaveAttribute(
      "width",
      "16",
    );
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: context inheritance, explicit clears and app isolation`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/context.html`);
    const demos = page.locator("[data-context-demo]");
    await expect(demos).toHaveCount(2);
    const first = demos.first();
    await expect(first.locator("[data-context-inner]")).toHaveText(
      "zh-CN|rtl|8",
    );
    await first.getByRole("button", { name: "切换语言与时区" }).click();
    await expect(first.locator("[data-context-inner]")).toHaveText(
      "en-US|rtl|0",
    );
    await expect(demos.nth(1).locator("[data-context-inner]")).toHaveText(
      "zh-CN|rtl|8",
    );
    await first.getByRole("button", { name: "移除内层覆盖" }).click();
    await expect(first.locator("[data-context-inner]")).toHaveText(
      "en-US|ltr|0",
    );
    await first.getByRole("button", { name: "显式清空方向" }).click();
    await expect(first.locator("[data-context-inner]")).toHaveText(
      "en-US|undefined|0",
    );
    await first.getByRole("button", { name: "恢复内层 RTL" }).click();
    await first.getByRole("button", { name: "读取静态上下文" }).click();
    await expect(first.locator("[data-context-static]")).toHaveText(
      "en-US|ltr|0",
    );
    if (port === 4181)
      await first.screenshot({ path: info.outputPath("context.png") });
    const demo = page.getByRole("region", { name: "独立 Vapor 示例" }).first();
    await demo.getByRole("button", { name: "卸载示例" }).click();
    await expect(demos).toHaveCount(1);
    await demo.getByRole("button", { name: "挂载示例" }).click();
    await expect(demos.first().locator("[data-context-inner]")).toHaveText(
      "zh-CN|rtl|8",
    );
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: DOM tools preserve labels, keyboard movement, media and independent disposal`, async ({
    checkedPage: page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/dom.html`);
    const demos = page.locator("[data-dom-demo]");
    await expect(demos).toHaveCount(2);
    const first = demos.first();
    await expect(first.locator("[data-dom-size]")).toHaveText("180 × 48");
    await expect(first.locator("[data-dom-motion]")).toHaveText("是");
    const outsideBeforeDisabled = await first
      .locator("[data-dom-outside]")
      .textContent();
    const disabledBox = await first
      .getByRole("button", { name: "禁用项", exact: true })
      .boundingBox();
    expect(disabledBox).not.toBeNull();
    await page.mouse.click(
      disabledBox!.x + disabledBox!.width / 2,
      disabledBox!.y + disabledBox!.height / 2,
    );
    await expect(first.locator("[data-dom-outside]")).toHaveText(
      outsideBeforeDisabled!,
    );
    const ids = await demos
      .locator("input")
      .evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(2);
    await first.getByRole("button", { name: "第一项", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      first.getByRole("button", { name: "最后一项", exact: true }),
    ).toBeFocused();
    await first.getByRole("button", { name: "切换 RTL", exact: true }).click();
    await first.getByRole("button", { name: "第一项", exact: true }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(
      first.getByRole("button", { name: "最后一项", exact: true }),
    ).toBeFocused();
    await first.getByRole("button", { name: "增加宽度" }).click();
    await expect(first.locator("[data-dom-size]")).toHaveText("220 × 48");
    await expect(demos.last().locator("[data-dom-size]")).toHaveText(
      "180 × 48",
    );
    await first.getByRole("button", { name: "暂停点外监听" }).click();
    const count = await first.locator("[data-dom-outside]").textContent();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(first.locator("[data-dom-outside]")).toHaveText(count!);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(first.locator("[data-dom-motion]")).toHaveText("否");
    await page.screenshot({
      path: info.outputPath("dom-tools.png"),
      fullPage: true,
    });
    const region = page
      .getByRole("region", { name: "独立 Vapor 示例" })
      .first();
    await region.getByRole("button", { name: "卸载示例" }).click();
    await expect(region.locator("[data-vapor-host]")).toBeEmpty();
    await region.getByRole("button", { name: "挂载示例" }).click();
    await expect(region.locator("[data-dom-size]")).toHaveText("180 × 48");
    await expect(region.locator("[data-dom-scheduled]")).toHaveText("0");
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: overlay containers, keyboard closure and independent disposal`, async ({
    checkedPage: page,
  }, info) => {
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/overlay.html`);
    const demos = page.locator("[data-overlay-demo]");
    await expect(demos).toHaveCount(2);
    const first = demos.first();
    const trigger = first.getByRole("button", {
      name: "打开浮层",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "示例浮层" });
    await expect(
      dialog.getByRole("button", { name: "内部计数 0" }),
    ).toBeFocused();
    await dialog.getByRole("button", { name: "内部计数 0" }).click();
    await dialog.getByRole("button", { name: "更新内容" }).click();
    await expect(dialog.locator("[data-overlay-label]")).toHaveText(
      "更新 2 · ltr",
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(first.locator("[data-overlay-closes]")).toHaveText("1");
    await expect(demos.last().locator("[data-overlay-closes]")).toHaveText("0");
    await trigger.click();
    await dialog.getByRole("button", { name: "切换容器" }).click();
    await expect(page.locator("body > [data-semi-overlay]")).toHaveCount(1);
    await page.screenshot({
      path: info.outputPath("overlay-host.png"),
      fullPage: true,
    });
    await page.getByRole("heading", { level: 1 }).click();
    await expect(dialog).toHaveCount(0);
    const region = page
      .getByRole("region", { name: "独立 Vapor 示例" })
      .first();
    await trigger.click();
    await region.getByRole("button", { name: "卸载示例" }).click();
    await expect(page.locator("[data-semi-overlay]")).toHaveCount(0);
    await expect(region.locator("[data-vapor-host]")).toBeEmpty();
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: animation presence, reduced motion, size and independent disposal`, async ({
    checkedPage: page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`http://127.0.0.1:${port}/zh-CN/guide/animation.html`);
    const examples = page.getByRole("region", { name: "独立 Vapor 示例" });
    const first = examples.first();
    const second = examples.nth(1);
    await expect(first.getByLabel("动画状态")).toContainText("entered");
    await first.getByRole("button", { name: "切换可见性" }).click();
    await expect(first.getByLabel("动画状态")).toContainText("leaving");
    await expect(first.locator("[data-motion-panel]")).toHaveCount(1);
    await expect(first.locator("[data-motion-panel]")).toHaveCount(0);
    await expect(second.locator("[data-motion-panel]")).toHaveCount(1);
    await first.getByRole("button", { name: "改变内容尺寸" }).click();
    await expect(first.locator(".semi-motion-size")).toHaveCSS(
      "height",
      "140px",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await first.getByRole("button", { name: "切换可见性" }).click();
    await expect(first.getByLabel("动画状态")).toContainText("entered");
    await first.getByRole("button", { name: "打开动画浮层" }).click();
    await expect(page.getByRole("dialog", { name: "动画浮层" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "动画浮层" })).toHaveCount(0);
    await first.getByText("查看 TSX 源码", { exact: true }).click();
    await expect(first.locator("pre")).toContainText("usePresence");
    await page.screenshot({
      path: info.outputPath("animation.png"),
      fullPage: true,
    });
    await first.getByRole("button", { name: "卸载示例" }).click();
    await expect(first.locator("[data-vapor-host]")).toBeEmpty();
    await expect(second.getByLabel("动画状态")).toContainText("entered");
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: virtual list and native pointer product examples`, async ({
    checkedPage: page,
  }) => {
    await page.goto(
      `http://127.0.0.1:${port}/zh-CN/guide/virtualization-pointer.html`,
    );
    await page.getByRole("button", { name: "定位项目 500" }).click();
    await page.locator("[data-virtual-scroll]").scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("textbox", { name: "编辑项目 500", exact: true }),
    ).toBeInViewport();
    await page.getByRole("button", { name: "改变行高" }).click();
    expect(await page.locator("[data-virtual-row]").count()).toBeLessThan(40);
    const handle = page.locator("[data-drag-handle]").first();
    await handle.scrollIntoViewIfNeeded();
    const bounds = (await handle.boundingBox())!;
    await page.mouse.move(bounds.x + 12, bounds.y + 12);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 82, bounds.y + 62);
    await page.mouse.up();
    await expect(page.getByLabel("指针位置").first()).toHaveText(
      "70, 50 · end",
    );
    await expect(page.getByLabel("指针位置").nth(1)).toHaveText("0, 0 · idle");
    await page.getByRole("button", { name: "切换宽度" }).first().click();
    await expect(page.locator("[data-resize-box]").first()).toHaveCSS(
      "width",
      "200px",
    );
    const demos = page.getByRole("region", { name: "独立 Vapor 示例" });
    await demos.first().getByRole("button", { name: "卸载示例" }).click();
    await expect(page.locator("[data-virtual-row]")).toHaveCount(0);
    await demos.nth(1).getByRole("button", { name: "卸载示例" }).click();
    await expect(page.locator("[data-drag-handle]")).toHaveCount(0);
  });
}

for (const port of [4180, 4181]) {
  test(`${port}: ConfigProvider nesting, responsive cleanup and isolated overlay apps`, async ({
    checkedPage: page,
  }, info) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(
      `http://127.0.0.1:${port}/zh-CN/components/configProvider.html`,
    );
    const nested = page.locator("[data-config-nested-demo]");
    await expect(nested).toHaveClass("semi-always-light");
    await expect(nested).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const lightColors = await nested.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, text: style.color };
    });
    const buttons = nested.getByRole("button");
    const lightButtonColors = await buttons.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return { background: style.backgroundColor, text: style.color };
      }),
    );
    expect(lightButtonColors.length).toBeGreaterThan(0);
    for (const colors of lightButtonColors) {
      expect(colors.background).not.toBe("rgba(0, 0, 0, 0)");
      expect(colors.text).toBe(lightColors.text);
    }
    await nested.screenshot({
      path: info.outputPath("config-provider-light.png"),
      animations: "disabled",
    });
    await nested.getByRole("button", { name: "切换局部深色" }).click();
    await expect(nested).toHaveClass("semi-always-dark");
    await expect(nested).not.toHaveCSS(
      "background-color",
      lightColors.background,
    );
    await expect(nested).not.toHaveCSS("color", lightColors.text);
    for (const [index, colors] of lightButtonColors.entries()) {
      await expect(buttons.nth(index)).not.toHaveCSS(
        "background-color",
        colors.background,
      );
      await expect(buttons.nth(index)).not.toHaveCSS("color", colors.text);
    }
    await expect(nested.locator("[data-config-outer]")).toHaveText(
      "zh-CN|ltr|8",
    );
    await expect(nested.locator("[data-config-inner]")).toHaveText(
      "zh-CN|rtl|8",
    );
    await nested.getByRole("button", { name: "子树计数 0" }).click();
    await nested.getByRole("button", { name: "切换外层配置" }).click();
    await expect(nested.locator("[data-config-outer]")).toHaveText(
      "en-US|rtl|0",
    );
    await nested.getByRole("button", { name: "移除方向覆盖" }).click();
    await expect(nested.locator("[data-config-inner]")).toHaveText(
      "en-US|rtl|0",
    );
    await nested.getByRole("button", { name: "内层使用 LTR" }).click();
    await expect(nested.locator("[data-config-inner]")).toHaveText(
      "en-US|ltr|0",
    );
    await expect(
      nested.getByRole("button", { name: "子树计数 1" }),
    ).toBeVisible();
    await nested.getByRole("button", { name: "清空方向" }).click();
    await expect(nested.locator("[data-config-inner]")).toHaveText(
      "en-US|undefined|0",
    );
    const providerRoot = nested.locator(":scope > div");
    await expect(providerRoot).toHaveAttribute("dir", "rtl");
    await expect(providerRoot).toHaveClass("semi-rtl");
    await expect(nested.locator("[data-config-outer]")).toHaveCSS(
      "direction",
      "rtl",
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await nested.scrollIntoViewIfNeeded();
    expect(
      await nested.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await expect(
      nested.getByRole("button", { name: "子树计数 1" }),
    ).toBeVisible();
    await nested.screenshot({
      path: info.outputPath("config-provider-dark-rtl-narrow.png"),
      animations: "disabled",
    });
    await nested.getByRole("button", { name: "切换局部浅色" }).click();
    await expect(nested).toHaveCSS("background-color", lightColors.background);
    await expect(nested).toHaveCSS("color", lightColors.text);
    for (const [index, colors] of lightButtonColors.entries()) {
      await expect(buttons.nth(index)).toHaveCSS(
        "background-color",
        colors.background,
      );
      await expect(buttons.nth(index)).toHaveCSS("color", colors.text);
    }
    await page.setViewportSize({ width: 1100, height: 900 });
    const responsive = page.locator("[data-config-responsive-demo]");
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=true");
    await responsive.getByRole("button", { name: "暂停响应式监听" }).click();
    const frozen = await responsive
      .locator("[data-config-notifications]")
      .textContent();
    await page.setViewportSize({ width: 700, height: 900 });
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=true");
    await expect(responsive.locator("[data-config-notifications]")).toHaveText(
      frozen!,
    );
    await responsive.getByRole("button", { name: "恢复响应式监听" }).click();
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=false");
    await responsive.getByRole("button", { name: "自定义 md 阈值" }).click();
    await expect(responsive.locator("[data-config-md]")).toHaveText("md=true");
    await responsive.getByRole("button", { name: "卸载订阅者" }).click();
    await expect(responsive.locator("[data-config-md]")).toHaveCount(0);
    const stopped = await responsive
      .locator("[data-config-notifications]")
      .textContent();
    await page.setViewportSize({ width: 1100, height: 900 });
    await expect(responsive.locator("[data-config-notifications]")).toHaveText(
      stopped!,
    );
    const apps = page.locator("[data-config-overlay-demo]");
    await expect(apps).toHaveCount(2);
    await apps.nth(0).getByRole("button", { name: "打开配置浮层" }).click();
    await apps.nth(1).getByRole("button", { name: "打开配置浮层" }).click();
    await expect(page.locator("[data-config-popup]")).toHaveCount(2);
    await page.getByRole("switch").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    for (const app of [apps.nth(0), apps.nth(1)]) {
      const popup = app.locator("[data-config-popup]");
      // Semi's light surface must retain its paired text/button colors even
      // when the surrounding VitePress shell switches to a dark foreground.
      await expect(popup).toHaveCSS("color", lightColors.text);
      await expect(popup.getByRole("button")).toHaveCSS(
        "color",
        lightColors.text,
      );
      await expect(popup.getByRole("button")).toHaveCSS(
        "background-color",
        "rgb(255, 255, 255)",
      );
    }
    await apps
      .nth(0)
      .locator("[data-config-popup]")
      .screenshot({
        path: info.outputPath("config-provider-overlay-dark-shell.png"),
        animations: "disabled",
      });
    await page.getByRole("switch").click();
    await apps.nth(0).getByRole("button", { name: "浮层计数 0" }).click();
    await apps.nth(0).getByRole("button", { name: "切换浮层容器" }).click();
    await expect(
      apps.nth(0).locator("[data-config-container-b] [data-config-popup]"),
    ).toHaveCount(1);
    await expect(
      apps.nth(0).getByRole("button", { name: "浮层计数 1" }),
    ).toBeVisible();
    await apps.nth(0).getByRole("button", { name: "切换浮层方向" }).click();
    await expect(
      apps.nth(0).locator("[data-config-popup-direction]"),
    ).toHaveText("rtl");
    await expect(
      apps.nth(1).locator("[data-config-popup-direction]"),
    ).toHaveText("ltr");
    await apps.nth(0).getByRole("button", { name: "卸载配置区域" }).click();
    await expect(apps.nth(0).locator("[data-config-popup]")).toHaveCount(0);
    await expect(apps.nth(1).locator("[data-config-popup]")).toHaveCount(1);
    await page.screenshot({
      path: info.outputPath("config-provider.png"),
      fullPage: true,
      animations: "disabled",
    });
    await apps.nth(1).getByRole("button", { name: "卸载配置区域" }).click();
    await expect(page.locator("[data-config-popup]")).toHaveCount(0);
  });
}
