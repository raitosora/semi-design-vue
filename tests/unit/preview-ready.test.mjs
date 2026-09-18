import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { waitForPreview } from "../../scripts/preview-ready.mjs";

const url = "http://127.0.0.1:4189/";
function child() {
  return Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
  });
}
function expectClean(process) {
  expect(process.listenerCount("error")).toBe(0);
  expect(process.listenerCount("exit")).toBe(0);
  expect(process.stdout.listenerCount("data")).toBe(0);
  expect(process.stderr.listenerCount("data")).toBe(0);
}

describe("preview readiness", () => {
  it.each([
    [`  Local: ${url}\n`],
    [
      "  Local: \u001b[36mhttp://127.0.0.1:\u001b[1m4189\u001b[22m/\u001b[39m\n",
    ],
    [
      "  Local: \u001b[36mhttp://127.0.",
      "0.1:\u001b[",
      "1m418",
      "9\u001b[22m/\u001b[39m\n",
    ],
  ])(
    "accepts Vite URLs across color and chunk boundaries (%#)",
    async (...chunks) => {
      const process = child();
      const ready = waitForPreview(process, url);
      for (const chunk of chunks) process.stdout.write(chunk);
      await ready;
      expectClean(process);
    },
  );

  it("does not treat an unrelated port message as readiness", async () => {
    const process = child();
    const ready = waitForPreview(process, url);
    const rejected = expect(ready).rejects.toThrow(/exited.*1/);
    process.stdout.write("Port :4189 is unavailable\n");
    process.stderr.write("\u001b[31mEADDRINUSE\u001b[39m");
    process.emit("exit", 1);
    await rejected;
    await expect(ready).rejects.toThrow(/EADDRINUSE/);
    expectClean(process);
  });

  it("reports spawn errors and removes readiness listeners", async () => {
    const process = child();
    const ready = waitForPreview(process, url);
    const rejected = expect(ready).rejects.toThrow("spawn denied");
    process.emit("error", new Error("spawn denied"));
    await rejected;
    expectClean(process);
  });

  it("times out without a URL and includes bounded stderr diagnostics", async () => {
    vi.useFakeTimers();
    try {
      const process = child();
      const ready = waitForPreview(process, url, { timeout: 100 });
      const rejected = expect(ready).rejects.toThrow(
        /Timed out.*config failed/s,
      );
      process.stderr.write("x".repeat(10_000) + "config failed");
      await vi.advanceTimersByTimeAsync(100);
      await rejected;
      expectClean(process);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
