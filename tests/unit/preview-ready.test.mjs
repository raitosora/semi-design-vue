import { spawn } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { waitForPreview, stopPreview } from "../../scripts/preview-ready.mjs";

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

describe("preview cleanup", () => {
  let children = [];
  afterEach(async () => {
    await Promise.all(
      children.map((child) => {
        if (child.exitCode != null || child.signalCode != null)
          return undefined;
        return new Promise((resolve) => {
          child.once("close", resolve);
          child.kill("SIGKILL");
        });
      }),
    );
    children = [];
  });
  it("waits for the real preview child to close when browser startup fails", async () => {
    const process = spawn(
      globalThis.process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      { stdio: "ignore" },
    );
    children = [...children, process];
    let closed = false;
    process.once("close", () => {
      closed = true;
    });
    await expect(
      (async () => {
        try {
          throw new Error("browser launch failure");
        } finally {
          await stopPreview(process);
        }
      })(),
    ).rejects.toThrow("browser launch failure");
    expect(closed).toBe(true);
  });

  it("escalates an ignored SIGTERM and awaits the real child close", async () => {
    const process = spawn(
      globalThis.process.execPath,
      [
        "-e",
        "process.on('SIGTERM', () => {}); process.stdout.write('ready'); setInterval(() => {}, 1000)",
      ],
      { stdio: ["ignore", "pipe", "ignore"] },
    );
    children = [...children, process];
    await once(process.stdout, "data");
    await stopPreview(process, { timeout: 50 });
    expect(process.signalCode).toBe("SIGKILL");
  });

  it("handles already exited and failed-to-spawn children", async () => {
    await stopPreview({ pid: undefined });
    await stopPreview({ pid: 123, exitCode: 0, signalCode: null });
    await stopPreview({ pid: 123, exitCode: null, signalCode: "SIGTERM" });
  });

  it("reports a child which never acknowledges either shutdown signal", async () => {
    vi.useFakeTimers();
    try {
      const process = Object.assign(new EventEmitter(), {
        pid: 123,
        exitCode: null,
        signalCode: null,
        kill: vi.fn(),
      });
      const stopping = stopPreview(process, { timeout: 100 });
      const failed = expect(stopping).rejects.toThrow(
        "did not close after SIGKILL",
      );
      await vi.advanceTimersByTimeAsync(200);
      await failed;
      expect(process.kill.mock.calls).toEqual([["SIGTERM"], ["SIGKILL"]]);
      expect(process.listenerCount("close")).toBe(0);
      expect(process.listenerCount("error")).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports shutdown errors and removes shutdown listeners", async () => {
    const process = Object.assign(new EventEmitter(), {
      pid: 123,
      exitCode: null,
      signalCode: null,
      kill() {
        this.emit("error", new Error("kill denied"));
      },
    });
    await expect(stopPreview(process)).rejects.toThrow("kill denied");
    expect(process.listenerCount("close")).toBe(0);
    expect(process.listenerCount("error")).toBe(0);
  });
});
