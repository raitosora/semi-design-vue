import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { typographyChecks } from "./typography-checks";
for (const port of ["4180", "4181"]) {
  typographyChecks(
    port,
    `http://127.0.0.1:${port}/zh-CN/components/typography.html`,
  );
  test(`${port}: Typography copy license retains every upstream MIT byte`, async ({
    request,
  }) => {
    const response = await request.get(
      `http://127.0.0.1:${port}/licenses/copy-text-to-clipboard-2.2.0-MIT.txt`,
    );
    expect(response.status()).toBe(200);
    const bytes = await response.body();
    expect(bytes.byteLength).toBe(1117);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      "5c932d88256b4ab958f64a856fa48e8bd1f55bc1d96b8149c65689e0c61789d3",
    );
  });
}
