import { stripVTControlCharacters } from "node:util";

/** Vite colors the port independently and stdout may split escape sequences. */
export function waitForPreview(child, url, { timeout = 15_000 } = {}) {
  return new Promise((resolve, reject) => {
    let output = "";
    let diagnostics = "";
    const finish = (error) => {
      clearTimeout(timer);
      child.stdout.off("data", onOutput);
      child.stderr.off("data", onDiagnostics);
      child.off("error", onError);
      child.off("exit", onExit);
      if (error) reject(error);
      else resolve();
    };
    const onOutput = (chunk) => {
      output = (output + chunk.toString()).slice(-8192);
      if (stripVTControlCharacters(output).includes(url)) finish();
    };
    const onDiagnostics = (chunk) => {
      diagnostics = (diagnostics + chunk.toString()).slice(-8192);
    };
    const failure = (message) =>
      new Error(`${message}\n${stripVTControlCharacters(diagnostics)}`);
    const onError = (error) => finish(error);
    const onExit = (code) => finish(failure(`Preview exited: ${code}`));
    const timer = setTimeout(
      () => finish(failure(`Timed out waiting for ${url} preview`)),
      timeout,
    );
    child.stdout.on("data", onOutput);
    child.stderr.on("data", onDiagnostics);
    child.once("error", onError);
    child.once("exit", onExit);
  });
}

/** Do not remove an isolated consumer until its preview process has closed. */
export async function stopPreview(child, { timeout = 2_000 } = {}) {
  if (!child.pid || child.exitCode != null || child.signalCode != null) return;
  await new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      clearTimeout(timer);
      child.off("close", onClose);
      child.off("error", onError);
      if (error) reject(error);
      else resolve();
    };
    const onClose = () => finish();
    const onError = (error) => finish(error);
    child.once("close", onClose);
    child.once("error", onError);
    const signal = (value) => {
      try {
        child.kill(value);
      } catch (error) {
        finish(error);
      }
    };
    timer = setTimeout(() => {
      timer = setTimeout(
        () => finish(new Error("Preview did not close after SIGKILL")),
        timeout,
      );
      signal("SIGKILL");
    }, timeout);
    signal("SIGTERM");
  });
}
