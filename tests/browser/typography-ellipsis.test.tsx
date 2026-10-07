import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import Text from "../../packages/semi-ui-vue/src/components/typography/text.js";
import Paragraph from "../../packages/semi-ui-vue/src/components/typography/paragraph.js";
import { mountVapor } from "../support/mount-vapor.js";
import { provideAriaIdScope } from "../../packages/semi-ui-vue/src/dom/aria.js";

function mountWithIds(Component: ReturnType<typeof defineVaporComponent>) {
  return mountVapor(
    defineVaporComponent(() => {
      provideAriaIdScope("typography-measure");
      return <Component />;
    }),
  );
}

const sentence =
  "Typography keeps native content ownership and measures real browser text. ".repeat(
    5,
  );
const settle = async () => {
  await nextTick();
  await new Promise<void>((done) => requestAnimationFrame(() => done()));
  await nextTick();
};

test.each([
  [1, "border-box"],
  [2, "border-box"],
  [1, "content-box"],
  [2, "content-box"],
] as const)(
  "Typography JS ellipsis measures the resolved content width with %s rows and %s constraints",
  async (rows, boxSizing) => {
    const release = layoutStyles();
    const content = shallowRef("fit");
    const minWidth = shallowRef("220px");
    const fixture = mountWithIds(
      defineVaporComponent(() => (
        <div class="typo-measure-case" style={{ width: "220px" }}>
          <Paragraph
            children={content.value}
            ellipsis={{ rows, suffix: "END" }}
            style={{
              width: "220px",
              minWidth: minWidth.value,
              maxWidth: "100%",
              padding: "0 20px",
              border: "2px solid black",
              boxSizing,
            }}
          />
        </div>
      )),
    );
    try {
      const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
      await settle();
      await settle();
      expect(root.textContent).toBe("fitEND");
      const width = root.getBoundingClientRect().width;
      content.value = sentence;
      await expect.poll(() => root.textContent!.includes("...")).toBe(true);
      expect(root.textContent!.length).toBeGreaterThan("...END".length);
      expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
      expect(root.scrollHeight).toBeLessThanOrEqual(rows * 24);
      const truncated = root.textContent;
      minWidth.value = "100%";
      await settle();
      await settle();
      expect(root.getBoundingClientRect().width).toBe(width);
      expect(root.textContent).toBe(truncated);
      expect(fixture.host.querySelector(".semi-typography")).toBe(root);
      content.value = "fit";
      await expect.poll(() => root.textContent).toBe("fitEND");
    } finally {
      fixture.unmount();
      release();
    }
  },
);
// Layout fixture for behavioral measurements. Pinned SCSS/visual coverage is separate.
function layoutStyles() {
  const sheet = document.createElement("style");
  sheet.textContent = `.typo-measure-case .semi-typography{font:16px/24px monospace;margin:0}
.typo-measure-case .semi-typography-ellipsis-single-line{overflow:hidden}
.typo-measure-case .semi-typography-ellipsis-overflow-ellipsis{display:block;white-space:nowrap;text-overflow:ellipsis}
.typo-measure-case .semi-typography-ellipsis-multiple-line{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}
.typo-measure-case .semi-typography-ellipsis-expand{margin-left:8px}`;
  document.head.append(sheet);
  return () => sheet.remove();
}

test("Typography JS ellipsis expands, collapses and resets after dynamic text without replacing its root", async () => {
  const release = layoutStyles();
  const content = shallowRef(sentence);
  const notify = vi.fn();
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <Paragraph
          children={content.value}
          ellipsis={{
            rows: 2,
            expandable: true,
            collapsible: true,
            expandText: "More",
            collapseText: "Less",
            onExpand: notify,
          }}
          style={{ width: "180px" }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    await expect
      .poll(
        () =>
          root.querySelector(".semi-typography-ellipsis-expand")?.textContent,
      )
      .toBe("More");
    expect(root.textContent).toContain("...");
    expect(root.textContent!.length).toBeLessThan(sentence.length);
    const expand = root.querySelector<HTMLElement>(
      ".semi-typography-ellipsis-expand",
    )!;
    expect(expand.getAttribute("role")).toBe("button");
    expect(expand.getAttribute("aria-label")).toBe("More");
    expand.click();
    await nextTick();
    expect(root.textContent).toContain(sentence);
    expect(notify.mock.calls[0]![0]).toBe(true);
    const collapse = root.querySelector<HTMLElement>(
      ".semi-typography-ellipsis-expand",
    )!;
    expect(collapse.textContent).toBe("Less");
    collapse.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: "Enter",
        code: "Enter",
        charCode: 13,
        keyCode: 13,
        bubbles: true,
      }),
    );
    await expect
      .poll(() => root.textContent!.length)
      .toBeLessThan(sentence.length);
    expect(notify.mock.calls[1]![0]).toBe(false);
    content.value = "short";
    await expect.poll(() => root.textContent).toBe("short");
    expect(root.querySelector(".semi-typography-ellipsis-expand")).toBeNull();
    expect(fixture.host.querySelector(".semi-typography")).toBe(root);
  } finally {
    fixture.unmount();
    release();
  }
});

test("Typography middle ellipsis preserves suffix and responds to parent resizing, hidden recovery and fonts", async () => {
  const release = layoutStyles();
  const width = shallowRef(190);
  const hidden = shallowRef(false);
  const font = shallowRef(16);
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div
        class="typo-measure-case"
        style={{
          width: `${width.value}px`,
          display: hidden.value ? "none" : "block",
        }}
      >
        <Paragraph
          children={sentence}
          ellipsis={{ pos: "middle", suffix: " END" }}
          style={{ width: "100%", fontSize: `${font.value}px` }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    await expect.poll(() => root.textContent?.includes("...")).toBe(true);
    const first = root.textContent!;
    expect(first.endsWith(" END")).toBe(true);
    width.value = 360;
    await expect
      .poll(() => root.textContent!.length)
      .toBeGreaterThan(first.length);
    const wider = root.textContent!;
    font.value = 24;
    document.fonts.dispatchEvent(new Event("loadingdone"));
    await expect
      .poll(() => root.textContent!.length)
      .toBeLessThan(wider.length);
    hidden.value = true;
    await settle();
    width.value = 130;
    hidden.value = false;
    await expect.poll(() => root.getBoundingClientRect().width).toBe(130);
    await expect
      .poll(() => root.textContent!.length)
      .toBeLessThan(first.length);
    expect(root.textContent!.endsWith(" END")).toBe(true);
  } finally {
    fixture.unmount();
    release();
  }
});

test("Typography first CSS overflow hover shows tooltip with exact padding and border content-box measurements", async () => {
  const release = layoutStyles();
  const entered = vi.fn();
  const mounted = shallowRef(false);
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <button
          data-testid="typography-first-hover-away"
          style={{ position: "fixed", right: "0", bottom: "0" }}
        >
          Outside
        </button>
        {mounted.value && (
          <Text
            children={sentence}
            data-testid="typography-first-hover"
            ellipsis={{
              showTooltip: {
                opts: { mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false },
              },
            }}
            onMouseenter={entered}
            style={{
              display: "block",
              width: "180.5px",
              padding: "0 18px",
              border: "3px solid black",
              boxSizing: "border-box",
            }}
          />
        )}
      </div>
    )),
  );
  try {
    // Place the real pointer outside before the first target mount; previous
    // browser tests can leave it at the coordinates of the new target.
    await page.getByTestId("typography-first-hover-away").hover();
    mounted.value = true;
    await settle();
    await settle();
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    expect(root.scrollWidth).toBeGreaterThan(root.clientWidth);
    expect(entered).not.toHaveBeenCalled();
    await page.getByTestId("typography-first-hover").hover();
    await expect
      .poll(
        () =>
          document.querySelector('[role="tooltip"] .semi-tooltip-content')
            ?.textContent,
      )
      .toBe(sentence);
    expect(entered).toHaveBeenCalledTimes(1);
    expect(fixture.host.querySelector(".semi-typography")).toBe(root);
  } finally {
    fixture.unmount();
    release();
  }
});

test("Typography nonoverflowing subpixel text does not show a tooltip and content-box sizing stays equivalent", async () => {
  const release = layoutStyles();
  const box = shallowRef<"content-box" | "border-box">("content-box");
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <Text
          children="fit"
          data-testid="typography-fitting"
          ellipsis={{
            showTooltip: { opts: { mouseEnterDelay: 0, motion: false } },
          }}
          style={{
            width: box.value === "content-box" ? "40.5px" : "62.5px",
            padding: "0 9px",
            border: "2px solid black",
            boxSizing: box.value,
            display: "block",
          }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    for (const value of ["content-box", "border-box"] as const) {
      box.value = value;
      await settle();
      await settle();
      expect(root.getBoundingClientRect().width).toBe(62.5);
      await page.getByTestId("typography-fitting").hover();
      await settle();
      await settle();
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
    }
  } finally {
    fixture.unmount();
    release();
  }
});

test("Typography copy and link operations remain outside truncated text and preserve original copy content", async () => {
  const release = layoutStyles();
  const copy = vi.spyOn(document, "execCommand").mockReturnValue(true);
  const notify = vi.fn();
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <Text
          children={sentence}
          copyable={{ onCopy: notify }}
          ellipsis={{ suffix: "tail" }}
          link={{ href: "#typography-target" }}
          style={{ width: "190px", display: "block" }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    await expect.poll(() => root.textContent?.includes("...")).toBe(true);
    const trigger = root.querySelector<HTMLElement>('[role="button"]')!;
    expect(trigger.closest('a[href="#typography-target"]')).toBeNull();
    trigger.click();
    expect(copy).toHaveBeenCalledWith("copy");
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0]!.slice(1)).toEqual([sentence, true]);
    await nextTick();
    expect(root.querySelector(".semi-typography-action-copied")).not.toBeNull();
  } finally {
    fixture.unmount();
    copy.mockRestore();
    release();
  }
});

test("Typography JS measurement includes icon and decorated link geometry in its single row budget", async () => {
  const release = layoutStyles();
  const iconWidth = shallowRef(80);
  const style = document.createElement("style");
  style.textContent =
    ".typo-measure-case code{padding:0 12px;border:2px solid; font:18px/24px monospace}.typo-measure-case .semi-typography-icon{margin-right:8px}.typo-measure-case a{font-weight:600}";
  document.head.append(style);
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <Text
          children={sentence}
          code
          ellipsis={{ suffix: "end" }}
          icon={() => (
            <span
              style={{
                display: "inline-block",
                width: `${iconWidth.value}px`,
                height: "12px",
              }}
            >
              Icon
            </span>
          )}
          link={{ href: "#decorated-text" }}
          strong
          style={{ display: "block", width: "320px", lineHeight: "24px" }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    await expect.poll(() => root.textContent!.includes("...")).toBe(true);
    await settle();
    expect(root.querySelector("code")).not.toBeNull();
    expect(
      root.querySelector(".semi-typography-icon")!.getBoundingClientRect()
        .width,
    ).toBeGreaterThanOrEqual(80);
    expect(root.scrollHeight).toBeLessThanOrEqual(28);
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    expect(root.textContent!.endsWith("end")).toBe(true);
    const before = root.textContent!.length;
    expect(before).toBeGreaterThan("Icon...end".length);
    iconWidth.value = 120;
    await expect.poll(() => root.textContent!.length).toBeLessThan(before);
    expect(root.scrollHeight).toBeLessThanOrEqual(28);
    expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  } finally {
    fixture.unmount();
    style.remove();
    release();
  }
});

test("Typography CSS multiline responds to row changes and Popover overflow uses the complete accessible content", async () => {
  const release = layoutStyles();
  const rows = shallowRef(2);
  const content = shallowRef(sentence);
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <button
          data-testid="typography-away"
          style={{ position: "fixed", right: "0", bottom: "0" }}
        >
          Outside
        </button>
        <Paragraph
          children={content.value}
          data-testid="typography-multiline"
          ellipsis={{
            rows: rows.value,
            showTooltip: {
              type: "popover",
              opts: { mouseEnterDelay: 0, mouseLeaveDelay: 0, motion: false },
            },
          }}
          style={{
            width: "200px",
            padding: "4px",
            border: "1px solid black",
            boxSizing: "border-box",
          }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    await expect.poll(() => root.style.webkitLineClamp).toBe("2");
    await expect.poll(() => root.scrollHeight > root.offsetHeight).toBe(true);
    await settle();
    await settle();
    await page.getByTestId("typography-away").hover();
    await page.getByTestId("typography-multiline").hover();
    await settle();
    await expect
      .poll(
        () =>
          document.querySelector(
            ".semi-typography-ellipsis-popover .semi-popover-content",
          )?.textContent,
      )
      .toBe(sentence);
    const height = root.getBoundingClientRect().height;
    rows.value = 3;
    await expect.poll(() => root.style.webkitLineClamp).toBe("3");
    await expect
      .poll(() => root.getBoundingClientRect().height)
      .toBeGreaterThan(height);
    content.value = "fitting";
    await expect.poll(() => root.scrollHeight <= root.offsetHeight).toBe(true);
    await expect
      .poll(() => document.querySelector(".semi-typography-ellipsis-popover"))
      .toBeNull();
    expect(fixture.host.querySelector(".semi-typography")).toBe(root);
    expect(root.textContent).toBe("fitting");
  } finally {
    fixture.unmount();
    release();
  }
});

test("Typography custom tooltip owns its renderer and receives full scalar content only on actual overflow", async () => {
  const release = layoutStyles();
  const content = shallowRef("short");
  const render = vi.fn((value, children) => (
    <aside data-custom-tooltip="">
      {value}
      {children()}
    </aside>
  ));
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case">
        <Text
          children={content.value}
          ellipsis={{ showTooltip: { renderTooltip: render } }}
          style={{ display: "block", width: "160px" }}
        />
      </div>
    )),
  );
  try {
    await settle();
    expect(render).not.toHaveBeenCalled();
    content.value = sentence;
    await expect
      .poll(() => fixture.host.querySelector("[data-custom-tooltip]"))
      .not.toBeNull();
    expect(render.mock.calls[0]?.[0]).toBe(sentence);
    expect(
      fixture.host.querySelector("[data-custom-tooltip] .semi-typography")
        ?.textContent,
    ).toBe(sentence);
    content.value = "short";
    await expect
      .poll(() => fixture.host.querySelector("[data-custom-tooltip]"))
      .toBeNull();
    expect(fixture.host.querySelector(".semi-typography")?.textContent).toBe(
      "short",
    );
  } finally {
    fixture.unmount();
    release();
  }
});

test("Typography remeasures stable icon text character data with a fixed root height", async () => {
  const release = layoutStyles();
  const iconText = document.createTextNode("I");
  const fixture = mountWithIds(
    defineVaporComponent(() => (
      <div class="typo-measure-case" style={{ height: "80px" }}>
        <Text
          children={sentence}
          ellipsis={{ suffix: "!" }}
          icon={() => iconText}
          style={{
            display: "block",
            width: "320px",
            height: "24px",
            overflow: "hidden",
          }}
        />
      </div>
    )),
  );
  try {
    const root = fixture.host.querySelector<HTMLElement>(".semi-typography")!;
    const icon = root.querySelector(".semi-typography-icon")!;
    const text = icon.nextElementSibling!;
    await expect.poll(() => text.textContent!.includes("...")).toBe(true);
    const before = text.textContent!.length;
    iconText.nodeValue = "WWWWWWWWWW";
    expect(icon.firstChild).toBe(iconText);
    await expect.poll(() => text.textContent!.length).toBeLessThan(before);
    expect(root.clientHeight).toBe(24);
    expect(icon.firstChild).toBe(iconText);
  } finally {
    fixture.unmount();
    release();
  }
});
