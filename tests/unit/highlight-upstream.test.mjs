import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { findHighlightChunks } from "../../packages/semi-ui-vue/src/components/highlight/chunks.ts";

const root = new URL("../../", import.meta.url);
const sourcePath = "packages/semi-foundation/highlight/foundation.ts";
const sha = "8bed560dd3f36579f85b7a522f19762f2bace756";
const sourceHash =
  "db8c874e29b0c686831c39ea69f614430b20d409c5cbe2639b1791ab45077342";
const inputs = JSON.parse(
  await readFile(new URL("resources/upstream/sources.json", root), "utf8"),
);
const baseline = JSON.parse(
  await readFile(new URL("resources/upstream/baseline.json", root), "utf8"),
);
const source = inputs.files[sourcePath];

// Compile the pinned upstream algorithm itself. These two test-only stubs remove
// its unused base class and lodash type predicate; production never loads it.
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
const moduleRecord = { exports: {} };
const context = createContext({
  exports: moduleRecord.exports,
  module: moduleRecord,
  require(specifier) {
    if (specifier === "../base/foundation")
      return { __esModule: true, default: class TestOnlyBase {} };
    if (specifier === "lodash")
      return {
        isString: (value) =>
          typeof value === "string" ||
          Object.prototype.toString.call(value) === "[object String]",
      };
    throw new Error(`Unexpected upstream dependency: ${specifier}`);
  },
});
runInContext(compiled, context, { timeout: 1000 });
const upstream = new moduleRecord.exports.default();

function normalize(chunks) {
  return Array.from(chunks, (chunk) => ({
    start: chunk.start,
    end: chunk.end,
    highlight: chunk.highlight,
    className: chunk.className,
    style: chunk.style === undefined ? undefined : { ...chunk.style },
  }));
}

function reference(query) {
  // The upstream UI helper supplies these defaults before calling Foundation.
  return upstream.findAll({
    ...query,
    sourceString: query.sourceString === undefined ? "" : query.sourceString,
    searchWords: query.searchWords === undefined ? [] : query.searchWords,
  });
}

function assertMatches(query) {
  const actual = normalize(findHighlightChunks(query));
  expect(actual).toEqual(normalize(reference(query)));
  expect(
    actual
      .map(({ start, end }) => (query.sourceString ?? "").slice(start, end))
      .join(""),
  ).toBe(query.sourceString ?? "");
  return actual;
}

function errorName(callback) {
  try {
    callback();
    return undefined;
  } catch (error) {
    return error.name;
  }
}

describe("Highlight private matcher versus pinned upstream Foundation", () => {
  it("checks exact SHA/hash and implementation provenance before comparing", async () => {
    expect(inputs.upstream.commit).toBe(sha);
    expect(baseline.upstream.commit).toBe(sha);
    expect(baseline.inputs[sourcePath]).toBe(sourceHash);
    expect(createHash("sha256").update(source).digest("hex")).toBe(sourceHash);
    expect(source).toContain("highlight-words-core");
    const implementation = await readFile(
      new URL("packages/semi-ui-vue/src/components/highlight/chunks.ts", root),
      "utf8",
    );
    expect(implementation).toContain(sha);
    expect(implementation).toContain(sourcePath);
    expect(implementation).toContain("highlight-words-core");
    expect(implementation).not.toMatch(
      /from\s+["'](?:lodash|@douyinfe\/semi-foundation)/,
    );
    expect(compiled).toContain("findAll");
    expect(typeof upstream.findAll).toBe("function");
  });

  it("matches empty/default input, repeats, multiple words and literal metacharacters", () => {
    for (const query of [
      {},
      { sourceString: "abc" },
      { sourceString: "", searchWords: ["a"] },
      { sourceString: "abc", searchWords: [] },
      { sourceString: "abc", searchWords: ["", { text: "" }] },
      { sourceString: "aa aa", searchWords: ["a", "a"] },
      { sourceString: "aaa do dollar aaa", searchWords: ["do", "dollar"] },
      {
        sourceString: "[-]/{}()*+?.\\^$|",
        searchWords: ["[-]", "/", "{}", "()*+?", ".\\^$|"],
      },
      {
        sourceString: "<script>&lt;x&gt;</script> style { color:red }",
        searchWords: ["<script>", "&lt;x&gt;", "color:red"],
      },
      {
        sourceString: "Semi semi SEMI",
        searchWords: ["semi"],
        caseSensitive: true,
      },
      {
        sourceString: "Semi semi SEMI",
        searchWords: ["semi"],
        caseSensitive: false,
      },
      {
        sourceString: "abc",
        searchWords: undefined,
        autoEscape: undefined,
        caseSensitive: undefined,
      },
      { sourceString: undefined, searchWords: [] },
      { sourceString: "abc abc", searchWords: "abc" },
    ])
      assertMatches(query);
  });

  it("matches stable overlap/adjacency and class/style merge precedence", () => {
    const queries = [
      { sourceString: "banana", searchWords: ["ana"] },
      { sourceString: "banana", searchWords: ["ana", "nana"] },
      { sourceString: "abcd", searchWords: ["ab", "cd"] },
      {
        sourceString: "abcd",
        searchWords: [
          {
            text: "abc",
            className: "first",
            style: { color: "red", padding: "1px" },
          },
          { text: "bc", className: "second", style: { color: "blue" } },
        ],
      },
      {
        sourceString: "abcd",
        searchWords: [
          { text: "ab", className: "", style: { color: "red" } },
          { text: "abcd", className: "second", style: { color: "blue" } },
        ],
      },
    ];
    for (const query of queries) assertMatches(query);
    expect(
      assertMatches(queries[0]).filter((chunk) => chunk.highlight),
    ).toHaveLength(1);
    expect(assertMatches(queries[2])).toEqual([
      { start: 0, end: 4, highlight: true, className: undefined, style: {} },
    ]);
    const merged = assertMatches(queries[3])[0];
    expect(merged.className).toBe("first");
    expect(merged.style).toEqual({ color: "blue", padding: "1px" });
    const reverse = assertMatches({
      ...queries[4],
      searchWords: [...queries[4].searchWords].reverse(),
    });
    expect(reverse[0].style.color).toBe("red");
  });

  it("matches UTF-16 offsets and legacy regex zero-length/case behavior", () => {
    for (const query of [
      { sourceString: "设计系统设计稿", searchWords: ["设计", "系统"] },
      { sourceString: "😀x😀", searchWords: ["😀"] },
      { sourceString: "😀x😀", searchWords: ["\ud83d"] },
      { sourceString: "e\u0301 é E\u0301", searchWords: ["é", "e\u0301"] },
      { sourceString: "İ i I ı ſ s K k", searchWords: ["i", "s", "k"] },
      { sourceString: "a\nb a", searchWords: ["a|b"], autoEscape: false },
      {
        sourceString: "abcd",
        searchWords: ["^", "$", "(?=b)"],
        autoEscape: false,
      },
      { sourceString: "aba", searchWords: ["a*"], autoEscape: false },
      { sourceString: "😀x", searchWords: ["."], autoEscape: false },
    ])
      assertMatches(query);
  });

  it("preserves upstream TypeError and SyntaxError rather than swallowing invalid input", () => {
    for (const query of [
      { sourceString: "abc", searchWords: [undefined] },
      { sourceString: "abc", searchWords: [null] },
      { sourceString: "abc", searchWords: null },
      { sourceString: "abc", searchWords: ["["], autoEscape: false },
      { sourceString: "abc", searchWords: ["("], autoEscape: false },
      { sourceString: "abc", searchWords: ["\\"], autoEscape: false },
    ]) {
      const expected = errorName(() => reference(query));
      expect(expected).toMatch(/^(TypeError|SyntaxError)$/);
      expect(errorName(() => findHighlightChunks(query))).toBe(expected);
    }
  });

  it("skips sparse holes but reads inherited array indices and preserves explicit undefined errors", () => {
    const sparse = new Array(3);
    sparse[1] = "a";
    const prototype = Object.create(Array.prototype);
    Object.defineProperty(prototype, "0", {
      value: { text: "b", className: "inherited" },
      enumerable: true,
    });
    const inherited = new Array(2);
    inherited[1] = "a";
    Object.setPrototypeOf(inherited, prototype);
    for (const words of [sparse, inherited]) {
      Object.freeze(words);
      const before = Reflect.ownKeys(words);
      assertMatches({ sourceString: "aba", searchWords: words });
      expect(Reflect.ownKeys(words)).toEqual(before);
      expect(words[1]).toBe("a");
    }
    expect(Object.hasOwn(sparse, "0")).toBe(false);
    expect(Object.hasOwn(inherited, "0")).toBe(false);
    expect(
      assertMatches({ sourceString: "b", searchWords: inherited })[0].className,
    ).toBe("inherited");
    const query = { sourceString: "a", searchWords: [undefined] };
    expect(errorName(() => reference(query))).toBe("TypeError");
    expect(errorName(() => findHighlightChunks(query))).toBe("TypeError");
  });

  it("compares 320 deterministic legal generated queries without mutating caller input", () => {
    let seed = 0x8bed560d;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    const alphabet = [
      "a",
      "A",
      "b",
      " ",
      "设计",
      "😀",
      "e\u0301",
      ".",
      "[",
      "<",
      "&",
    ];
    for (let index = 0; index < 320; index++) {
      const sourceString = Array.from(
        { length: random() % 25 },
        () => alphabet[random() % alphabet.length],
      ).join("");
      const searchWords = Array.from(
        { length: random() % 7 },
        (_, wordIndex) => {
          const start = random() % (sourceString.length + 1);
          const text =
            wordIndex % 3 === 0
              ? alphabet[random() % alphabet.length]
              : sourceString.slice(start, start + (random() % 5));
          return wordIndex % 2 === 0
            ? text
            : Object.freeze({
                text,
                className: wordIndex % 3 ? `word-${wordIndex}` : "",
                style: Object.freeze({ color: wordIndex % 2 ? "red" : "blue" }),
              });
        },
      );
      const query = Object.freeze({
        sourceString,
        searchWords: Object.freeze(searchWords),
        caseSensitive: Boolean(random() % 2),
      });
      const before = JSON.stringify(query);
      assertMatches(query);
      expect(JSON.stringify(query)).toBe(before);
    }
  });
});
