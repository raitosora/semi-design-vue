import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { expect, test } from "vitest";
import { avatarScale } from "../../packages/semi-ui-vue/src/components/avatar/input.ts";

const snapshot = JSON.parse(
  await readFile("resources/upstream/sources.json", "utf8"),
);
const source = snapshot.files["packages/semi-foundation/avatar/foundation.ts"];
const hash = "413c2c16ada2985488a1a0b18165ef2ead8a4c265c529e3e19079c11080aca4d";
const record = { exports: {} };
const realm = createContext({
  exports: record.exports,
  module: record,
  require(name) {
    if (name === "../base/foundation")
      return {
        __esModule: true,
        default: class TestOnlyAdapter {
          constructor(adapter) {
            this._adapter = adapter;
          }
          getProps() {
            return this._adapter.getProps();
          }
        },
      };
    if (name === "../utils/warning")
      return {
        __esModule: true,
        default: () => {
          throw new Error("Unexpected warning in supported upstream path");
        },
      };
    throw new Error(`Unexpected upstream import: ${name}`);
  },
});
runInContext(
  ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText,
  realm,
  { timeout: 1000 },
);
const Foundation = record.exports.default;

test("Avatar private text arithmetic matches the fixed Foundation for zero, fit and overflow boundaries", () => {
  expect(createHash("sha256").update(source).digest("hex")).toBe(hash);
  for (const width of [0, 6, 20, 32, 48, 128])
    for (const text of [0, 6, 20, 42, 48, 160])
      for (const gap of [0, 3, 24]) {
        let reference = 0.7;
        const foundation = new Foundation({
          getProps: () => ({ children: "AB", gap }),
          getAvatarNode: () => ({
            offsetWidth: width,
            firstChild: { offsetWidth: text },
          }),
          setScale: (value) => {
            reference = value;
          },
        });
        foundation.init();
        expect(
          avatarScale(width, text, gap, 0.7),
          JSON.stringify({ width, text, gap }),
        ).toBe(reference);
      }
});

test("fixed Avatar Foundation calls the decision without arguments before fallback and only false cancels", () => {
  for (const result of [undefined, true, false, null, 0, ""]) {
    const calls = [];
    const foundation = new Foundation({
      getProps: () => ({
        onError: (...args) => {
          calls.push(["error", args]);
          return result;
        },
      }),
      notifyImgState: (value) => calls.push(["fallback", value]),
    });
    foundation.handleImgLoadError();
    expect(calls).toEqual(
      result === false
        ? [["error", []]]
        : [
            ["error", []],
            ["fallback", false],
          ],
    );
  }
  const sentinel = new Error("decision failure");
  const notify = [];
  const foundation = new Foundation({
    getProps: () => ({
      onError: () => {
        throw sentinel;
      },
    }),
    notifyImgState: (value) => notify.push(value),
  });
  expect(() => foundation.handleImgLoadError()).toThrow(sentinel);
  expect(notify).toEqual([]);
});

test("fixed Avatar Foundation forwards hover identity and changes focus state only through native matching", () => {
  const changes = [];
  const foundation = new Foundation({
    getProps: () => ({ children: 3 }),
    notifyEnter: (event) => changes.push(["enter", event]),
    notifyLeave: (event) => changes.push(["leave", event]),
    setFocusVisible: (value) => changes.push(["focus", value]),
    getAvatarNode: () => {
      throw new Error("non-string children must not be measured on init");
    },
  });
  foundation.init();
  const event = {};
  foundation.handleEnter(event);
  foundation.handleLeave(event);
  foundation.handleFocusVisible({
    target: {
      matches: (value) => {
        expect(value).toBe(":focus-visible");
        return false;
      },
    },
  });
  foundation.handleFocusVisible({ target: { matches: () => true } });
  foundation.handleBlur();
  foundation.destroy();
  expect(changes).toEqual([
    ["enter", event],
    ["leave", event],
    ["focus", true],
    ["focus", false],
  ]);
});
