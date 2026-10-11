import assert from "node:assert/strict";
import { test } from "vitest";
import { checkGridConsumerGraph } from "../resource-consumer/grid-graph-check.mjs";
const identities = {
  "src/components/grid/Row.tsx": "/packed/Row-a.js",
  "src/components/grid/Col.tsx": "/packed/Col-b.js",
};
const resolve = (path, name) => {
  assert.equal(path, `src/components/grid/${name}.tsx`);
  return [identities[path]];
};
test("Grid consumer graph accepts split and shared packed source identities", () => {
  checkGridConsumerGraph(Object.values(identities), resolve);
  checkGridConsumerGraph(
    Object.values(identities).map((id) => ({ id, renderedLength: 12 })),
    resolve,
    { requireRenderedLength: true },
  );
  checkGridConsumerGraph(["/packed/shared.js"], () => ["/packed/shared.js"]);
});
test("Grid consumer graph rejects missing or non-rendered individual implementations", () => {
  for (const missing of ["Row", "Col"]) {
    const modules = Object.entries(identities)
      .filter(([path]) => !path.endsWith(`/${missing}.tsx`))
      .map(([, id]) => id);
    assert.throws(
      () => checkGridConsumerGraph(modules, resolve),
      new RegExp(missing),
    );
    const zero = Object.entries(identities).map(([path, id]) => ({
      id,
      renderedLength: path.endsWith(`/${missing}.tsx`) ? 0 : 12,
    }));
    assert.throws(
      () =>
        checkGridConsumerGraph(zero, resolve, { requireRenderedLength: true }),
      new RegExp(missing),
    );
  }
  assert.throws(
    () => checkGridConsumerGraph(["/packed/grid-plausible-name.js"], resolve),
    /Row/,
  );
  assert.throws(() => checkGridConsumerGraph([], resolve), /empty/i);
});

test("Foundation requires rendered-length objects and cannot accept string identities", () => {
  const foundation = { requireRenderedLength: true };
  const ids = Object.values(identities);
  const rendered = ids.map((id) => ({ id, renderedLength: 12 }));
  checkGridConsumerGraph(rendered, resolve, foundation);
  assert.throws(() => checkGridConsumerGraph(ids, resolve, foundation), /Row/);
  for (const index of [0, 1]) {
    const mixed = rendered.map((entry, position) =>
      position === index ? entry.id : entry,
    );
    assert.throws(
      () => checkGridConsumerGraph(mixed, resolve, foundation),
      new RegExp(index === 0 ? "Row" : "Col"),
    );
  }
});

test("Resource requires string identities and cannot accept object schemas", () => {
  const ids = Object.values(identities);
  const objects = ids.map((id) => ({ id, renderedLength: 12 }));
  assert.throws(() => checkGridConsumerGraph(objects, resolve), /Row/);
  for (const index of [0, 1]) {
    const mixed = ids.map((id, position) =>
      position === index ? objects[index] : id,
    );
    assert.throws(
      () => checkGridConsumerGraph(mixed, resolve),
      new RegExp(index === 0 ? "Row" : "Col"),
    );
  }
});
