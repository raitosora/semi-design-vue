import assert from "node:assert/strict";

// Resource graphs list modules present in emitted chunks. Foundation graphs
// also retain renderedLength, which must stay positive. Source identities are resolved
// by the caller against the installed tarball metadata and hashed map snapshots.
export function checkGridConsumerGraph(
  modules,
  implementationChunks,
  { requireRenderedLength = false } = {},
) {
  assert(modules.length > 0, "Grid consumer graph is empty");
  for (const name of ["Row", "Col"]) {
    const chunks = implementationChunks(
      `src/components/grid/${name}.tsx`,
      name,
    );
    assert(
      modules.some((entry) =>
        requireRenderedLength
          ? typeof entry === "object" &&
            entry !== null &&
            chunks.includes(entry.id) &&
            entry.renderedLength > 0
          : typeof entry === "string" && chunks.includes(entry),
      ),
      `Packed Grid ${name} implementation missing from consumer graph`,
    );
  }
}
