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
