import { expect, test } from "vitest";
import { createVaporApp, defineVaporComponent, nextTick } from "vue";
import {
  createDomRef,
  getScrollParents,
} from "../../packages/semi-ui-vue/src/dom/elements.js";

test("uses explicit DOM assignments without resolving component roots", async () => {
  const ref = createDomRef<HTMLButtonElement>();
  const Probe = defineVaporComponent(() => (
    <>
      <button ref={ref.set}>first</button>
      <button ref={ref.set}>second</button>
    </>
  ));
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(Probe);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    expect(ref.element.value?.textContent).toBe("second");
    app.unmount();
    mounted = false;
    await nextTick();
    expect(ref.element.value).toBeNull();
  } finally {
    if (mounted) app.unmount();
    host.remove();
  }
});

test("finds actual scrolling ancestors across a shadow boundary", () => {
  const outer = document.createElement("div");
  outer.style.overflow = "auto";
  const shadowHost = document.createElement("div");
  const shadow = shadowHost.attachShadow({ mode: "open" });
  const inner = document.createElement("div");
  inner.style.overflowY = "scroll";
  const target = document.createElement("button");
  Object.defineProperties(outer, {
    scrollHeight: { value: 20 },
    clientHeight: { value: 10 },
  });
  Object.defineProperties(inner, {
    scrollHeight: { value: 20 },
    clientHeight: { value: 10 },
  });
  inner.append(target);
  shadow.append(inner);
  outer.append(shadowHost);
  document.body.append(outer);
  try {
    expect(getScrollParents(target)).toEqual([inner, outer, window]);
    expect(getScrollParents(null)).toEqual([]);
  } finally {
    outer.remove();
  }
});

test("finds a scrolling ancestor reached through an assigned slot", () => {
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const scroll = document.createElement("div");
  scroll.style.cssText = "overflow: auto; width: 40px; height: 20px;";
  const slot = document.createElement("slot");
  scroll.append(slot);
  shadow.append(scroll);
  const target = document.createElement("button");
  target.style.cssText = "display: block; width: 80px; height: 40px;";
  host.append(target);
  document.body.append(host);
  try {
    expect(target.assignedSlot).toBe(slot);
    expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    expect(getScrollParents(target)).toEqual([scroll, window]);
  } finally {
    host.remove();
  }
});

test("uses the target owner realm for an iframe", () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  try {
    const frameDocument = frame.contentDocument!;
    const target = frameDocument.createElement("button");
    frameDocument.body.append(target);
    expect(getScrollParents(target)).toEqual([frame.contentWindow]);
  } finally {
    frame.remove();
  }
});
