import assert from "node:assert/strict";
import { expect } from "@playwright/test";
export async function checkFoundationTimeline(page, mode) {
  const timeline = page.locator("[data-foundation-timeline]");
  await expect(timeline.locator(".semi-timeline-item-content-time")).toHaveText(
    "Foundation Timeline",
  );
  await expect(timeline.locator(":scope > li")).toHaveCount(1);
  await expect(timeline).toHaveAttribute("aria-label", "Foundation events");
  await expect(timeline).not.toHaveAttribute("role");
  await expect(timeline).not.toHaveAttribute("aria-live");
  await expect(timeline.locator(".semi-timeline-item-head")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const data = page.locator("[data-foundation-timeline-data]");
  await expect(data.locator(":scope > li")).toHaveCount(2);
  await expect(data.locator("li").last()).toHaveText("0");
  const input = timeline.getByRole("textbox", { name: "Timeline body input" });
  const identity = await input.elementHandle();
  await input.fill("kept timeline state");
  await page.locator("#timeline-update").evaluate((node) => node.click());
  await expect(timeline.locator(".semi-timeline-item-content-time")).toHaveText(
    "Updated Timeline",
  );
  await expect(input).toHaveValue("kept timeline state");
  await expect(input).toBeFocused();
  assert(
    await input.evaluate((node, before) => node === before, identity),
    `${mode} Timeline time update replaced content`,
  );
  await expect(page.locator("#timeline-mounts")).toHaveText("1");
  await expect(page.locator("#timeline-unmounts")).toHaveText("0");
  return timeline;
}
export function checkTimelineFoundationGraph(
  graph,
  consumer,
  implementationChunks,
) {
  for (const [file, name] of [
    ["Timeline", "Timeline"],
    ["item", "default"],
  ]) {
    const chunks = implementationChunks(
      consumer,
      `src/components/timeline/${file}.tsx`,
      name,
    );
    assert(
      graph.modules.some(
        ({ id, renderedLength }) => chunks.includes(id) && renderedLength > 0,
      ),
      `Packed ${name} missing from Foundation graph`,
    );
  }
  assert(
    graph.modules.some(({ id }) =>
      /semi-ui-vue\/dist\/styles\/components\/timeline\.css$/.test(id),
    ),
    "Packed Timeline stylesheet missing from Foundation graph",
  );
}
