import { expect, test, vi } from "vitest";
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import TextArea from "../../packages/semi-ui-vue/src/components/input/textarea.js";
import type { TextAreaProps } from "../../packages/semi-ui-vue/src/components/input/textarea-types.js";
import {
  measureTextarea,
  wrappedLines,
} from "../../packages/semi-ui-vue/src/components/input/textarea-measure.js";
import { mountVapor } from "../support/mount-vapor.js";
import { installResourceTracker } from "../support/resource-tracker.js";

const style = {
  width: "180px",
  boxSizing: "border-box",
  padding: "4px",
  border: "1px solid black",
  fontFamily: "monospace",
  fontSize: "14px",
  lineHeight: "20px",
} as const;

test("TextArea autosize measures actual content, limits, placeholder, container and hidden recovery", async () => {
  const current = shallowRef<TextAreaProps>({
    autosize: { minRows: 2, maxRows: 4 },
    value: "one",
    textareaStyle: style,
  });
  const hidden = ref(false);
  const sizes: { height: number; width?: number }[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <div style={{ display: hidden.value ? "none" : "block" }}>
        <TextArea {...current.value} onResize={(size) => sizes.push(size)} />
      </div>
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    await expect.poll(() => node.style.height).toBe("50px");
    expect(node.style.resize).toBe("none");
    current.value = { ...current.value, value: "1\n2\n3\n4\n5\n6" };
    await nextTick();
    await expect.poll(() => node.style.height).toBe("90px");
    expect(node.scrollHeight).toBeGreaterThan(node.clientHeight);
    current.value = { ...current.value, value: "", placeholder: "a\nb\nc" };
    await nextTick();
    await expect.poll(() => node.style.height).toBe("70px");
    hidden.value = true;
    await nextTick();
    expect(node.getBoundingClientRect().height).toBe(0);
    hidden.value = false;
    await nextTick();
    await expect.poll(() => node.getBoundingClientRect().height).toBe(70);
    current.value = {
      ...current.value,
      autosize: true,
      rows: 1,
      value: "A long unbroken line that should wrap repeatedly when narrowed",
      textareaStyle: { ...style, width: "100px" },
    };
    await nextTick();
    await expect
      .poll(() => node.getBoundingClientRect().height)
      .toBeGreaterThan(90);
    expect(sizes.length).toBeGreaterThan(2);
    expect(sizes.every((size) => !Object.hasOwn(size, "width"))).toBe(true);
    expect(document.querySelector('textarea[aria-hidden="true"]')).toBe(null);
  } finally {
    mounted.unmount();
  }
});

test("TextArea native resize opts in, skips initial delivery and reports content dimensions", async () => {
  const sizes: { height: number; width?: number }[] = [];
  const current = shallowRef<TextAreaProps>({
    resize: "both",
    textareaStyle: { ...style, height: "80px" },
  });
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea {...current.value} onResize={(size) => sizes.push(size)} />
    )),
  );
  try {
    const node = mounted.host.querySelector("textarea")!;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    expect(sizes).toEqual([]);
    expect(node.style.resize).toBe("both");
    expect(
      mounted.host.firstElementChild?.classList.contains(
        "semi-input-textarea-wrapper-resizeX",
      ),
    ).toBe(true);
    expect(
      mounted.host.firstElementChild?.classList.contains(
        "semi-input-textarea-wrapper-resizeY",
      ),
    ).toBe(true);
    node.style.width = "240px";
    node.style.height = "120px";
    await expect.poll(() => sizes.at(-1)).toEqual({ width: 230, height: 110 });
    current.value = { textareaStyle: { ...style, resize: "vertical" } };
    await nextTick();
    expect(node.style.resize).toBe("vertical");
    const count = sizes.length;
    node.style.width = "250px";
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    expect(sizes).toHaveLength(count);
  } finally {
    mounted.unmount();
  }
});

test("TextArea line numbers follow wrapping, scroll, dynamic content and remount", async () => {
  const value = ref("first\nsecond\nthird\nfourth\nfifth\nsixth");
  const show = ref(true);
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <>
        <style>{`.semi-input-textarea-lineNumber { overflow: hidden; } .semi-input-textarea-lineNumber-item { box-sizing: border-box; }`}</style>
        <TextArea
          lineNumberStart={7}
          showLineNumber={show.value}
          textareaStyle={{ ...style, height: "50px" }}
          value={value.value}
        />
      </>
    )),
  );
  try {
    let node = mounted.host.querySelector("textarea")!;
    let panel = mounted.host.querySelector<HTMLElement>(
      ".semi-input-textarea-lineNumber",
    )!;
    await expect.poll(() => panel.style.height).not.toBe("");
    expect([...panel.children].map((item) => item.textContent)).toEqual([
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ]);
    node.scrollTop = 40;
    node.dispatchEvent(new Event("scroll"));
    await expect.poll(() => panel.scrollTop).toBe(node.scrollTop);
    value.value =
      "A long unbroken line that wraps around the textarea width several times\nend";
    await nextTick();
    expect(panel.children).toHaveLength(2);
    expect(
      parseFloat((panel.firstElementChild as HTMLElement).style.minHeight),
    ).toBeGreaterThan(20);
    show.value = false;
    await nextTick();
    expect(mounted.host.querySelector(".semi-input-textarea-lineNumber")).toBe(
      null,
    );
    show.value = true;
    await nextTick();
    node = mounted.host.querySelector("textarea")!;
    panel = mounted.host.querySelector<HTMLElement>(
      ".semi-input-textarea-lineNumber",
    )!;
    expect(node.value).toBe(value.value);
    expect(panel.children).toHaveLength(2);
  } finally {
    mounted.unmount();
  }
});

test("TextArea measures both box models and fallback line heights without retained DOM", () => {
  const node = document.createElement("textarea");
  Object.assign(node.style, style);
  node.value = "a\nb";
  document.body.append(node);
  try {
    expect(measureTextarea(node, 1)).toBe(50);
    node.style.boxSizing = "content-box";
    expect(measureTextarea(node, 1)).toBe(40);
    expect(wrappedLines("", node)).toBe(1);
    node.style.width = "0px";
    expect(wrappedLines("long", node)).toBe(1);
    const context = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);
    try {
      expect(wrappedLines("text", node)).toBe(1);
    } finally {
      context.mockRestore();
    }
  } finally {
    node.remove();
  }
  expect(document.querySelector('textarea[aria-hidden="true"]')).toBe(null);
});

test("TextArea releases actual observations, throttle and pending scroll frame on unmount", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const current = shallowRef<TextAreaProps>({
    showLineNumber: true,
    resize: "both",
    defaultValue: "a\nb\nc\nd\ne",
    textareaStyle: { ...style, height: "50px" },
  });
  const sizes: unknown[] = [];
  const app = createVaporApp(
    defineVaporComponent(() => (
      <TextArea {...current.value} onResize={(value) => sizes.push(value)} />
    )),
  );
  const tracker = installResourceTracker(window, document);
  let mounted = false;
  try {
    app.mount(host);
    mounted = true;
    await nextTick();
    const node = host.querySelector("textarea")!;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    node.scrollTop = 20;
    node.dispatchEvent(new Event("scroll"));
    node.style.width = "200px";
    current.value = { ...current.value, autosize: true };
    await nextTick();
    app.unmount();
    mounted = false;
    tracker.assertClean();
    const count = sizes.length;
    await nextTick();
    expect(sizes).toHaveLength(count);
    expect(host.children).toHaveLength(0);
  } finally {
    if (mounted) app.unmount();
    tracker.restore();
    host.remove();
  }
});

test("TextArea reapplies autosize after line-number remount and native resize", async () => {
  const current = shallowRef<TextAreaProps>({
    autosize: { minRows: 2 },
    showLineNumber: false,
    value: "one",
    textareaStyle: style,
  });
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea {...current.value} />),
  );
  try {
    const first = mounted.host.querySelector("textarea")!;
    await expect.poll(() => first.style.height).toBe("50px");
    current.value = { ...current.value, showLineNumber: true };
    await nextTick();
    const node = mounted.host.querySelector("textarea")!;
    expect(node).not.toBe(first);
    await expect.poll(() => node.style.height).toBe("50px");
    current.value = { ...current.value, autosize: false, resize: "vertical" };
    await nextTick();
    node.style.height = "200px";
    current.value = { ...current.value, autosize: { minRows: 2 } };
    await nextTick();
    await expect.poll(() => node.style.height).toBe("50px");
  } finally {
    mounted.unmount();
  }
});

test("TextArea ignores captured late observer, throttle and frame callbacks after unmount", async () => {
  const OriginalResize = window.ResizeObserver;
  const observations: {
    callback: ResizeObserverCallback;
    observer: ResizeObserver;
    entries: ResizeObserverEntry[];
  }[] = [];
  class RecordedResize extends OriginalResize {
    constructor(callback: ResizeObserverCallback) {
      let record: (typeof observations)[number];
      super((entries, observer) => {
        record.entries = entries;
        callback(entries, observer);
      });
      record = { callback, observer: this, entries: [] };
      observations.push(record);
    }
  }
  const resizeSpy = vi
    .spyOn(window, "ResizeObserver")
    .mockImplementation(RecordedResize);
  const sizes: unknown[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        defaultValue="a\nb\nc\nd"
        onResize={(size) => sizes.push(size)}
        resize="both"
        showLineNumber
        textareaStyle={{ ...style, height: "50px" }}
      />
    )),
  );
  let disposed = false;
  const timeout = window.setTimeout.bind(window);
  const frame = window.requestAnimationFrame.bind(window);
  const pendingTimers: (() => void)[] = [];
  const pendingFrames: FrameRequestCallback[] = [];
  const timerSpy = vi.spyOn(window, "setTimeout").mockImplementation(((
    callback: TimerHandler,
    delay?: number,
    ...args: unknown[]
  ) => {
    if (typeof callback === "function" && (delay ?? 0) <= 10)
      pendingTimers.push(() => callback(...args));
    return timeout(callback, delay, ...args);
  }) as typeof window.setTimeout);
  const frameSpy = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback) => {
      pendingFrames.push(callback);
      return frame(callback);
    });
  const clearSpy = vi.spyOn(window, "clearTimeout");
  const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
  try {
    await nextTick();
    await expect
      .poll(() => observations.some((item) => item.entries.length))
      .toBe(true);
    const observation = observations.find((item) => item.entries.length)!;
    observation.callback(observation.entries, observation.observer);
    observation.callback(observation.entries, observation.observer);
    const node = mounted.host.querySelector("textarea")!;
    node.scrollTop = 20;
    node.dispatchEvent(new Event("scroll"));
    expect(pendingTimers.length).toBeGreaterThan(0);
    expect(pendingFrames.length).toBeGreaterThan(0);
    mounted.unmount();
    disposed = true;
    expect(clearSpy).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
    const count = sizes.length;
    for (const item of observations) item.callback(item.entries, item.observer);
    for (const callback of pendingTimers) callback();
    for (const callback of pendingFrames) callback(0);
    expect(sizes).toHaveLength(count);
  } finally {
    if (!disposed) mounted.unmount();
    resizeSpy.mockRestore();
    timerSpy.mockRestore();
    frameSpy.mockRestore();
    clearSpy.mockRestore();
    cancelSpy.mockRestore();
  }
});

test("TextArea reactive native dimensions notify without resetting the resize baseline", async () => {
  const sizes: { height: number; width?: number }[] = [];
  const current = shallowRef<TextAreaProps>({
    resize: "both",
    textareaStyle: { ...style, height: "80px" },
  });
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea {...current.value} onResize={(size) => sizes.push(size)} />
    )),
  );
  try {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    expect(sizes).toEqual([]);
    current.value = {
      ...current.value,
      textareaStyle: { ...style, width: "240px", height: "120px" },
    };
    await nextTick();
    await expect.poll(() => sizes.at(-1)).toEqual({ width: 230, height: 110 });
  } finally {
    mounted.unmount();
  }
});

test("TextArea line metrics follow reactive styles while viewport dimensions stay fixed", async () => {
  const current = shallowRef<TextAreaProps>({
    showLineNumber: true,
    value: "first\nsecond",
    textareaStyle: { ...style, height: "80px" },
  });
  const mounted = mountVapor(
    defineVaporComponent(() => <TextArea {...current.value} />),
  );
  try {
    const item = () =>
      mounted.host.querySelector<HTMLElement>(
        ".semi-input-textarea-lineNumber-item",
      )!;
    await expect.poll(() => item().style.lineHeight).toBe("20px");
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    current.value = {
      ...current.value,
      textareaStyle: { ...style, height: "80px", lineHeight: "30px" },
    };
    await nextTick();
    await expect.poll(() => item().style.lineHeight).toBe("30px");
  } finally {
    mounted.unmount();
  }
});

test("TextArea replacement cancels pending native resize and establishes a fresh baseline", async () => {
  const observations: {
    callback: ResizeObserverCallback;
    target?: Element;
    observer: ResizeObserver;
  }[] = [];
  const resizeSpy = vi
    .spyOn(window, "ResizeObserver")
    .mockImplementation(function (callback) {
      const record: (typeof observations)[number] = {
        callback,
        observer: {
          observe(target: Element) {
            record.target = target;
          },
          unobserve() {},
          disconnect() {},
        },
      };
      observations.push(record);
      return record.observer;
    });
  const current = shallowRef(false);
  const sizes: { width?: number; height: number }[] = [];
  const mounted = mountVapor(
    defineVaporComponent(() => (
      <TextArea
        onResize={(size) => sizes.push(size)}
        resize="both"
        showLineNumber={current.value}
        textareaStyle={{ ...style, height: "80px" }}
      />
    )),
  );
  const deliver = (width: number) => {
    const record = observations.at(-1)!;
    record.callback(
      [
        {
          target: record.target!,
          contentRect: { width, height: 70 },
        } as ResizeObserverEntry,
      ],
      record.observer,
    );
  };
  try {
    await nextTick();
    const first = mounted.host.querySelector("textarea")!;
    deliver(170);
    deliver(230);
    current.value = true;
    await nextTick();
    expect(mounted.host.querySelector("textarea")).not.toBe(first);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sizes).toEqual([]);
    deliver(170);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sizes).toEqual([]);
    deliver(240);
    expect(sizes).toEqual([{ width: 240, height: 70 }]);
  } finally {
    mounted.unmount();
    resizeSpy.mockRestore();
  }
});
