import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  ref,
  shallowRef,
} from "vue";
import type { ShallowRef } from "vue";
import { For } from "vue-jsx/vapor";
import { expect, test } from "vitest";
import Highlight from "../../packages/semi-ui-vue/src/components/highlight/index.js";
import type { HighlightProps } from "../../packages/semi-ui-vue/src/components/highlight/index.js";
import { findHighlightChunks } from "../../packages/semi-ui-vue/src/components/highlight/chunks.js";
import { mountVapor } from "../support/mount-vapor.js";

const marks = (host: Element) =>
  [...host.querySelectorAll("mark")].map((node) => node.textContent);

test("Highlight defaults to plain text siblings and semantic marks without a wrapper", async () => {
  const props = shallowRef<HighlightProps>({});
  const fixture = mountVapor(
    defineVaporComponent(() => <Highlight {...props.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe("");
    expect(fixture.host.children).toHaveLength(0);
    props.value = {
      sourceString: "before Semi after SEMI",
      searchWords: ["semi"],
    };
    await nextTick();
    expect(fixture.host.textContent).toBe("before Semi after SEMI");
    expect(marks(fixture.host)).toEqual(["Semi", "SEMI"]);
    expect(fixture.host.children).toHaveLength(2);
    expect(fixture.host.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(fixture.host.querySelector("mark")?.className).toBe(
      "semi-highlight-tag",
    );
    props.value = { ...props.value, caseSensitive: true };
    await nextTick();
    expect(marks(fixture.host)).toEqual([]);
    props.value = {
      ...props.value,
      caseSensitive: undefined,
      component: undefined,
      autoEscape: undefined,
    };
    await nextTick();
    expect(marks(fixture.host)).toEqual(["Semi", "SEMI"]);
    props.value = { sourceString: "unchanged" };
    await nextTick();
    expect(fixture.host.textContent).toBe("unchanged");
    expect(fixture.host.children).toHaveLength(0);
    props.value = { sourceString: undefined, searchWords: undefined };
    await nextTick();
    expect(fixture.host.textContent).toBe("");
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("Highlight merges adjacent, overlapping and duplicate matches in stable keyword order", async () => {
  const props = shallowRef<HighlightProps>({
    sourceString: "abc abc xyz",
    searchWords: [
      { text: "ab", className: "first", style: { color: "red" } },
      {
        text: "bc",
        className: "second",
        style: { color: "blue", fontWeight: "700" },
      },
      { text: "c", className: "third" },
      { text: "xy" },
      { text: "z", className: "last" },
    ],
    highlightClassName: "custom",
    highlightStyle: { color: "green", padding: "2px" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Highlight {...props.value} />),
  );
  try {
    expect(marks(fixture.host)).toEqual(["abc", "abc", "xyz"]);
    const nodes = [...fixture.host.querySelectorAll("mark")];
    expect(nodes[0]?.className).toBe("semi-highlight-tag custom first");
    expect(nodes[2]?.className).toBe("semi-highlight-tag custom last");
    expect(nodes[0]?.style.color).toBe("blue");
    expect(nodes[0]?.style.padding).toBe("2px");
    expect(nodes[0]?.style.fontWeight).toBe("700");
    props.value = {
      sourceString: "abc",
      searchWords: ["abc", "abc", ""],
      component: "strong",
    };
    await nextTick();
    expect(fixture.host.children).toHaveLength(1);
    expect(fixture.host.querySelector("strong")?.textContent).toBe("abc");
    expect(fixture.host.querySelector<HTMLElement>("strong")?.style.color).toBe(
      "",
    );
    props.value = { ...props.value, component: "" };
    await nextTick();
    expect(marks(fixture.host)).toEqual(["abc"]);
  } finally {
    fixture.unmount();
  }
});

test("Highlight escapes regex metacharacters and keeps HTML and entities as text", async () => {
  const text =
    "<script>bad()</script><style>body{}</style>&amp; [a].*+?^$|(){}-/\\";
  const props = shallowRef<HighlightProps>({
    sourceString: text,
    searchWords: ["<script>", "&amp;", "[a].*+?^$|(){}-/\\"],
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Highlight {...props.value} />),
  );
  try {
    expect(fixture.host.textContent).toBe(text);
    expect(fixture.host.querySelectorAll("script, style, img")).toHaveLength(0);
    expect(marks(fixture.host)).toEqual([
      "<script>",
      "&amp;",
      "[a].*+?^$|(){}-/\\",
    ]);
    props.value = {
      sourceString: "Aa a1 a2",
      searchWords: ["a[0-9]"],
      autoEscape: false,
    };
    await nextTick();
    expect(marks(fixture.host)).toEqual(["a1", "a2"]);
    props.value = {
      sourceString: "abc",
      searchWords: ["^|$|(?=b)"],
      autoEscape: false,
    };
    await nextTick();
    expect(fixture.host.textContent).toBe("abc");
    expect(marks(fixture.host)).toEqual([]);
    props.value = {
      sourceString: "😀e\u0301 中文 İi",
      searchWords: ["😀", "e\u0301", "中", "i"],
    };
    await nextTick();
    expect(marks(fixture.host)).toEqual(["😀e\u0301", "中", "i"]);
    expect(fixture.host.textContent).toBe("😀e\u0301 中文 İi");
  } finally {
    fixture.unmount();
  }
});

test("Highlight does not expose attrs or execute unsupported child slots", async () => {
  let invoked = 0;
  const attrs = shallowRef({
    id: "ignored",
    class: "ignored",
    style: { color: "red" },
    innerHTML: "<img>",
    textContent: "overwrite",
    title: "ignored",
  });
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Highlight {...attrs.value} searchWords={["safe"]} sourceString="safe">
        {() => {
          invoked++;
          return <b>unsupported</b>;
        }}
      </Highlight>
    )),
  );
  try {
    const mark = fixture.host.querySelector("mark")!;
    expect(mark.textContent).toBe("safe");
    expect([...mark.attributes].map((attribute) => attribute.name)).toEqual([
      "class",
    ]);
    expect(invoked).toBe(0);
    attrs.value = { ...attrs.value, id: "later", class: "later" };
    await nextTick();
    expect(mark.hasAttribute("id")).toBe(false);
    expect(mark.className).toBe("semi-highlight-tag");
  } finally {
    fixture.unmount();
  }
});

test("Highlight keeps fragment/list/wrapper ownership under updates and remount", async () => {
  const visible = ref(true);
  const text = ref("one");
  const rows = shallowRef(["one", "two"]);
  const Wrapped = defineVaporComponent(() => (
    <>
      <Highlight searchWords={[text.value]} sourceString={text.value} />
      <em>separator</em>
      <Highlight searchWords={[]} sourceString="tail" />
    </>
  ));
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <>
        {visible.value ? <Wrapped /> : <span>hidden</span>}
        <section>
          <For getKey={(row: string) => row} in={rows.value}>
            {{
              default: (row: ShallowRef<unknown>) => (
                <p>
                  <Highlight
                    searchWords={["o"]}
                    sourceString={row.value as string}
                  />
                </p>
              ),
            }}
          </For>
        </section>
      </>
    )),
  );
  try {
    expect(fixture.host.textContent).toBe("oneseparatortailonetwo");
    text.value = "two";
    text.value = "three";
    rows.value = ["two", "other"];
    await nextTick();
    expect(fixture.host.textContent).toBe("threeseparatortailtwoother");
    expect(marks(fixture.host)).toEqual(["three", "o", "o"]);
    visible.value = false;
    await nextTick();
    expect(fixture.host.textContent).toBe("hiddentwoother");
    text.value = "again";
    visible.value = true;
    await nextTick();
    expect(fixture.host.textContent).toBe("againseparatortailtwoother");
    rows.value = [];
    await nextTick();
    expect(fixture.host.querySelector("section")?.childElementCount).toBe(0);
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("private matching preserves upstream invalid-input and UTF-16 behavior", () => {
  expect(() =>
    findHighlightChunks({
      sourceString: "a",
      searchWords: ["["],
      autoEscape: false,
    }),
  ).toThrow(SyntaxError);
  expect(() =>
    findHighlightChunks({ sourceString: "a", searchWords: [undefined] }),
  ).toThrow(TypeError);
  expect(
    findHighlightChunks({
      sourceString: "😀",
      searchWords: ["."],
      autoEscape: false,
    }),
  ).toEqual([
    { start: 0, end: 2, highlight: true, className: undefined, style: {} },
  ]);
  expect(findHighlightChunks({ sourceString: "", searchWords: [""] })).toEqual(
    [],
  );
  const keyword = Object.freeze({
    text: "a",
    className: "letter",
    style: Object.freeze({ color: "red" }),
  });
  const keywords = Object.freeze([keyword]);
  expect(
    findHighlightChunks({
      sourceString: "aaaa",
      searchWords: keywords as unknown as HighlightProps["searchWords"],
    }),
  ).toEqual([
    {
      start: 0,
      end: 4,
      highlight: true,
      className: "letter",
      style: { color: "red" },
    },
  ]);
  expect(keyword.style.color).toBe("red");
  expect(
    findHighlightChunks({
      sourceString: "a",
      searchWords: "a" as unknown as HighlightProps["searchWords"],
    }),
  ).toEqual([
    {
      start: 0,
      end: 1,
      highlight: true,
      className: undefined,
      style: undefined,
    },
  ]);
  const large = findHighlightChunks({
    sourceString: "ab ".repeat(5000),
    searchWords: ["a", "b"],
  });
  expect(large).toHaveLength(10000);
  expect(large.at(-1)).toMatchObject({
    start: 14999,
    end: 15000,
    highlight: false,
  });
});

test("Highlight updates only match decoration and restores dynamically removed defaults", async () => {
  const props = shallowRef<HighlightProps>({
    sourceString: "a.b aXb",
    searchWords: ["a.b"],
    highlightClassName: "before",
    highlightStyle: { color: "red", padding: "3px" },
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Highlight {...props.value} />),
  );
  try {
    const original = fixture.host.querySelector("mark")!;
    expect(marks(fixture.host)).toEqual(["a.b"]);
    props.value = {
      ...props.value,
      highlightClassName: "after",
      highlightStyle: { color: "blue" },
    };
    await nextTick();
    expect(fixture.host.querySelector("mark")).toBe(original);
    expect(original.className).toBe("semi-highlight-tag after");
    expect(original.style.color).toBe("blue");
    expect(original.style.padding).toBe("");
    props.value = { ...props.value, component: "strong", autoEscape: false };
    await nextTick();
    expect(
      [...fixture.host.querySelectorAll("strong")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["a.b", "aXb"]);
    props.value = { sourceString: "a.b aXb", searchWords: ["a.b"] };
    await nextTick();
    expect(marks(fixture.host)).toEqual(["a.b"]);
    const restored = fixture.host.querySelector("mark")!;
    expect(restored.className).toBe("semi-highlight-tag");
    expect(restored.style.cssText).toBe("");
    expect(fixture.host.querySelector("strong")).toBeNull();
    props.value = { ...props.value, searchWords: [""] };
    await nextTick();
    expect(fixture.host.textContent).toBe("a.b aXb");
    expect(fixture.host.children).toHaveLength(0);
    props.value = {
      sourceString: "baaa",
      searchWords: ["a*"],
      autoEscape: false,
    };
    await nextTick();
    expect(marks(fixture.host)).toEqual(["aaa"]);
    expect(fixture.host.textContent).toBe("baaa");
  } finally {
    fixture.unmount();
  }
});

test("Highlight clears text and keywords across rapid updates without stale chunks", async () => {
  const props = shallowRef<HighlightProps>({
    sourceString: "match",
    searchWords: ["match"],
  });
  const fixture = mountVapor(
    defineVaporComponent(() => <Highlight {...props.value} />),
  );
  try {
    for (let round = 0; round < 6; round++) {
      props.value = { sourceString: undefined, searchWords: ["match"] };
      await nextTick();
      expect(fixture.host.textContent).toBe("");
      expect(fixture.host.children).toHaveLength(0);
      props.value = { sourceString: "match", searchWords: ["match"] };
      props.value = { sourceString: "match", searchWords: undefined };
      await nextTick();
      expect(fixture.host.textContent).toBe("match");
      expect(marks(fixture.host)).toEqual([]);
      props.value = { sourceString: "", searchWords: ["match"] };
      props.value = { sourceString: "match", searchWords: ["match"] };
      await nextTick();
      expect(marks(fixture.host)).toEqual(["match"]);
    }
  } finally {
    fixture.unmount();
  }
  expect(fixture.host.childNodes).toHaveLength(0);
});

test("matching keeps bounded many-keyword text intact without timing assumptions", () => {
  const searchWords = Array.from(
    { length: 64 },
    (_, index) => `word${String(index).padStart(3, "0")}`,
  );
  const sourceString = `${searchWords.join(" ")} `.repeat(4);
  const chunks = findHighlightChunks({ sourceString, searchWords });
  expect(chunks.filter((chunk) => chunk.highlight)).toHaveLength(256);
  expect(
    chunks.map((chunk) => sourceString.slice(chunk.start, chunk.end)).join(""),
  ).toBe(sourceString);
  expect(chunks.every((chunk) => chunk.end > chunk.start)).toBe(true);
});

test("Highlight skips sparse keyword holes while retaining inherited array entries", async () => {
  const sparse = new Array<string>(3);
  sparse[1] = "word";
  const words = shallowRef(sparse);
  const fixture = mountVapor(
    defineVaporComponent(() => (
      <Highlight searchWords={words.value} sourceString="a word end" />
    )),
  );
  try {
    expect(marks(fixture.host)).toEqual(["word"]);
    expect(fixture.host.textContent).toBe("a word end");
    expect(0 in sparse).toBe(false);
    expect(2 in sparse).toBe(false);
    const inherited = Object.create(Array.prototype) as string[];
    Object.defineProperty(inherited, "1", { value: "end" });
    const inheritedWords = new Array<string>(3);
    Object.setPrototypeOf(inheritedWords, inherited);
    words.value = inheritedWords;
    await nextTick();
    expect(marks(fixture.host)).toEqual(["end"]);
    expect(Object.hasOwn(inheritedWords, "1")).toBe(false);
    words.value = new Array<string>(2);
    await nextTick();
    expect(marks(fixture.host)).toEqual([]);
    expect(fixture.host.textContent).toBe("a word end");
  } finally {
    fixture.unmount();
  }
});

test("Highlight tag strings stay native despite application component registrations", async () => {
  const component = ref<string | undefined>("project-hit");
  const text = ref("match tail");
  const color = ref("red");
  let replacements = 0;
  const Replacement = defineVaporComponent(() => {
    replacements++;
    return <b>REPLACED</b>;
  });
  const host = document.createElement("div");
  document.body.append(host);
  const app = createVaporApp(
    defineVaporComponent(() => (
      <Highlight
        component={component.value}
        highlightStyle={{ color: color.value }}
        searchWords={["match"]}
        sourceString={text.value}
      />
    )),
  );
  app.component("project-hit", Replacement);
  app.component("ProjectOther", Replacement);
  app.component("Mark", Replacement);
  app.mount(host);
  try {
    const initial = host.querySelector<HTMLElement>("project-hit")!;
    expect(initial?.textContent).toBe("match");
    expect(initial?.className).toBe("semi-highlight-tag");
    expect(initial?.style.color).toBe("red");
    expect(host.textContent).toBe("match tail");
    color.value = "blue";
    text.value = "match updated";
    await nextTick();
    expect(host.querySelector("project-hit")).toBe(initial);
    expect(initial.style.color).toBe("blue");
    expect(host.textContent).toBe("match updated");
    component.value = "project-other";
    await nextTick();
    expect(initial.isConnected).toBe(false);
    expect(host.querySelector("project-other")?.textContent).toBe("match");
    component.value = undefined;
    await nextTick();
    expect(host.querySelector("project-other")).toBeNull();
    expect(marks(host)).toEqual(["match"]);
    component.value = "project-hit";
    await nextTick();
    expect(host.querySelector("mark")).toBeNull();
    expect(host.querySelector("project-hit")?.textContent).toBe("match");
    expect(replacements).toBe(0);
  } finally {
    app.unmount();
    host.remove();
  }
  expect(host.childNodes).toHaveLength(0);
});
