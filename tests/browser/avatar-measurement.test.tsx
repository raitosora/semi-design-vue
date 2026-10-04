import { defineVaporComponent, nextTick, shallowRef } from "vue";
import { expect, test, vi } from "vitest";
import Avatar from "../../packages/semi-ui-vue/src/components/avatar/Avatar.js";
import { mountVapor } from "../support/mount-vapor.js";

// Explicit layout isolates geometry from theme selection; no dimensions are mocked.
function geometryStyle() {
  const style = document.createElement("style");
  style.textContent =
    ".avatar-geometry .semi-avatar{display:inline-block;position:relative}.avatar-geometry .semi-avatar-content{display:inline-block;white-space:nowrap;transform-origin:center}.avatar-geometry .semi-avatar-label{display:inline-block;white-space:nowrap}";
  document.head.append(style);
  return style;
}
const root = (host: HTMLElement) =>
  host.querySelector<HTMLElement>(".semi-avatar")!;
const label = (host: HTMLElement) =>
  host.querySelector<HTMLElement>(".semi-avatar-label")!;
const scale = (host: HTMLElement) => {
  const transform = getComputedStyle(
    host.querySelector<HTMLElement>(".semi-avatar-content")!,
  ).transform;
  return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
};
async function expectMeasured(host: HTMLElement, gap: number) {
  await expect
    .poll(() => scale(host))
    .toBeCloseTo(
      Math.min(1, (root(host).offsetWidth - gap * 2) / label(host).offsetWidth),
      4,
    );
  expect(label(host).getBoundingClientRect().width).toBeCloseTo(
    label(host).offsetWidth * scale(host),
    0,
  );
  expect(host.querySelectorAll(".semi-avatar-label")).toHaveLength(1);
}

test("Avatar measures real zero-size recovery, content changes, ancestor visibility and container width", async () => {
  const css = geometryStyle();
  const hidden = shallowRef(true);
  const text = shallowRef("MMMMMMMMMM");
  const width = shallowRef(50);
  const f = mountVapor(
    defineVaporComponent(() => (
      <div
        class="avatar-geometry"
        style={{
          display: hidden.value ? "none" : "block",
          width: `${width.value}px`,
        }}
      >
        <Avatar
          children={text.value}
          size="100%"
          style={{ font: "20px monospace" }}
        />
      </div>
    )),
  );
  try {
    expect(root(f.host).offsetWidth).toBe(0);
    expect(Number.isFinite(scale(f.host))).toBe(true);
    hidden.value = false;
    await nextTick();
    await expectMeasured(f.host, 3);
    expect(scale(f.host)).toBeLessThan(1);
    const original = label(f.host);
    width.value = 80;
    await nextTick();
    await expectMeasured(f.host, 3);
    text.value = "I";
    await nextTick();
    await expectMeasured(f.host, 3);
    expect(scale(f.host)).toBe(1);
    text.value = "MMMMMMMMMM";
    hidden.value = true;
    await nextTick();
    hidden.value = false;
    await nextTick();
    await expectMeasured(f.host, 3);
    expect(label(f.host)).toBe(original);
  } finally {
    f.unmount();
    css.remove();
  }
});

test("Avatar gap and exact integer width boundaries use finite real text metrics", async () => {
  const css = geometryStyle();
  const width = shallowRef(60);
  const gap = shallowRef(3);
  const f = mountVapor(
    defineVaporComponent(() => (
      <div class="avatar-geometry">
        <Avatar
          children="MMMMMMMM"
          gap={gap.value}
          size={`${width.value}px`}
          style={{ font: "20px monospace" }}
        />
      </div>
    )),
  );
  try {
    await expectMeasured(f.host, 3);
    width.value = label(f.host).offsetWidth + 6;
    await nextTick();
    await expectMeasured(f.host, 3);
    expect(scale(f.host)).toBe(1);
    width.value -= 1;
    await nextTick();
    await expectMeasured(f.host, 3);
    expect(scale(f.host)).toBeLessThan(1);
    gap.value = 9;
    await nextTick();
    await expectMeasured(f.host, 9);
    const previous = scale(f.host);
    gap.value = width.value / 2;
    await nextTick();
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    expect(scale(f.host)).toBeCloseTo(previous, 4);
    gap.value = 0;
    await nextTick();
    await expectMeasured(f.host, 0);
  } finally {
    f.unmount();
    css.remove();
  }
});

test("Avatar font download changes calibrated text geometry without synthetic font events", async () => {
  const css = geometryStyle();
  const source = `url(${new URL("../../node_modules/vitepress/dist/client/theme-default/fonts/inter-roman-latin.woff2", import.meta.url).href})`;
  const calibration = new FontFace("AvatarCalibration", source);
  const face = new FontFace("AvatarLoaded", source);
  const probe = document.createElement("span");
  probe.textContent = "iiiiiiii";
  probe.style.cssText =
    "position:absolute;visibility:hidden;display:inline-block;white-space:nowrap;font:20px monospace";
  document.body.append(probe);
  const fallbackWidth = probe.offsetWidth;
  await calibration.load();
  document.fonts.add(calibration);
  probe.style.fontFamily = "AvatarCalibration, monospace";
  const loadedWidth = probe.offsetWidth;
  probe.remove();
  document.fonts.delete(calibration);
  expect(loadedWidth).toBeLessThan(fallbackWidth);
  const width = Math.floor((fallbackWidth + loadedWidth) / 2) + 6;
  const font = shallowRef("20px monospace");
  const events = vi.fn();
  document.fonts.addEventListener("loadingdone", events);
  const f = mountVapor(
    defineVaporComponent(() => (
      <div class="avatar-geometry">
        <Avatar
          children="iiiiiiii"
          size={`${width}px`}
          style={{ font: font.value }}
        />
      </div>
    )),
  );
  try {
    await expectMeasured(f.host, 3);
    expect(label(f.host).offsetWidth).toBe(fallbackWidth);
    expect(scale(f.host)).toBeLessThan(1);
    document.fonts.add(face);
    font.value = "20px AvatarLoaded, monospace";
    await nextTick();
    expect(
      await document.fonts.load("20px AvatarLoaded", "iiiiiiii"),
    ).toContain(face);
    await document.fonts.ready;
    await expect
      .poll(() =>
        events.mock.calls.some(([event]) =>
          (event as FontFaceSetLoadEvent).fontfaces.includes(face),
        ),
      )
      .toBe(true);
    await expectMeasured(f.host, 3);
    expect(label(f.host).offsetWidth).toBe(loadedWidth);
    expect(scale(f.host)).toBe(1);
    console.info(
      "Avatar calibrated font geometry",
      JSON.stringify({ fallbackWidth, loadedWidth, width }),
    );
  } finally {
    f.unmount();
    css.remove();
    document.fonts.delete(face);
    document.fonts.removeEventListener("loadingdone", events);
  }
});

test("Avatar native text fragment keeps slot ownership and identity without measurement copies", async () => {
  const text = shallowRef("MMMMMMMMMM");
  const slot = vi.fn(() => <>{text.value}</>);
  const f = mountVapor(
    defineVaporComponent(() => <Avatar size="50px">{slot}</Avatar>),
  );
  try {
    const walker = document.createTreeWalker(
      root(f.host),
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          node.textContent
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT,
      },
    );
    const textNode = walker.nextNode();
    expect(textNode?.textContent).toBe("MMMMMMMMMM");
    expect(walker.nextNode()).toBeNull();
    expect(slot).toHaveBeenCalledTimes(1);
    text.value = "I";
    await nextTick();
    expect(textNode?.textContent).toBe("I");
    expect(root(f.host).contains(textNode)).toBe(true);
    expect(f.host.textContent).toBe("I");
    expect(f.host.querySelectorAll(".semi-avatar-label")).toHaveLength(0);
  } finally {
    f.unmount();
  }
});

test("Avatar newly visible image fallback text receives its initial geometry measurement", async () => {
  const css = geometryStyle();
  const f = mountVapor(
    defineVaporComponent(() => (
      <div class="avatar-geometry">
        <Avatar
          children="MMMMMMMMMM"
          size="50px"
          src="data:image/png;base64,aW52YWxpZA=="
          style={{ font: "20px monospace" }}
        />
      </div>
    )),
  );
  try {
    await expect
      .poll(() => f.host.querySelector(".semi-avatar-label") !== null)
      .toBe(true);
    await expectMeasured(f.host, 3);
    expect(scale(f.host)).toBeLessThan(1);
    expect(f.host.querySelector("img")).toBeNull();
  } finally {
    f.unmount();
    css.remove();
  }
});
